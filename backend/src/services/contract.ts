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
export const CONTRACT_TO_DB_STATE: Record<number, string> = {
  [ContractTaskState.Posted]: 'funded',      // Posted on-chain = funded
  [ContractTaskState.Claimed]: 'accepted',
  [ContractTaskState.InProgress]: 'accepted',
  [ContractTaskState.Completed]: 'submitted',
  [ContractTaskState.Disputed]: 'disputed',
  [ContractTaskState.Resolved]: 'completed',
  [ContractTaskState.Cancelled]: 'cancelled',
};

export function contractTaskStateToDbStatus(state: number): string {
  return CONTRACT_TO_DB_STATE[state] || 'open';
}

export interface ContractPaymentEvent {
  chainTaskId: number;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  txType: 'complete' | 'refund' | 'dispute_resolve';
  fromAddress: string;
  toAddress: string | null;
  amountWei: string | null;
  feeWei: string | null;
  winnerAddress?: string | null;
}

export class ContractService {
  private provider: Provider;
  private contract: Contract;
  private contractAddress: string;
  private wallet: Wallet | null = null;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL ||
      `https://base-mainnet.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`;
    this.contractAddress = process.env.ESCROW_CONTRACT_ADDRESS ||
      '0xf605936078F3d9670780a9582d53998a383f8020';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new Contract(this.contractAddress, ESCROW_ABI, this.provider);

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

