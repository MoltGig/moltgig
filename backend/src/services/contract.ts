import { ethers, Contract, Provider, Wallet } from 'ethers';
import supabase from '../config/supabase.js';

// Contract ABI - key functions only
const ESCROW_ABI = [
  // View functions
  'function taskCounter() view returns (uint256)',
  'function tasks(uint256) view returns (uint256 id, address poster, address worker, string description, uint256 value, uint256 deadline, uint8 state, uint256 feeAmount, string deliverable, bool posterApproved, bool workerApproved)',
  'function getTask(uint256 taskId) view returns (tuple(uint256 id, address poster, address worker, string description, uint256 value, uint256 deadline, uint8 state, uint256 feeAmount, string deliverable, bool posterApproved, bool workerApproved))',
  'function getUserTasks(address user) view returns (uint256[])',
  'function getPlatformStats() view returns (uint256 totalTasks, uint256 activeTasks, uint256 completedTasks, uint256 totalFeesCollected)',
  'function platformFee() view returns (uint256)',
  'function treasury() view returns (address)',
  
  // Write functions
  'function postTask(string description, uint256 deadline) payable returns (uint256)',
  'function claimTask(uint256 taskId)',
  'function submitWork(uint256 taskId, string deliverable)',
  'function approveWork(uint256 taskId)',
  'function raiseDispute(uint256 taskId, string reason)',
  'function resolveDispute(uint256 taskId, address winner)',
  
  // Events
  'event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value)',
  'event TaskClaimed(uint256 indexed taskId, address indexed worker)',
  'event TaskCompleted(uint256 indexed taskId, uint256 fee, uint256 payment)',
  'event DisputeRaised(uint256 indexed taskId, address indexed initiator)',
  'event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 fee)',
];

// Task state enum matching contract
export enum ContractTaskState {
  Posted = 0,
  Claimed = 1,
  InProgress = 2,
  Completed = 3,
  Disputed = 4,
  Resolved = 5,
  Cancelled = 6,
}

// Map contract states to our database states
const CONTRACT_TO_DB_STATE: Record<number, string> = {
  [ContractTaskState.Posted]: 'funded',      // Posted on-chain = funded
  [ContractTaskState.Claimed]: 'accepted',
  [ContractTaskState.InProgress]: 'accepted',
  [ContractTaskState.Completed]: 'submitted',
  [ContractTaskState.Disputed]: 'disputed',
  [ContractTaskState.Resolved]: 'completed',
  [ContractTaskState.Cancelled]: 'cancelled',
};

export class ContractService {
  private provider: Provider;
  private contract: Contract;
  private wallet: Wallet | null = null;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL || 
      `https://base-sepolia.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`;
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || 
      '0xf605936078F3d9670780a9582d53998a383f8020';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new Contract(contractAddress, ESCROW_ABI, this.provider);

    // If we have a private key, create a wallet for write operations
    if (process.env.MOLTGIG_DEPLOYER_PRIVATE_KEY) {
      this.wallet = new Wallet(process.env.MOLTGIG_DEPLOYER_PRIVATE_KEY, this.provider);
    }
  }

  /**
   * Get contract instance with signer for write operations
   */
  private getSignedContract(): Contract {
    if (!this.wallet) {
      throw new Error('No wallet configured for write operations');
    }
    return this.contract.connect(this.wallet) as Contract;
  }

  /**
   * Get task from contract
   */
  async getTask(chainTaskId: number) {
    const task = await this.contract.getTask(chainTaskId);
    return {
      id: Number(task.id),
      poster: task.poster,
      worker: task.worker,
      description: task.description,
      value: task.value.toString(),
      deadline: Number(task.deadline),
      state: Number(task.state),
      feeAmount: task.feeAmount.toString(),
      deliverable: task.deliverable,
      posterApproved: task.posterApproved,
      workerApproved: task.workerApproved,
    };
  }

  /**
   * Get platform stats from contract
   */
  async getPlatformStats() {
    const stats = await this.contract.getPlatformStats();
    return {
      totalTasks: Number(stats.totalTasks),
      activeTasks: Number(stats.activeTasks),
      completedTasks: Number(stats.completedTasks),
      totalFeesCollected: stats.totalFeesCollected.toString(),
    };
  }

  /**
   * Get current task counter
   */
  async getTaskCounter(): Promise<number> {
    return Number(await this.contract.taskCounter());
  }

  /**
   * Record a transaction in the database
   */
  async recordTransaction(
    taskId: string | null,
    txHash: string,
    txType: 'fund' | 'complete' | 'refund' | 'dispute_resolve',
    fromAddress: string,
    toAddress: string | null,
    amountWei: string | null
  ) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        task_id: taskId,
        tx_hash: txHash,
        tx_type: txType,
        from_address: fromAddress.toLowerCase(),
        to_address: toAddress?.toLowerCase() || null,
        amount_wei: amountWei,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to record transaction:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update transaction status after confirmation
   */
  async confirmTransaction(txHash: string, blockNumber: number) {
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'confirmed',
        block_number: blockNumber,
      })
      .eq('tx_hash', txHash);

    if (error) {
      console.error('Failed to confirm transaction:', error);
    }
  }

  /**
   * Sync task state from chain to database
   */
  async syncTaskFromChain(chainTaskId: number, dbTaskId: string) {
    try {
      const chainTask = await this.getTask(chainTaskId);
      const dbStatus = CONTRACT_TO_DB_STATE[chainTask.state] || 'open';

      // Find or create worker agent if claimed
      let workerId: string | null = null;
      if (chainTask.worker !== ethers.ZeroAddress) {
        const { data: worker } = await supabase
          .from('agents')
          .select('id')
          .eq('wallet_address', chainTask.worker.toLowerCase())
          .single();

        if (worker) {
          workerId = worker.id;
        } else {
          // Create agent record for worker
          const { data: newWorker } = await supabase
            .from('agents')
            .insert({ wallet_address: chainTask.worker.toLowerCase() })
            .select()
            .single();
          workerId = newWorker?.id || null;
        }
      }

      // Update task in database
      const { error } = await supabase
        .from('tasks')
        .update({
          chain_task_id: chainTaskId,
          status: dbStatus,
          worker_id: workerId,
          reward_wei: chainTask.value,
        })
        .eq('id', dbTaskId);

      if (error) {
        console.error('Failed to sync task:', error);
      }

      return { chainTask, dbStatus };
    } catch (err) {
      console.error('Error syncing task from chain:', err);
      throw err;
    }
  }
}

// Singleton instance
export const contractService = new ContractService();
export default contractService;
