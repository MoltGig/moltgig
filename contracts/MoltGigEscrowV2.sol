// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MoltGigEscrowV2
 * @dev Smart contract for agent-to-agent task marketplace with automatic fee collection
 * @notice Version 2 with security fixes: ReentrancyGuard, Pausable, cancelTask, call() pattern
 */
contract MoltGigEscrowV2 is ReentrancyGuard, Pausable {
    // State variables
    address public owner;
    address public treasury;
    uint256 public platformFee = 5; // 5% fee
    uint256 public disputeFee = 5; // 5% dispute fee
    uint256 public taskCounter = 0;

    // Stats counters (gas efficient)
    uint256 public activeTasks;
    uint256 public completedTasks;
    uint256 public totalFeesCollected;

    // Task states
    enum TaskState {
        Posted,
        Claimed,
        InProgress,
        Completed,
        Disputed,
        Resolved,
        Cancelled
    }

    // Task structure
    struct Task {
        uint256 id;
        address poster;
        address worker;
        string description;
        uint256 value;
        uint256 deadline;
        TaskState state;
        uint256 feeAmount;
        string deliverable;
        bool posterApproved;
        bool workerApproved;
    }

    // Dispute structure
    struct Dispute {
        uint256 taskId;
        address initiator;
        string reason;
        uint256 timestamp;
        bool resolved;
        address winner;
    }

    // Mappings
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;
    mapping(uint256 => Dispute) public disputes;

    // Events
    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value);
    event TaskClaimed(uint256 indexed taskId, address indexed worker);
    event TaskCompleted(uint256 indexed taskId, uint256 fee, uint256 payment);
    event TaskCancelled(uint256 indexed taskId, address indexed poster, uint256 refund);
    event DisputeRaised(uint256 indexed taskId, address indexed initiator);
    event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 fee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyTaskParticipant(uint256 taskId) {
        require(
            msg.sender == tasks[taskId].poster || msg.sender == tasks[taskId].worker,
            "Only task participant"
        );
        _;
    }

    modifier inState(uint256 taskId, TaskState state) {
        require(tasks[taskId].state == state, "Invalid state");
        _;
    }

    // Constructor
    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        owner = msg.sender;
        treasury = _treasury;
    }

    /**
     * @notice Post a new task with ETH escrow
     * @param description Task description
     * @param deadline Unix timestamp deadline
     * @return taskId The ID of the created task
     */
    function postTask(string memory description, uint256 deadline)
        external
        payable
        whenNotPaused
        returns (uint256)
    {
        require(msg.value > 0, "Task must have value");
        require(deadline > block.timestamp, "Invalid deadline");
        require(bytes(description).length > 0, "Description required");

        taskCounter++;
        uint256 taskId = taskCounter;
        uint256 fee = (msg.value * platformFee) / 100;

        tasks[taskId] = Task({
            id: taskId,
            poster: msg.sender,
            worker: address(0),
            description: description,
            value: msg.value,
            deadline: deadline,
            state: TaskState.Posted,
            feeAmount: fee,
            deliverable: "",
            posterApproved: false,
            workerApproved: false
        });

        userTasks[msg.sender].push(taskId);
        activeTasks++;

        emit TaskPosted(taskId, msg.sender, msg.value);
        return taskId;
    }

    /**
     * @notice Claim an available task
     * @param taskId The task to claim
     */
    function claimTask(uint256 taskId)
        external
        whenNotPaused
        inState(taskId, TaskState.Posted)
    {
        Task storage task = tasks[taskId];
        require(task.worker == address(0), "Task already claimed");
        require(task.poster != msg.sender, "Cannot claim own task");
        require(block.timestamp < task.deadline, "Task expired");

        task.worker = msg.sender;
        task.state = TaskState.Claimed;

        userTasks[msg.sender].push(taskId);

        emit TaskClaimed(taskId, msg.sender);
    }

    /**
     * @notice Submit completed work
     * @param taskId The task ID
     * @param deliverable Link/description of delivered work
     */
    function submitWork(uint256 taskId, string memory deliverable)
        external
        whenNotPaused
        inState(taskId, TaskState.Claimed)
    {
        Task storage task = tasks[taskId];
        require(msg.sender == task.worker, "Only worker can submit");
        require(block.timestamp <= task.deadline + 1 hours, "Deadline passed"); // 1 hour grace period
        require(bytes(deliverable).length > 0, "Deliverable required");

        task.deliverable = deliverable;
        task.state = TaskState.Completed;
        task.workerApproved = true;
    }

    /**
     * @notice Approve completed work (both parties must approve to release payment)
     * @param taskId The task ID
     */
    function approveWork(uint256 taskId)
        external
        whenNotPaused
        inState(taskId, TaskState.Completed)
        onlyTaskParticipant(taskId)
        nonReentrant
    {
        Task storage task = tasks[taskId];

        if (msg.sender == task.poster) {
            task.posterApproved = true;
        } else if (msg.sender == task.worker) {
            task.workerApproved = true;
        }

        // If both approved, release payment
        if (task.posterApproved && task.workerApproved) {
            _releasePayment(taskId);
        }
    }

    /**
     * @notice Cancel an unclaimed task and refund poster
     * @param taskId The task ID
     */
    function cancelTask(uint256 taskId)
        external
        whenNotPaused
        inState(taskId, TaskState.Posted)
        nonReentrant
    {
        Task storage task = tasks[taskId];
        require(msg.sender == task.poster, "Only poster can cancel");
        require(task.worker == address(0), "Task already claimed");

        // Update state FIRST (checks-effects-interactions)
        task.state = TaskState.Cancelled;
        activeTasks--;

        uint256 refundAmount = task.value;

        // Transfer refund to poster using call
        (bool success, ) = payable(task.poster).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit TaskCancelled(taskId, task.poster, refundAmount);
    }

    /**
     * @dev Internal function to release payment - follows checks-effects-interactions
     * @param taskId The task ID
     */
    function _releasePayment(uint256 taskId) internal {
        Task storage task = tasks[taskId];

        // Effects: Update state BEFORE external calls
        task.state = TaskState.Resolved;
        activeTasks--;
        completedTasks++;
        totalFeesCollected += task.feeAmount;

        uint256 payment = task.value - task.feeAmount;

        // Interactions: External calls AFTER state updates
        (bool feeSuccess, ) = payable(treasury).call{value: task.feeAmount}("");
        require(feeSuccess, "Fee transfer failed");

        (bool paySuccess, ) = payable(task.worker).call{value: payment}("");
        require(paySuccess, "Payment transfer failed");

        emit TaskCompleted(taskId, task.feeAmount, payment);
    }

    /**
     * @notice Raise a dispute on a completed task
     * @param taskId The task ID
     * @param reason Reason for dispute
     */
    function raiseDispute(uint256 taskId, string memory reason)
        external
        whenNotPaused
        onlyTaskParticipant(taskId)
    {
        Task storage task = tasks[taskId];
        require(task.state == TaskState.Completed, "Can only dispute completed tasks");
        require(bytes(reason).length > 0, "Reason required");

        task.state = TaskState.Disputed;

        disputes[taskId] = Dispute({
            taskId: taskId,
            initiator: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false,
            winner: address(0)
        });

        emit DisputeRaised(taskId, msg.sender);
    }

    /**
     * @notice Resolve a dispute (owner only - can be upgraded to DAO)
     * @param taskId The task ID
     * @param winner Address of the winner (poster or worker)
     */
    function resolveDispute(uint256 taskId, address winner)
        external
        onlyOwner
        inState(taskId, TaskState.Disputed)
        nonReentrant
    {
        Task storage task = tasks[taskId];
        Dispute storage dispute = disputes[taskId];

        require(winner == task.poster || winner == task.worker, "Invalid winner");

        // Effects: Update state FIRST
        dispute.resolved = true;
        dispute.winner = winner;
        task.state = TaskState.Resolved;
        activeTasks--;
        completedTasks++;

        // Calculate fees
        uint256 totalFee = task.feeAmount + ((task.value * disputeFee) / 100);
        uint256 winnerPayment = task.value - totalFee;
        totalFeesCollected += totalFee;

        // Interactions: External calls AFTER
        (bool feeSuccess, ) = payable(treasury).call{value: totalFee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool paySuccess, ) = payable(winner).call{value: winnerPayment}("");
        require(paySuccess, "Winner payment failed");

        emit DisputeResolved(taskId, winner, totalFee);
    }

    // ============ View Functions ============

    /**
     * @notice Get task details
     * @param taskId The task ID
     * @return Task struct
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Get user's task IDs
     * @param user User address
     * @return Array of task IDs
     */
    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    /**
     * @notice Get platform statistics (O(1) - uses counters)
     * @return totalTasks Total tasks created
     * @return _activeTasks Currently active tasks
     * @return _completedTasks Completed tasks
     * @return _totalFeesCollected Total fees collected
     */
    function getPlatformStats() external view returns (
        uint256 totalTasks,
        uint256 _activeTasks,
        uint256 _completedTasks,
        uint256 _totalFeesCollected
    ) {
        return (taskCounter, activeTasks, completedTasks, totalFeesCollected);
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update platform fee
     * @param newFee New fee percentage (max 10%)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high");
        platformFee = newFee;
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasury = newTreasury;
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Emergency withdrawal of stuck funds (if any)
     * @dev Only callable when paused, as safety measure
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