  async verifyTaskPostedTransaction(
    txHash: string,
    expectedPoster: string,
    expectedValueWei: string,
    expectedChainTaskId?: number
  ) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error('Funding transaction is not mined yet');
    }
    if (receipt.status !== 1) {
      throw new Error('Funding transaction failed on-chain');
    }

    const taskPostedLog = receipt.logs
      .filter((log) => log.address.toLowerCase() === this.contractAddress.toLowerCase())
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === 'TaskPosted');

    if (!taskPostedLog) {
      throw new Error('Funding transaction did not emit TaskPosted for MoltGig escrow');
    }

    const chainTaskId = Number(taskPostedLog.args.taskId);
    const poster = String(taskPostedLog.args.poster).toLowerCase();
    const value = taskPostedLog.args.value.toString();

    if (poster !== expectedPoster.toLowerCase()) {
      throw new Error('Funding transaction poster does not match requester');
    }
    if (value !== expectedValueWei) {
      throw new Error('Funding transaction value does not match task reward');
    }
    if (expectedChainTaskId !== undefined && expectedChainTaskId !== chainTaskId) {
      throw new Error('Funding transaction task id does not match request');
    }

    return {
      chainTaskId,
      poster,
      value,
      blockNumber: receipt.blockNumber,
      txHash,
    };
  }

  private getEventBackfillFromBlock(): number {
    const rawValue = process.env.ESCROW_CONTRACT_DEPLOY_BLOCK || process.env.CONTRACT_DEPLOY_BLOCK || '0';
    const fromBlock = Number(rawValue);
    if (!Number.isFinite(fromBlock) || fromBlock < 0) {
      throw new Error('Invalid ESCROW_CONTRACT_DEPLOY_BLOCK/CONTRACT_DEPLOY_BLOCK');
    }
    return Math.floor(fromBlock);
  }

  private getEventBackfillChunkSize(): number {
    const rawValue = process.env.ESCROW_EVENT_BACKFILL_CHUNK_SIZE || '100000';
    const chunkSize = Number(rawValue);
    if (!Number.isFinite(chunkSize) || chunkSize < 1) {
      throw new Error('Invalid ESCROW_EVENT_BACKFILL_CHUNK_SIZE');
    }
    return Math.floor(chunkSize);
  }

  private sortEventsByChainOrder(events: Array<any>): Array<any> {
    return [...events].sort((a, b) => {
      if ((a.blockNumber || 0) !== (b.blockNumber || 0)) {
        return (a.blockNumber || 0) - (b.blockNumber || 0);
      }
      return (a.index ?? a.logIndex ?? 0) - (b.index ?? b.logIndex ?? 0);
    });
  }

  private async queryLatestPaymentEventInChunks(chainTaskId: number): Promise<{ eventName: 'TaskCompleted' | 'DisputeResolved'; event: any } | null> {
    const fromBlock = this.getEventBackfillFromBlock();
    const latestBlock = await this.provider.getBlockNumber();
    const chunkSize = this.getEventBackfillChunkSize();
    const filters = this.contract.filters as any;

    // Scan backwards so recent repairs finish quickly, while avoiding provider
    // getLogs range limits on Base mainnet.
    for (let endBlock = latestBlock; endBlock >= fromBlock; endBlock -= chunkSize) {
      const startBlock = Math.max(fromBlock, endBlock - chunkSize + 1);
      const [completedEvents, disputeResolvedEvents] = await Promise.all([
        this.contract.queryFilter(filters.TaskCompleted(BigInt(chainTaskId)), startBlock, endBlock) as Promise<Array<any>>,
        this.contract.queryFilter(filters.DisputeResolved(BigInt(chainTaskId)), startBlock, endBlock) as Promise<Array<any>>,
      ]);
      const latestInChunk = this.sortEventsByChainOrder([
        ...completedEvents.map((event) => ({ eventName: 'TaskCompleted' as const, event })),
        ...disputeResolvedEvents.map((event) => ({ eventName: 'DisputeResolved' as const, event })),
      ]).at(-1);

      if (latestInChunk) {
        return latestInChunk;
      }
    }

    return null;
  }

  /**
   * Find the chain event that proves an escrow-backed task paid out or refunded.
   *
   * This is used by explicit admin reconciliation repair after listener downtime.
   * It does not infer payment finality from task state alone; it requires the
   * concrete event log and transaction hash.
   */
  async findPaymentEventForTask(
    chainTaskId: number,
    workerWallet?: string | null
  ): Promise<ContractPaymentEvent | null> {
    const paymentEvent = await this.queryLatestPaymentEventInChunks(chainTaskId);

    if (!paymentEvent) {
      return null;
    }

    if (paymentEvent.eventName === 'TaskCompleted') {
      const completedEvent = paymentEvent.event;
      const chainTask = await this.getTask(chainTaskId);
      const chainWorker = chainTask.worker === ethers.ZeroAddress ? null : chainTask.worker.toLowerCase();

      return {
        chainTaskId,
        txHash: completedEvent.transactionHash,
        blockNumber: completedEvent.blockNumber,
        logIndex: completedEvent.index ?? completedEvent.logIndex ?? 0,
        txType: 'complete',
        fromAddress: this.contractAddress,
        toAddress: chainWorker || workerWallet?.toLowerCase() || null,
        amountWei: completedEvent.args.payment?.toString() || null,
        feeWei: completedEvent.args.fee?.toString() || null,
      };
    }

    const disputeResolvedEvent = paymentEvent.event;
    const chainTask = await this.getTask(chainTaskId);
    const chainWorker = chainTask.worker === ethers.ZeroAddress ? null : chainTask.worker.toLowerCase();
    const winnerAddress = String(disputeResolvedEvent.args.winner || '').toLowerCase();
    const normalizedWorker = workerWallet?.toLowerCase() || null;
    const effectiveWorker = chainWorker || normalizedWorker;
    const workerWon = effectiveWorker !== null && winnerAddress === effectiveWorker;

    return {
      chainTaskId,
      txHash: disputeResolvedEvent.transactionHash,
      blockNumber: disputeResolvedEvent.blockNumber,
      logIndex: disputeResolvedEvent.index ?? disputeResolvedEvent.logIndex ?? 0,
      txType: workerWon ? 'dispute_resolve' : 'refund',
      fromAddress: this.contractAddress,
      toAddress: winnerAddress || null,
      amountWei: null,
      feeWei: disputeResolvedEvent.args.fee?.toString() || null,
      winnerAddress,
    };
  }

  /**
   * Record a confirmed payment/refund event recovered from chain logs.
   * Returns false when the tx hash already exists, keeping the operation idempotent.
   */
  async recordBackfilledPaymentEvent(taskId: string, event: ContractPaymentEvent): Promise<boolean> {
    const { data: existing, error: existingError } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', event.txHash)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        task_id: taskId,
        tx_hash: event.txHash,
        tx_type: event.txType,
        from_address: event.fromAddress.toLowerCase(),
        to_address: event.toAddress?.toLowerCase() || null,
        amount_wei: event.amountWei,
        fee_wei: event.feeWei,
        block_number: event.blockNumber,
        status: 'confirmed',
      });

    if (error) {
      if (error.code === '23505') {
        return false;
      }
      throw error;
    }

    return true;
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
    amountWei: string | null,
    feeWei: string | null = null
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
        fee_wei: feeWei,
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
      const dbStatus = contractTaskStateToDbStatus(chainTask.state);

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

      if (dbStatus === 'submitted' && workerId) {
        const { data: existingSubmissions, error: existingSubmissionError } = await supabase
          .from('submissions')
          .select('id')
          .eq('task_id', dbTaskId)
          .limit(1);

        if (existingSubmissionError) {
          console.error('Failed to check synced submission:', existingSubmissionError);
        } else if (!existingSubmissions || existingSubmissions.length === 0) {
          const { error: submissionError } = await supabase
            .from('submissions')
            .insert({
              task_id: dbTaskId,
              worker_id: workerId,
              content: chainTask.deliverable || 'Synced on-chain deliverable',
              attachments: [],
              status: 'pending',
            });

          if (submissionError) {
            console.error('Failed to create synced submission:', submissionError);
          }
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
