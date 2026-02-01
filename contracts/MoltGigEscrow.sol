// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MoltGigEscrow
 * @dev Smart contract for agent-to-agent task marketplace with automatic fee collection
 */
contract MoltGigEscrow {
    // State variables
    address public owner;
    address public treasury;
    uint256 public platformFee = 5; // 5% fee
    uint256 public disputeFee = 5; // 5% dispute fee
    uint256 public taskCounter = 0;
    
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
    
    // Mappings
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;
    mapping(uint256 => Dispute) public disputes;
    
    // Dispute structure
    struct Dispute {
        uint256 taskId;
        address initiator;
        string reason;
        uint256 timestamp;
        bool resolved;
        address winner;
    }
    
    // Events
    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value);
    event TaskClaimed(uint256 indexed taskId, address indexed worker);
    event TaskCompleted(uint256 indexed taskId, uint256 fee, uint256 payment);
    event DisputeRaised(uint256 indexed taskId, address indexed initiator);
    event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 fee);
    
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
        owner = msg.sender;
        treasury = _treasury;
    }
    
    // Post a new task
    function postTask(string memory description, uint256 deadline) external payable returns (uint256) {
        require(msg.value > 0, "Task must have value");
        require(deadline > block.timestamp, "Invalid deadline");
        
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
        
        emit TaskPosted(taskId, msg.sender, msg.value);
        return taskId;
    }
    
    // Claim a task
    function claimTask(uint256 taskId) external inState(taskId, TaskState.Posted) {
        Task storage task = tasks[taskId];
        require(task.worker == address(0), "Task already claimed");
        require(task.poster != msg.sender, "Cannot claim own task");
        
        task.worker = msg.sender;
        task.state = TaskState.Claimed;
        
        userTasks[msg.sender].push(taskId);
        
        emit TaskClaimed(taskId, msg.sender);
    }
    
    // Submit completed work
    function submitWork(uint256 taskId, string memory deliverable) 
        external 
        inState(taskId, TaskState.Claimed) 
    {
        Task storage task = tasks[taskId];
        require(msg.sender == task.worker, "Only worker can submit");
        require(block.timestamp <= task.deadline, "Deadline passed");
        
        task.deliverable = deliverable;
        task.state = TaskState.Completed;
        task.workerApproved = true;
    }
    
    // Approve completed work (both parties must approve)
    function approveWork(uint256 taskId) 
        external 
        inState(taskId, TaskState.Completed) 
        onlyTaskParticipant(taskId) 
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
    
    // Internal function to release payment
    function _releasePayment(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        
        uint256 payment = task.value - task.feeAmount;
        
        // Transfer fee to treasury
        payable(treasury).transfer(task.feeAmount);
        
        // Transfer payment to worker
        payable(task.worker).transfer(payment);
        
        task.state = TaskState.Resolved;
        
        emit TaskCompleted(taskId, task.feeAmount, payment);
    }
    
    // Raise a dispute
    function raiseDispute(uint256 taskId, string memory reason) 
        external 
        onlyTaskParticipant(taskId) 
    {
        Task storage task = tasks[taskId];
        require(task.state == TaskState.Completed, "Can only dispute completed tasks");
        
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
    
    // Resolve dispute (owner only for now - can be upgraded to DAO)
    function resolveDispute(uint256 taskId, address winner) 
        external 
        onlyOwner 
        inState(taskId, TaskState.Disputed) 
    {
        Task storage task = tasks[taskId];
        Dispute storage dispute = disputes[taskId];
        
        require(winner == task.poster || winner == task.worker, "Invalid winner");
        
        dispute.resolved = true;
        dispute.winner = winner;
        
        // Calculate dispute fee
        uint256 totalFee = task.feeAmount + ((task.value * disputeFee) / 100);
        uint256 winnerPayment = task.value - totalFee;
        
        // Transfer fees to treasury
        payable(treasury).transfer(totalFee);
        
        // Transfer remaining to winner
        payable(winner).transfer(winnerPayment);
        
        task.state = TaskState.Resolved;
        
        emit DisputeResolved(taskId, winner, totalFee);
    }
    
    // Get task details
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
    
    // Get user's tasks
    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }
    
    // Update platform fee (owner only)
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
    
    // Update treasury address (owner only)
    function updateTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }
    
    // Emergency pause (owner only)
    function pause() external onlyOwner {
        // Implementation for emergency pause functionality
    }
    
    // Get platform stats
    function getPlatformStats() external view returns (
        uint256 totalTasks,
        uint256 activeTasks,
        uint256 completedTasks,
        uint256 totalFeesCollected
    ) {
        uint256 active = 0;
        uint256 completed = 0;
        uint256 totalFees = 0;
        
        for (uint256 i = 1; i <= taskCounter; i++) {
            Task storage task = tasks[i];
            if (task.state == TaskState.Posted || task.state == TaskState.Claimed) {
                active++;
            } else if (task.state == TaskState.Resolved) {
                completed++;
                totalFees += task.feeAmount;
            }
        }
        
        return (taskCounter, active, completed, totalFees);
    }
}