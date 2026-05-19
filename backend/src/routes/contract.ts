import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import supabase from '../config/supabase.js';
import contractService from '../services/contract.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/contract/stats - Get on-chain platform stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await contractService.getPlatformStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching contract stats:', err);
    res.status(500).json({ error: 'Failed to fetch contract stats' });
  }
});

/**
 * GET /api/contract/task/:chainTaskId - Get task from chain
 */
router.get('/task/:chainTaskId', async (req: Request, res: Response) => {
  try {
    const chainTaskId = parseInt(req.params.chainTaskId, 10);
    if (isNaN(chainTaskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await contractService.getTask(chainTaskId);
    res.json({ task });
  } catch (err) {
    console.error('Error fetching chain task:', err);
    res.status(500).json({ error: 'Failed to fetch task from chain' });
  }
});

/**
 * POST /api/contract/sync/:taskId - Sync task state from chain
 */
router.post('/sync/:taskId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // Get task from database
    const { data: task, error } = await supabase
      .from('tasks')
      .select('id, chain_task_id, requester_id')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (!task.chain_task_id) {
      res.status(400).json({ error: 'Task not linked to chain' });
      return;
    }

    // Only requester can sync
    if (task.requester_id !== req.agent?.id) {
      res.status(403).json({ error: 'Only task requester can sync' });
      return;
    }

    const result = await contractService.syncTaskFromChain(task.chain_task_id, task.id);
    res.json({ 
      message: 'Task synced from chain',
      chainState: result.chainTask.state,
      dbStatus: result.dbStatus
    });
  } catch (err) {
    console.error('Error syncing task:', err);
    res.status(500).json({ error: 'Failed to sync task' });
  }
});

/**
 * POST /api/tasks/:id/fund - Record funding transaction
 * 
 * This endpoint is called AFTER the user has submitted the transaction on-chain.
 * The frontend handles the actual contract interaction.
 * We just record the transaction hash and link it to our task.
 */
router.post('/:id/fund', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tx_hash, chain_task_id } = req.body;

    if (!tx_hash) {
      res.status(400).json({ error: 'Transaction hash required' });
      return;
    }

    // Validate tx_hash format
    if (!tx_hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      res.status(400).json({ error: 'Invalid transaction hash format' });
      return;
    }

    // Get task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify caller is the requester
    if (task.requester_id !== req.agent?.id) {
      res.status(403).json({ error: 'Only task requester can fund' });
      return;
    }

    const { data: existingTxForHash } = await supabase
      .from('transactions')
      .select('task_id')
      .eq('tx_hash', tx_hash)
      .limit(1);

    const existingSameTaskTx = existingTxForHash?.[0]?.task_id === id;
    if (task.status === 'funded' && existingSameTaskTx) {
      res.json({
        task,
        message: 'Task funding was already recorded',
        tx_hash,
      });
      return;
    }

    if (task.status !== 'open') {
      res.status(400).json({ error: 'Task already funded or in invalid state' });
      return;
    }

    let verifiedFunding;
    try {
      verifiedFunding = await contractService.verifyTaskPostedTransaction(
        tx_hash,
        req.wallet_address!,
        task.reward_wei.toString(),
        chain_task_id !== undefined ? Number(chain_task_id) : undefined
      );
    } catch (error) {
      res.status(400).json({
        error: 'Funding transaction could not be verified',
        detail: error instanceof Error ? error.message : 'Unknown verification error',
      });
      return;
    }

    const [
      { data: existingChainTasks, error: existingChainError },
      { data: existingTransactions, error: existingTxError },
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('id')
        .eq('chain_task_id', verifiedFunding.chainTaskId)
        .limit(1),
      supabase
        .from('transactions')
        .select('task_id')
        .eq('tx_hash', tx_hash)
        .limit(1),
    ]);

    if (existingChainError || existingTxError) {
      res.status(500).json({ error: 'Failed to check funding idempotency' });
      return;
    }

    const existingChainTask = existingChainTasks?.[0];
    const existingTransaction = existingTransactions?.[0];
    if ((existingChainTask && existingChainTask.id !== id) ||
        (existingTransaction && existingTransaction.task_id !== id)) {
      res.status(409).json({
        error: 'Funding transaction is already linked to another task',
        chain_task_id: verifiedFunding.chainTaskId,
      });
      return;
    }
    const transactionAlreadyRecorded = existingTransaction?.task_id === id;

    // Update task with chain info
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        chain_task_id: verifiedFunding.chainTaskId,
        status: 'funded',
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Failed to update task' });
      return;
    }

    // Record transaction
    if (!transactionAlreadyRecorded) {
      await contractService.recordTransaction(
        id,
        tx_hash,
        'fund',
        req.wallet_address!,
        null,
        task.reward_wei.toString()
      );
      await contractService.confirmTransaction(tx_hash, verifiedFunding.blockNumber);
    }

    res.json({ 
      task: updatedTask,
      message: 'Task funded successfully',
      tx_hash
    });
  } catch (err) {
    console.error('Error funding task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/contract/transactions/:taskId - Get transactions for a task
 */
router.get('/transactions/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
      return;
    }

    res.json({ transactions });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
