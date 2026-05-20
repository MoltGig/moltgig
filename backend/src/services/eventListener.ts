import { ethers, Contract, EventLog, Log, Provider } from 'ethers';
import supabase from '../config/supabase.js';

// Contract ABI for events
const ESCROW_ABI = [
  'event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value)',
  'event TaskClaimed(uint256 indexed taskId, address indexed worker)',
  'event TaskCompleted(uint256 indexed taskId, uint256 fee, uint256 payment)',
  'event DisputeRaised(uint256 indexed taskId, address indexed initiator)',
  'event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 fee)',
];

type EscrowEventName =
  | 'TaskPosted'
  | 'TaskClaimed'
  | 'TaskCompleted'
  | 'DisputeRaised'
  | 'DisputeResolved';

type EscrowLog = EventLog | Log;

export class EventListener {
  private provider: Provider;
  private contract: Contract;
  private isListening = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastScannedBlock: number | null = null;
  private readonly processedEvents = new Set<string>();
  private readonly pollIntervalMs = Number(process.env.EVENT_POLL_INTERVAL_MS || 15_000);
  private readonly pollBlockLag = Number(process.env.EVENT_POLL_BLOCK_LAG || 2);
  private readonly pollBlockRange = Number(process.env.EVENT_POLL_BLOCK_RANGE || 50);

  constructor() {
    const rpcUrl = process.env.BASE_EVENT_RPC_URL ||
      process.env.EVENT_RPC_URL ||
      process.env.BASE_RPC_URL ||
      `https://base-mainnet.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`;
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS ||
      '0xf605936078F3d9670780a9582d53998a383f8020';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new Contract(contractAddress, ESCROW_ABI, this.provider);
  }

  /**
   * Start listening to contract events
   */
  async start() {
    if (this.isListening) {
      console.log('Event listener already running');
      return;
    }

    this.isListening = true;
    console.log('Starting contract event polling listener...');

    try {
      const latestBlock = await this.provider.getBlockNumber();
      this.lastScannedBlock = Math.max(0, latestBlock - this.pollBlockLag - 1);

      await this.pollOnce();
      this.pollTimer = setInterval(() => {
        void this.pollOnce().catch((err) => {
          console.error('Error polling contract events:', err);
        });
      }, this.pollIntervalMs);

      console.log(
        `Event polling listener started successfully from block ${this.lastScannedBlock} ` +
        `(interval=${this.pollIntervalMs}ms, lag=${this.pollBlockLag}, range=${this.pollBlockRange})`
      );
    } catch (err) {
      this.isListening = false;
      console.error('Failed to start event polling listener:', err);
      throw err;
    }
  }

