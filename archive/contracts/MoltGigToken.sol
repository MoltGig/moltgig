// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MoltGigToken
 * @dev Governance token for MoltGig platform
 */
contract MoltGigToken is ERC20, ERC20Burnable, Ownable {
    
    // Tokenomics
    uint256 public constant MAX_SUPPLY = 100000000 * 10**18; // 100M tokens
    uint256 public constant PLATFORM_REWARDS = 40000000 * 10**18; // 40% for platform rewards
    uint256 public constant TEAM_ALLOCATION = 20000000 * 10**18; // 20% for team
    uint256 public constant COMMUNITY_TREASURY = 10000000 * 10**18; // 10% for community
    uint256 public constant LIQUIDITY = 15000000 * 10**18; // 15% for liquidity
    uint256 public constant MARKETING = 10000000 * 10**18; // 10% for marketing
    uint256 public constant SEED_INVESTORS = 5000000 * 10**18; // 5% for seed investors
    
    // Vesting schedules
    mapping(address => uint256) public teamVesting;
    mapping(address => uint256) public teamVestingReleased;
    uint256 public constant TEAM_VESTING_PERIOD = 730 days; // 2 years
    uint256 public vestingStartTime;
    
    // Governance
    mapping(address => uint256) public votingPower;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCounter = 0;
    
    struct Proposal {
        uint256 id;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        address proposer;
    }
    
    // Platform integration
    address public moltGigEscrow;
    mapping(address => bool) public rewardDistributors;
    
    // Events
    event PlatformRewardDistributed(address indexed recipient, uint256 amount);
    event GovernanceProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event GovernanceVoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event TeamVestingReleased(address indexed recipient, uint256 amount);
    
    // Modifiers
    modifier onlyRewardDistributor() {
        require(rewardDistributors[msg.sender], "Not authorized");
        _;
    }
    
    modifier onlyEscrow() {
        require(msg.sender == moltGigEscrow, "Only escrow");
        _;
    }
    
    constructor(address _treasury, address _teamWallet) ERC20("MoltGig", "MOLT") Ownable(msg.sender) {
        vestingStartTime = block.timestamp;
        
        // Mint initial supply
        _mint(address(this), MAX_SUPPLY);
        
        // Allocate tokens
        _transfer(address(this), _treasury, PLATFORM_REWARDS + COMMUNITY_TREASURY + MARKETING + LIQUIDITY);
        _transfer(address(this), _teamWallet, TEAM_ALLOCATION);
        
        // Set up team vesting
        teamVesting[_teamWallet] = TEAM_ALLOCATION;
        
        // Seed investors (can be updated later)
        // _transfer(address(this), seedInvestorWallet, SEED_INVESTORS);
    }
    
    // Platform reward distribution (from escrow fees)
    function distributePlatformReward(address recipient, uint256 amount) external onlyEscrow {
        require(amount <= PLATFORM_REWARDS, "Exceeds reward pool");
        _transfer(address(this), recipient, amount);
        emit PlatformRewardDistributed(recipient, amount);
    }
    
    // Task completion rewards
    function rewardTaskCompletion(address worker, uint256 amount) external onlyRewardDistributor {
        require(balanceOf(address(this)) >= amount, "Insufficient reward balance");
        _transfer(address(this), worker, amount);
        votingPower[worker] += amount; // Increase voting power
        emit PlatformRewardDistributed(worker, amount);
    }
    
    // Staking for additional benefits
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        _transfer(msg.sender, address(this), amount);
        votingPower[msg.sender] += amount;
    }
    
    // Unstaking
    function unstake(uint256 amount) external {
        require(votingPower[msg.sender] >= amount, "Insufficient voting power");
        votingPower[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
    }
    
    // Team vesting release
    function releaseTeamVesting() external {
        require(teamVesting[msg.sender] > 0, "No vesting");
        require(block.timestamp >= vestingStartTime + 365 days, "Vesting not started"); // 1 year cliff
        
        uint256 elapsed = block.timestamp - vestingStartTime;
        uint256 vestedAmount = (teamVesting[msg.sender] * elapsed) / TEAM_VESTING_PERIOD;
        uint256 releasable = vestedAmount - teamVestingReleased[msg.sender];
        
        require(releasable > 0, "Nothing to release");
        
        teamVestingReleased[msg.sender] += releasable;
        _transfer(address(this), msg.sender, releasable);
        
        emit TeamVestingReleased(msg.sender, releasable);
    }
    
    // Governance proposals
    function createProposal(string memory description, uint256 duration) external returns (uint256) {
        require(balanceOf(msg.sender) >= 1000 * 10**18, "Insufficient tokens"); // Min 1000 tokens
        
        proposalCounter++;
        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            executed: false,
            proposer: msg.sender
        });
        
        emit GovernanceProposalCreated(proposalCounter, msg.sender);
        return proposalCounter;
    }
    
    // Voting on proposals
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 votes = votingPower[msg.sender];
        
        if (support) {
            proposal.votesFor += votes;
        } else {
            proposal.votesAgainst += votes;
        }
        
        emit GovernanceVoteCast(proposalId, msg.sender, support, votes);
    }
    
    // Execute proposal (if passed)
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        
        proposal.executed = true;
        
        // Execute proposal logic here
        // This would depend on the specific proposal type
    }
    
    // Update escrow address
    function updateEscrow(address newEscrow) external onlyOwner {
        moltGigEscrow = newEscrow;
    }
    
    // Add reward distributor
    function addRewardDistributor(address distributor) external onlyOwner {
        rewardDistributors[distributor] = true;
    }
    
    // Remove reward distributor
    function removeRewardDistributor(address distributor) external onlyOwner {
        rewardDistributors[distributor] = false;
    }
    
    // Get governance stats
    function getGovernanceStats() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 totalVotingPower
    ) {
        uint256 active = 0;
        uint256 totalPower = 0;
        
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (!proposals[i].executed && block.timestamp <= proposals[i].endTime) {
                active++;
            }
        }
        
        // This is simplified - in reality you'd iterate through all token holders
        totalPower = totalSupply();
        
        return (proposalCounter, active, totalPower);
    }
    
    // Get user governance info
    function getUserGovernanceInfo(address user) external view returns (
        uint256 tokenBalance,
        uint256 votingPower,
        uint256 teamVestingRemaining,
        uint256 teamVestingAvailable
    ) {
        uint256 vestingRemaining = 0;
        uint256 vestingAvailable = 0;
        
        if (teamVesting[user] > 0) {
            vestingRemaining = teamVesting[user] - teamVestingReleased[user];
            
            if (block.timestamp >= vestingStartTime + 365 days) {
                uint256 elapsed = block.timestamp - vestingStartTime;
                uint256 vested = (teamVesting[user] * elapsed) / TEAM_VESTING_PERIOD;
                vestingAvailable = vested - teamVestingReleased[user];
            }
        }
        
        return (
            balanceOf(user),
            votingPower[user],
            vestingRemaining,
            vestingAvailable
        );
    }
}