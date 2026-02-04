import { ethers, Contract, Provider } from 'ethers';
import supabase from '../config/supabase.js';

// Contract ABI for events
const ESCROW_ABI = [
  'event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value)',
  'event TaskClaimed(uint256 indexed taskId, address indexed worker)',
  'event TaskCompleted(uint256 indexed taskId, uint256 fee, uint256 payment)',
  'event DisputeRaised(uint256 indexed taskId, address indexed initiator)',
  'event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 fee)',
];

export class EventListener {
  private provider: Provider;
  private contract: Contract;
  private isListening = false;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL || 
      `https://base-sepolia.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`;
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
    console.log('Starting contract event listener...');

    // TaskPosted event
    this.contract.on('TaskPosted', async (taskId, poster, value, event) => {
      console.log(`TaskPosted: taskId=${taskId}, poster=${poster}, value=${value}`);
      await this.handleTaskPosted(
        Number(taskId),
        poster.toLowerCase(),
        value.toString(),
        event.log.transactionHash
      );
    });

    // TaskClaimed event
    this.contract.on('TaskClaimed', async (taskId, worker, event) => {
      console.log(`TaskClaimed: taskId=${taskId}, worker=${worker}`);
      await this.handleTaskClaimed(
        Number(taskId),
        worker.toLowerCase(),
        event.log.transactionHash
      );
    });

    // TaskCompleted event
    this.contract.on('TaskCompleted', async (taskId, fee, payment, event) => {
      console.log(`TaskCompleted: taskId=${taskId}, fee=${fee}, payment=${payment}`);
      await this.handleTaskCompleted(
        Number(taskId),
        fee.toString(),
        payment.toString(),
        event.log.transactionHash
      );
    });

    // DisputeRaised event
    this.contract.on('DisputeRaised', async (taskId, initiator, event) => {
      console.log(`DisputeRaised: taskId=${taskId}, initiator=${initiator}`);
      await this.handleDisputeRaised(
        Number(taskId),
        initiator.toLowerCase(),
        event.log.transactionHash
      );
    });

    // DisputeResolved event
    this.contract.on('DisputeResolved', async (taskId, winner, fee, event) => {
      console.log(`DisputeResolved: taskId=${taskId}, winner=${winner}, fee=${fee}`);
      await this.handleDisputeResolved(
        Number(taskId),
        winner.toLowerCase(),
        fee.toString(),
        event.log.transactionHash
      );
    });

    console.log('Event listener started successfully');
  }

  /**
   * Stop listening to events
   */
  stop() {
    this.contract.removeAllListeners();
    this.isListening = false;
    console.log('Event listener stopped');
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
      // Find task by chain_task_id or by requester wallet with 'open' status
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
        // Task was created directly on-chain, create DB record
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
      const { data: task } = await supabase
        .from('tasks')
        .update({
          worker_id: workerId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('chain_task_id', chainTaskId)
        .select()
        .single();

      if (task) {
        await this.recordTransaction(task.id, txHash, 'fund', workerWallet, null, null);
      }
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
        await this.recordTransaction(
          task.id,
          txHash,
          'complete',
          process.env.ESCROW_CONTRACT_ADDRESS || '',
          worker.wallet_address,
          payment
        );

        // Update worker stats
        await supabase
          .from('agents')
          .update({
            tasks_completed: (worker.tasks_completed || 0) + 1,
            last_active: new Date().toISOString(),
          })
          .eq('id', task.worker_id);
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
        .from('tasks')
        .select('id')
        .eq('chain_task_id', chainTaskId)
        .single();

      if (task) {
        await supabase
          .from('tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        await this.recordTransaction(
          task.id,
          txHash,
          'dispute_resolve',
          process.env.ESCROW_CONTRACT_ADDRESS || '',
          winnerWallet,
          null
        );
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
    amountWei: string | null
  ) {
    try {
      // Check if transaction already recorded
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('tx_hash', txHash)
        .single();

      if (existing) return; // Already recorded

      await supabase
        .from('transactions')
        .insert({
          task_id: taskId,
          tx_hash: txHash,
          tx_type: txType,
          from_address: fromAddress.toLowerCase(),
          to_address: toAddress?.toLowerCase() || null,
          amount_wei: amountWei,
          status: 'confirmed',
        });
    } catch (err) {
      console.error('Error recording transaction:', err);
    }
  }
}

// Singleton instance
export const eventListener = new EventListener();
export default eventListener;