  /**
   * Stop listening to events
   */
  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.contract.removeAllListeners();
    this.isListening = false;
    console.log('Event listener stopped');
  }

  /**
   * Poll contract logs instead of using JSON-RPC filter subscriptions. Public
   * Base RPCs usually support eth_getLogs, while eth_getFilterChanges can expire
   * or be disabled and made the old live listener noisy in production.
   */
  private async pollOnce() {
    if (!this.isListening) return;

    const latestBlock = await this.provider.getBlockNumber();
    const safeLatestBlock = latestBlock - this.pollBlockLag;

    if (safeLatestBlock < 0) return;

    if (this.lastScannedBlock === null) {
      this.lastScannedBlock = Math.max(0, safeLatestBlock - 1);
    }

    let fromBlock = this.lastScannedBlock + 1;
    while (fromBlock <= safeLatestBlock) {
      const toBlock = Math.min(fromBlock + this.pollBlockRange - 1, safeLatestBlock);
      await this.queryAndHandleRange(fromBlock, toBlock);
      this.lastScannedBlock = toBlock;
      fromBlock = toBlock + 1;
    }
  }

  private async queryAndHandleRange(fromBlock: number, toBlock: number) {
    const eventQueries: Array<{
      name: EscrowEventName;
      filter: ReturnType<Contract['filters'][EscrowEventName]>;
    }> = [
      { name: 'TaskPosted', filter: this.contract.filters.TaskPosted() },
      { name: 'TaskClaimed', filter: this.contract.filters.TaskClaimed() },
      { name: 'TaskCompleted', filter: this.contract.filters.TaskCompleted() },
      { name: 'DisputeRaised', filter: this.contract.filters.DisputeRaised() },
      { name: 'DisputeResolved', filter: this.contract.filters.DisputeResolved() },
    ];

    const eventBatches = await Promise.all(
      eventQueries.map(async ({ name, filter }) => ({
        name,
        events: await this.contract.queryFilter(filter, fromBlock, toBlock),
      }))
    );

    const orderedEvents = eventBatches
      .flatMap(({ name, events }) => events.map((event) => ({ name, event })))
      .sort((a, b) => {
        const blockDiff = a.event.blockNumber - b.event.blockNumber;
        if (blockDiff !== 0) return blockDiff;
        return this.eventIndex(a.event) - this.eventIndex(b.event);
      });

    for (const { name, event } of orderedEvents) {
      const eventId = this.eventId(event);
      if (this.processedEvents.has(eventId)) continue;
      this.rememberProcessedEvent(eventId);
      await this.handleContractEvent(name, event);
    }
  }

  private async handleContractEvent(name: EscrowEventName, event: EscrowLog) {
    if (!('args' in event)) {
      console.warn(`Skipping ${name} log without decoded args: ${this.eventId(event)}`);
      return;
    }

    const args = event.args;
    const txHash = event.transactionHash;

    switch (name) {
      case 'TaskPosted': {
        const [taskId, poster, value] = args;
        console.log(`TaskPosted: taskId=${taskId}, poster=${poster}, value=${value}`);
        await this.handleTaskPosted(
          Number(taskId),
          String(poster).toLowerCase(),
          value.toString(),
          txHash
        );
        break;
      }
      case 'TaskClaimed': {
        const [taskId, worker] = args;
        console.log(`TaskClaimed: taskId=${taskId}, worker=${worker}`);
        await this.handleTaskClaimed(
          Number(taskId),
          String(worker).toLowerCase(),
          txHash
        );
        break;
      }
      case 'TaskCompleted': {
        const [taskId, fee, payment] = args;
        console.log(`TaskCompleted: taskId=${taskId}, fee=${fee}, payment=${payment}`);
        await this.handleTaskCompleted(
          Number(taskId),
          fee.toString(),
          payment.toString(),
          txHash
        );
        break;
      }
      case 'DisputeRaised': {
        const [taskId, initiator] = args;
        console.log(`DisputeRaised: taskId=${taskId}, initiator=${initiator}`);
        await this.handleDisputeRaised(
          Number(taskId),
          String(initiator).toLowerCase(),
          txHash
        );
        break;
      }
      case 'DisputeResolved': {
        const [taskId, winner, fee] = args;
        console.log(`DisputeResolved: taskId=${taskId}, winner=${winner}, fee=${fee}`);
        await this.handleDisputeResolved(
          Number(taskId),
          String(winner).toLowerCase(),
          fee.toString(),
          txHash
        );
        break;
      }
    }
  }

  private eventId(event: EscrowLog): string {
    return `${event.transactionHash}:${this.eventIndex(event)}`;
  }

  private eventIndex(event: EscrowLog): number {
    const indexedEvent = event as EscrowLog & { index?: number; logIndex?: number };
    return indexedEvent.index ?? indexedEvent.logIndex ?? 0;
  }

  private rememberProcessedEvent(eventId: string) {
    this.processedEvents.add(eventId);
    if (this.processedEvents.size <= 5_000) return;

    const oldestEventId = this.processedEvents.values().next().value as string | undefined;
    if (oldestEventId) {
      this.processedEvents.delete(oldestEventId);
    }
  }

  /**
   * Handle TaskPosted event - update task status to 'funded'
   */
  private async handleTaskPosted(
    chainTaskId: number,
    posterWallet: string,
    value: string,
    txHash: string
  ) {
    try {
      // Find task by chain_task_id first. If the on-chain event arrives before
      // the API fund callback writes chain_task_id, match a single pending DB
      // task for the same requester and reward instead of creating a duplicate.
      const { data: task } = await supabase
        .from('tasks')
        .select('id, requester_id')
        .eq('chain_task_id', chainTaskId)
        .single();

      if (task) {
        // Update existing task
        await supabase
          .from('tasks')
          .update({
            status: 'funded',
            reward_wei: value,
          })
          .eq('id', task.id);

        // Record transaction
        await this.recordTransaction(task.id, txHash, 'fund', posterWallet, null, value);
      } else {
        let agentId: string | null = null;
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('wallet_address', posterWallet)
          .single();

        if (agent) {
          agentId = agent.id;
        } else {
          const { data: newAgent } = await supabase
            .from('agents')
            .insert({ wallet_address: posterWallet })
            .select()
            .single();
          agentId = newAgent?.id || null;
        }

        if (agentId) {
          const { data: pendingTasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('requester_id', agentId)
            .eq('reward_wei', value)
            .is('chain_task_id', null)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(2);

          if (pendingTasks?.length === 1) {
            await supabase
              .from('tasks')
              .update({
                chain_task_id: chainTaskId,
                status: 'funded',
                reward_wei: value,
              })
              .eq('id', pendingTasks[0].id);

            await this.recordTransaction(pendingTasks[0].id, txHash, 'fund', posterWallet, null, value);
            return;
          }

          if ((pendingTasks?.length || 0) > 1) {
            console.warn(
              `Ambiguous TaskPosted match for chain task ${chainTaskId}; waiting for API funding callback`
            );
            return;
          }
        }

        // Task was created directly on-chain, create DB record.
        const { data: newTask } = await supabase
          .from('tasks')
          .insert({
            chain_task_id: chainTaskId,
            requester_id: agentId,
            title: `On-chain Task #${chainTaskId}`,
            reward_wei: value,
            status: 'funded',
          })
          .select()
          .single();

        if (newTask) {
          await this.recordTransaction(newTask.id, txHash, 'fund', posterWallet, null, value);
        }
      }
    } catch (err) {
      console.error('Error handling TaskPosted:', err);
    }
  }

  /**
   * Handle TaskClaimed event - update task with worker
   */
  private async handleTaskClaimed(
    chainTaskId: number,
    workerWallet: string,
    txHash: string
  ) {
    try {
      // Find or create worker agent
      let workerId: string | null = null;
      const { data: worker } = await supabase
        .from('agents')
        .select('id')
        .eq('wallet_address', workerWallet)
        .single();

      if (worker) {
        workerId = worker.id;
      } else {
        const { data: newWorker } = await supabase
          .from('agents')
          .insert({ wallet_address: workerWallet })
          .select()
          .single();
        workerId = newWorker?.id || null;
      }

      // Update task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          worker_id: workerId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('chain_task_id', chainTaskId);

      if (updateError) {
        console.error('Failed to update claimed task:', updateError);
      }

      // TaskClaimed is a lifecycle event, not a payment event. Do not insert a
      // transaction row here; the transaction table is reserved for value flow.
    } catch (err) {
      console.error('Error handling TaskClaimed:', err);
    }
  }

  /**
   * Handle TaskCompleted event - finalize task and update stats
   */
  private async handleTaskCompleted(
    chainTaskId: number,
    fee: string,
    payment: string,
    txHash: string
  ) {
    try {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, worker_id, requester_id')
        .eq('chain_task_id', chainTaskId)
        .single();

      if (!task) return;

      // Update task status
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      // Get worker wallet for transaction record
      const { data: worker } = await supabase
        .from('agents')
        .select('wallet_address, tasks_completed')
        .eq('id', task.worker_id)
        .single();

      if (worker) {
        // Record payment transaction
        const transactionRecorded = await this.recordTransaction(
          task.id,
          txHash,
          'complete',
          process.env.ESCROW_CONTRACT_ADDRESS || '',
          worker.wallet_address,
          payment,
          fee
        );

        if (transactionRecorded) {
          // Update worker stats only once per completed transaction.
          await supabase
            .from('agents')
            .update({
              tasks_completed: (worker.tasks_completed || 0) + 1,
              last_active: new Date().toISOString(),
            })
            .eq('id', task.worker_id);
        }
      }

      // Update submission status
      await supabase
        .from('submissions')
        .update({ status: 'approved' })
        .eq('task_id', task.id)
        .eq('status', 'pending');
    } catch (err) {
      console.error('Error handling TaskCompleted:', err);
    }
  }

  /**
   * Handle DisputeRaised event
   */
  private async handleDisputeRaised(
    chainTaskId: number,
    initiatorWallet: string,
    txHash: string
  ) {
    try {
      await supabase
        .from('tasks')
        .update({ status: 'disputed' })
        .eq('chain_task_id', chainTaskId);
    } catch (err) {
      console.error('Error handling DisputeRaised:', err);
    }
  }

  /**
   * Handle DisputeResolved event
   */
  private async handleDisputeResolved(
    chainTaskId: number,
    winnerWallet: string,
    fee: string,
    txHash: string
  ) {
    try {
      const { data: task } = await supabase
        .from('task_listings')
        .select('id, requester_wallet, worker_wallet')
        .eq('chain_task_id', chainTaskId)
        .single();

      if (task) {
        const winner = winnerWallet.toLowerCase();
        const workerWon = task.worker_wallet?.toLowerCase() === winner;
        const requesterWon = task.requester_wallet?.toLowerCase() === winner;

        await supabase
          .from('tasks')
          .update({
            status: workerWon ? 'completed' : 'cancelled',
            completed_at: workerWon ? new Date().toISOString() : null,
          })
          .eq('id', task.id);

        await this.recordTransaction(
          task.id,
          txHash,
          workerWon ? 'dispute_resolve' : 'refund',
          process.env.ESCROW_CONTRACT_ADDRESS || '',
          winnerWallet,
          null,
          fee
        );

        if (!workerWon && !requesterWon) {
          console.warn(`DisputeResolved winner ${winnerWallet} did not match requester or worker for task ${task.id}`);
        }
      }
    } catch (err) {
      console.error('Error handling DisputeResolved:', err);
    }
  }

  /**
   * Record transaction in database
   */
  private async recordTransaction(
    taskId: string,
    txHash: string,
    txType: 'fund' | 'complete' | 'refund' | 'dispute_resolve',
    fromAddress: string,
    toAddress: string | null,
    amountWei: string | null,
    feeWei: string | null = null
  ): Promise<boolean> {
    try {
      // Check if transaction already recorded
      const { data: existing } = await supabase
        .from('transactions')
        .select('id, fee_wei')
        .eq('tx_hash', txHash)
        .single();

      if (existing) {
        if (feeWei && !existing.fee_wei) {
          await supabase
            .from('transactions')
            .update({ fee_wei: feeWei })
            .eq('id', existing.id);
        }
        return false; // Already recorded
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          task_id: taskId,
          tx_hash: txHash,
          tx_type: txType,
          from_address: fromAddress.toLowerCase(),
          to_address: toAddress?.toLowerCase() || null,
          amount_wei: amountWei,
          fee_wei: feeWei,
          status: 'confirmed',
        });
      if (insertError) {
        console.error('Error recording transaction:', insertError);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error recording transaction:', err);
      return false;
    }
  }
}

// Singleton instance
export const eventListener = new EventListener();
export default eventListener;
