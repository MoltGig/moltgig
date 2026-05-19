import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { buildContractReconciliation } from '../services/contractReconciliation.js';
import contractService from '../services/contract.js';
import { buildFunnelMetrics } from '../services/funnelMetrics.js';
import { adminCreateTaskSchema } from '../schemas/tasks.js';
import { defaultReviewPolicyForOrigin, inferTaskOrigin } from '../services/proofRequirements.js';
import { z } from 'zod';

const router = Router();

// Admin auth middleware. Server/agent automations use x-admin-api-key. The
// dashboard may use a Supabase session, but only for explicitly allowlisted
// admin emails.
const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-admin-api-key'] as string;
  const validKey = process.env.MOLTGIG_ADMIN_KEY || process.env.ADMIN_API_KEY;

  if (validKey && apiKey === validKey) {
    return next();
  }

  const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (bearer && adminEmails.length > 0) {
    const { data, error } = await supabase.auth.getUser(bearer);
    const email = data.user?.email?.toLowerCase();
    if (!error && email && adminEmails.includes(email)) {
      return next();
    }
  }

  if (!validKey && adminEmails.length === 0) {
    return res.status(503).json({ error: 'Admin API not configured' });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
};

// Apply admin auth to all routes
router.use(adminAuth);

const PAID_TRANSACTION_TYPES = new Set(['complete', 'dispute_resolve']);
const CONFIRMED_TRANSACTION_STATUSES = new Set(['confirmed', 'success']);

function isConfirmedPaidTransaction(tx: { tx_type?: string | null; status?: string | null; task_id?: string | null }): boolean {
  return !!tx.task_id &&
    PAID_TRANSACTION_TYPES.has(tx.tx_type || '') &&
    CONFIRMED_TRANSACTION_STATUSES.has(tx.status || '');
}

function parseWei(value?: string | number | null): bigint {
  return BigInt(value || '0');
}

function confirmedTransactionFeeWei(
  tx: { tx_type?: string | null; status?: string | null; task_id?: string | null; fee_wei?: string | number | null },
  rewardByTaskId: Map<string, bigint>
): bigint {
  if (!isConfirmedPaidTransaction(tx)) return BigInt(0);
  if (tx.fee_wei !== undefined && tx.fee_wei !== null) {
    return parseWei(tx.fee_wei);
  }
  // Legacy transaction rows predate fee_wei. Keep them reportable, but mark
  // response definitions as a legacy estimate rather than chain-emitted fee.
  const reward = tx.task_id ? rewardByTaskId.get(tx.task_id) || BigInt(0) : BigInt(0);
  return (reward * BigInt(3)) / BigInt(100);
}

// GET /api/admin/stats - Internal metrics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get task stats
    const [
      { data: tasks, error: tasksError },
      { data: paidTransactions, error: txError },
      { data: submissions, error: submissionsError },
      { data: agents, error: agentsError },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, title, description, status, task_origin, task_group, tags, requester_wallet, worker_wallet, chain_task_id, reward_wei, created_at, completed_at'),
      supabase
        .from('transactions')
        .select('id, task_id, tx_type, amount_wei, fee_wei, status'),
      supabase
        .from('submissions')
        .select('id, task_id, status, created_at'),
      supabase
        .from('agents')
        .select('id, wallet_address, onboarded, tasks_posted, tasks_completed, average_rating, feedback_count, last_active'),
    ]);

    if (tasksError) throw tasksError;
    if (txError) throw txError;
    if (submissionsError) throw submissionsError;
    if (agentsError) throw agentsError;

    const funnel = buildFunnelMetrics({
      tasks: tasks || [],
      submissions: submissions || [],
      agents: agents || [],
      transactions: paidTransactions || [],
    });

    const confirmedPaidTaskIds = new Set(
      (paidTransactions || [])
        .filter(isConfirmedPaidTransaction)
        .map((tx) => tx.task_id!)
    );

    const taskStats = {
      total: tasks?.length || 0,
      byStatus: {} as Record<string, number>,
      byOrigin: funnel.tasks.by_origin,
      completedByOrigin: funnel.tasks.completed_by_origin,
      paidOnChainByOrigin: funnel.tasks.paid_on_chain_by_origin,
      totalValueWei: '0',
      completedValueWei: '0',
      completedValueDefinition: 'Confirmed paid complete or worker-won dispute_resolve transaction value only; use traction/segments for origin-safe growth reporting',
    };

    let totalValue = BigInt(0);
    let completedValue = BigInt(0);

    tasks?.forEach(task => {
      taskStats.byStatus[task.status] = (taskStats.byStatus[task.status] || 0) + 1;
      const reward = BigInt(task.reward_wei || '0');
      totalValue += reward;
      if (confirmedPaidTaskIds.has(task.id)) {
        completedValue += reward;
      }
    });

    taskStats.totalValueWei = totalValue.toString();
    taskStats.completedValueWei = completedValue.toString();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const agentStats = {
      total: agents?.length || 0,
      activePosters: agents?.filter(a => (a.tasks_posted || 0) > 0).length || 0,
      activeWorkers: agents?.filter(a => (a.tasks_completed || 0) > 0).length || 0,
      withFeedback: agents?.filter(a => (a.feedback_count || 0) > 0).length || 0,
      active24h: agents?.filter(a => a.last_active && new Date(a.last_active) > oneDayAgo).length || 0,
      active7d: agents?.filter(a => a.last_active && new Date(a.last_active) > sevenDaysAgo).length || 0,
      active30d: agents?.filter(a => a.last_active && new Date(a.last_active) > thirtyDaysAgo).length || 0,
    };

    // Get dispute stats
    const { data: disputes, error: disputesError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('status', 'disputed');

    const disputeStats = {
      active: disputes?.length || 0,
    };

    // Get feedback stats
    const { data: feedback, error: feedbackError } = await supabase
      .from('task_feedback')
      .select('rating');

    const feedbackStats = {
      total: feedback?.length || 0,
      averageRating: feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0,
    };

    const rewardByTaskId = new Map((tasks || []).map((task) => [task.id, parseWei(task.reward_wei)]));
    const feeRevenue = (paidTransactions || []).reduce(
      (sum, tx) => sum + confirmedTransactionFeeWei(tx, rewardByTaskId),
      BigInt(0)
    );

    res.json({
      tasks: taskStats,
      agents: agentStats,
      disputes: disputeStats,
      feedback: feedbackStats,
      revenue: {
        platformFeeWei: feeRevenue.toString(),
        // Approximate USD (assuming $2500/ETH)
        platformFeeUsd: Number(feeRevenue) / 1e18 * 2500,
        definition: 'Actual fee_wei from confirmed complete or worker-won dispute_resolve events when present; legacy rows fall back to a 3% reward estimate',
      },
      traction: funnel.headline,
      segments: funnel.tasks,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/funnel - Growth funnel and real-completion metrics
router.get('/funnel', async (req: Request, res: Response) => {
  try {
    const [
      { data: tasks, error: tasksError },
      { data: submissions, error: submissionsError },
      { data: agents, error: agentsError },
      { data: transactions, error: transactionsError },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, title, description, status, task_origin, task_group, tags, requester_wallet, worker_wallet, chain_task_id, reward_wei, created_at, completed_at'),
      supabase
        .from('submissions')
        .select('id, task_id, status, created_at'),
      supabase
        .from('agents')
        .select('id, wallet_address, onboarded, tasks_posted, tasks_completed'),
      supabase
        .from('transactions')
        .select('id, task_id, tx_type, amount_wei, fee_wei, status'),
    ]);

    if (tasksError) throw tasksError;
    if (submissionsError) throw submissionsError;
    if (agentsError) throw agentsError;
    if (transactionsError) throw transactionsError;

    res.json(buildFunnelMetrics({
      tasks: tasks || [],
      submissions: submissions || [],
      agents: agents || [],
      transactions: transactions || [],
    }));
  } catch (error) {
    console.error('Admin funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel metrics' });
  }
});

// GET /api/admin/reconcile/contract - Read-only DB/contract reconciliation
router.get('/reconcile/contract', async (req: Request, res: Response) => {
  try {
    const [
      { data: tasks, error: tasksError },
      { data: transactions, error: transactionsError },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, chain_task_id, status, reward_wei, requester_wallet, worker_wallet')
        .not('chain_task_id', 'is', null),
      supabase
        .from('transactions')
        .select('task_id, tx_type, status, amount_wei, fee_wei'),
    ]);

    if (tasksError) throw tasksError;
    if (transactionsError) throw transactionsError;

    res.json(await buildContractReconciliation(tasks || [], transactions || []));
  } catch (error) {
    console.error('Contract reconciliation error:', error);
    res.status(500).json({ error: 'Failed to reconcile contract state' });
  }
});

// POST /api/admin/reconcile/contract/backfill-transactions
// Explicit admin repair for payment rows missed while the event listener was down.
// This only writes rows backed by concrete TaskCompleted/DisputeResolved logs.
router.post('/reconcile/contract/backfill-transactions', async (req: Request, res: Response) => {
  try {
    const dryRun = req.body?.dry_run !== false;
    const [
      { data: tasks, error: tasksError },
      { data: transactions, error: transactionsError },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, chain_task_id, status, reward_wei, requester_wallet, worker_wallet')
        .not('chain_task_id', 'is', null),
      supabase
        .from('transactions')
        .select('task_id, tx_type, status, amount_wei, fee_wei'),
    ]);

    if (tasksError) throw tasksError;
    if (transactionsError) throw transactionsError;

    const reconciliation = await buildContractReconciliation(tasks || [], transactions || []);
    const taskById = new Map((tasks || []).map((task) => [task.id, task]));
    const paymentMismatches = reconciliation.mismatches.filter((mismatch) =>
      mismatch.field === 'payment_transaction' && mismatch.db_task_id
    );

    const repaired = [];
    const skipped = [];

    for (const mismatch of paymentMismatches) {
      const task = taskById.get(mismatch.db_task_id!);
      if (!task || task.chain_task_id === null || task.chain_task_id === undefined) {
        skipped.push({
          task_id: mismatch.db_task_id,
          chain_task_id: mismatch.chain_task_id,
          reason: 'task row not found',
        });
        continue;
      }

      const event = await contractService.findPaymentEventForTask(
        Number(task.chain_task_id),
        task.worker_wallet
      );

      if (!event) {
        skipped.push({
          task_id: task.id,
          chain_task_id: Number(task.chain_task_id),
          reason: 'no TaskCompleted or DisputeResolved event found',
        });
        continue;
      }

      if (!dryRun) {
        const inserted = await contractService.recordBackfilledPaymentEvent(task.id, event);
        if (!inserted) {
          skipped.push({
            task_id: task.id,
            chain_task_id: Number(task.chain_task_id),
            tx_hash: event.txHash,
            reason: 'transaction already recorded',
          });
          continue;
        }
      }

      repaired.push({
        task_id: task.id,
        chain_task_id: Number(task.chain_task_id),
        tx_hash: event.txHash,
        tx_type: event.txType,
        amount_wei: event.amountWei,
        fee_wei: event.feeWei,
        block_number: event.blockNumber,
        dry_run: dryRun,
      });
    }

    res.json({
      dry_run: dryRun,
      scanned_payment_mismatches: paymentMismatches.length,
      repaired,
      skipped,
      next_step: dryRun
        ? 'Re-run with {"dry_run": false} to insert confirmed transaction rows.'
        : 'Run GET /api/admin/reconcile/contract and /api/admin/funnel to verify the repair.',
    });
  } catch (error) {
    console.error('Contract payment transaction backfill error:', error);
    res.status(500).json({ error: 'Failed to backfill contract payment transactions' });
  }
});

// GET /api/admin/disputes - Dispute queue
router.get('/disputes', async (req: Request, res: Response) => {
  try {
    const { data: disputes, error } = await supabase
      .from('task_listings')
      .select('*')
      .eq('status', 'disputed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      disputes: disputes || [],
      count: disputes?.length || 0,
    });
  } catch (error) {
    console.error('Disputes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// POST /api/admin/disputes/:id/resolve - Resolve dispute
router.post('/disputes/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, winner, reason } = req.body;

    if (!resolution || !['requester', 'worker', 'split'].includes(resolution)) {
      return res.status(400).json({
        error: 'Invalid resolution. Must be: requester, worker, or split',
      });
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'disputed') {
      return res.status(400).json({ error: 'Task is not in disputed status' });
    }

    if (task.chain_task_id) {
      return res.status(409).json({
        error: 'On-chain dispute requires escrow resolution',
        detail: 'Resolve the dispute on the MoltGig escrow contract first, then run contract reconciliation to sync the database.',
        chain_task_id: task.chain_task_id,
      });
    }

    const resolvedStatus = resolution === 'requester' ? 'cancelled' : 'completed';

    // Update off-chain task with resolution. Escrow-backed disputes are blocked
    // above because this route must not pretend to move on-chain funds.
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: resolvedStatus,
        dispute_resolution: resolution,
        dispute_winner: winner || resolution,
        dispute_reason: reason,
        resolved_at: new Date().toISOString(),
        completed_at: resolvedStatus === 'completed' ? new Date().toISOString() : task.completed_at,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log the resolution
    console.log(`Dispute resolved: Task ${id}, Resolution: ${resolution}, Reason: ${reason}`);

    res.json({
      success: true,
      taskId: id,
      resolution,
      status: resolvedStatus,
      reason,
      message: `Dispute resolved in favor of ${resolution}`,
    });
  } catch (error) {
    console.error('Dispute resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

// POST /api/admin/agents/:id/flag - Flag agent
router.post('/agents/:id/flag', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, action } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    if (!action || !['warn', 'restrict', 'ban'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action. Must be: warn, restrict, or ban',
      });
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update agent with flag
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        is_flagged: true,
        flag_reason: reason,
        flag_action: action,
        flagged_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log the flag action
    console.log(`Agent flagged: ${id}, Action: ${action}, Reason: ${reason}`);

    res.json({
      success: true,
      agentId: id,
      action,
      reason,
      message: `Agent flagged with action: ${action}`,
    });
  } catch (error) {
    console.error('Agent flag error:', error);
    res.status(500).json({ error: 'Failed to flag agent' });
  }
});

// GET /api/admin/agents/flagged - List flagged agents
router.get('/agents/flagged', async (req: Request, res: Response) => {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_flagged', true)
      .order('flagged_at', { ascending: false });

    if (error) throw error;

    res.json({
      agents: agents || [],
      count: agents?.length || 0,
    });
  } catch (error) {
    console.error('Flagged agents fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged agents' });
  }
});

// POST /api/admin/agents/:id/unflag - Remove flag from agent
router.post('/agents/:id/unflag', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error: updateError } = await supabase
      .from('agents')
      .update({
        is_flagged: false,
        flag_reason: null,
        flag_action: null,
        flagged_at: null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      agentId: id,
      message: 'Agent flag removed',
    });
  } catch (error) {
    console.error('Agent unflag error:', error);
    res.status(500).json({ error: 'Failed to unflag agent' });
  }
});

// POST /api/admin/tasks - Create task without on-chain funding (for seeding)
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const input = adminCreateTaskSchema.parse(req.body);

    // Look up or default the requester wallet
    const wallet = (input.requester_wallet || '0x491cfD950cD82BB3878860392a8e807D3A41d434').toLowerCase();

    // Find the agent by wallet address
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('wallet_address', wallet)
      .single();

    if (agentError || !agent) {
      return res.status(400).json({ error: `Agent not found for wallet: ${wallet}` });
    }

    const normalizedTags = input.tags ? input.tags.map((tag) => tag.toLowerCase().trim()) : [];
    const inferredOrigin = inferTaskOrigin({ ...input, tags: normalizedTags }, wallet);
    const taskOrigin = input.task_origin || inferredOrigin;
    const reviewPolicy = input.review_policy || defaultReviewPolicyForOrigin(taskOrigin);

    // Insert the task
    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert({
        requester_id: agent.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category || null,
        reward_wei: input.reward_wei,
        deadline: input.deadline || null,
        task_group: input.task_group || null,
        tags: normalizedTags,
        task_origin: taskOrigin,
        review_policy: reviewPolicy,
        proof_requirements: input.proof_requirements,
        status: input.status,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fetch from task_listings view for enriched response
    const { data: enrichedTask, error: fetchError } = await supabase
      .from('task_listings')
      .select('*')
      .eq('id', task.id)
      .single();

    if (fetchError) throw fetchError;

    // Increment tasks_posted on the agent (non-critical, best-effort)
    try {
      await supabase.rpc('increment_counter', {
        row_id: agent.id,
        column_name: 'tasks_posted',
        table_name: 'agents',
      });
    } catch {
      // RPC may not exist; ignore
    }

    res.status(201).json({ task: enrichedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Admin task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/admin/timeseries - Time series data for charts
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    let dailyData: Array<{ date: string; tasks_created: number; tasks_completed: number; value_created_wei: string; value_completed_wei: string }> = [];

    const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const [
      { data: tasks, error: tasksError },
      { data: paidTransactions, error: txError },
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, created_at, reward_wei'),
      supabase
        .from('transactions')
        .select('task_id, tx_type, status, fee_wei, created_at')
        .in('tx_type', Array.from(PAID_TRANSACTION_TYPES))
        .in('status', Array.from(CONFIRMED_TRANSACTION_STATUSES))
        .gte('created_at', periodStart),
    ]);

    if (tasksError) throw tasksError;
    if (txError) throw txError;

    const rewardByTaskId = new Map((tasks || []).map((task) => [task.id, BigInt(task.reward_wei || '0')]));
    const byDay: Record<string, { created: number; completed: number; valueCreated: bigint; valueCompleted: bigint; feeRevenue: bigint }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      byDay[dateStr] = { created: 0, completed: 0, valueCreated: BigInt(0), valueCompleted: BigInt(0), feeRevenue: BigInt(0) };
    }

    tasks?.forEach(task => {
      const createdDate = new Date(task.created_at).toISOString().split('T')[0];
      if (byDay[createdDate]) {
        byDay[createdDate].created++;
        byDay[createdDate].valueCreated += BigInt(task.reward_wei || '0');
      }
    });

    paidTransactions?.filter(isConfirmedPaidTransaction).forEach((tx) => {
      const completedDate = new Date(tx.created_at).toISOString().split('T')[0];
      if (byDay[completedDate]) {
        byDay[completedDate].completed++;
        byDay[completedDate].valueCompleted += rewardByTaskId.get(tx.task_id!) || BigInt(0);
        byDay[completedDate].feeRevenue += confirmedTransactionFeeWei(tx, rewardByTaskId);
      }
    });

    dailyData = Object.entries(byDay)
      .map(([date, data]) => ({
        date,
        tasks_created: data.created,
        tasks_completed: data.completed,
        value_created_wei: data.valueCreated.toString(),
        value_completed_wei: data.valueCompleted.toString(),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const revenueData = dailyData.map(d => ({
      date: d.date,
      revenue_wei: byDay[d.date].feeRevenue.toString(),
      tasks_completed: d.tasks_completed,
    }));
    
    res.json({
      daily: dailyData,
      revenue: revenueData,
      period: { days, start: dailyData[0]?.date, end: dailyData[dailyData.length - 1]?.date },
    });
  } catch (error) {
    console.error('Timeseries error:', error);
    res.status(500).json({ error: 'Failed to fetch timeseries data' });
  }
});

// GET /api/admin/costs - List all costs
router.get('/costs', async (req: Request, res: Response) => {
  try {
    const { data: costs, error } = await supabase
      .from('costs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      costs: costs || [],
      count: costs?.length || 0,
    });
  } catch (error) {
    console.error('Costs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// POST /api/admin/costs - Add a cost
router.post('/costs', async (req: Request, res: Response) => {
  try {
    const { category, description, amount_wei, amount_usd, tx_hash, period_start, period_end } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!amount_wei && !amount_usd) {
      return res.status(400).json({ error: 'Either amount_wei or amount_usd is required' });
    }

    const { data: cost, error } = await supabase
      .from('costs')
      .insert({
        category,
        description,
        amount_wei: amount_wei || null,
        amount_usd: amount_usd || null,
        tx_hash: tx_hash || null,
        period_start: period_start || null,
        period_end: period_end || null,
        created_by: 'admin',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ cost, message: 'Cost added successfully' });
  } catch (error) {
    console.error('Cost add error:', error);
    res.status(500).json({ error: 'Failed to add cost' });
  }
});

// DELETE /api/admin/costs/:id - Delete a cost
router.delete('/costs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('costs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Cost deleted' });
  } catch (error) {
    console.error('Cost delete error:', error);
    res.status(500).json({ error: 'Failed to delete cost' });
  }
});

// GET /api/admin/pnl - Get P&L calculation
router.get('/pnl', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'all'; // 'month', 'year', 'all'
    
    // Get costs
    let costsQuery = supabase
      .from('costs')
      .select('*');

    // Apply period filter
    const now = new Date();
    let periodStart: Date | null = null;
    
    if (period === 'month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      periodStart = new Date(now.getFullYear(), 0, 1);
    }

    let transactionsQuery = supabase
      .from('transactions')
      .select('task_id, tx_type, status, amount_wei, fee_wei, created_at')
      .in('tx_type', Array.from(PAID_TRANSACTION_TYPES))
      .in('status', Array.from(CONFIRMED_TRANSACTION_STATUSES));

    if (periodStart) {
      transactionsQuery = transactionsQuery.gte('created_at', periodStart.toISOString());
      costsQuery = costsQuery.gte('created_at', periodStart.toISOString());
    }

    const [
      { data: tasks, error: tasksError },
      { data: paidTransactions, error: txError },
      { data: costs },
    ] = await Promise.all([
      supabase.from('tasks').select('id, reward_wei'),
      transactionsQuery,
      costsQuery,
    ]);

    if (tasksError) throw tasksError;
    if (txError) throw txError;

    const rewardByTaskId = new Map((tasks || []).map((task) => [task.id, BigInt(task.reward_wei || '0')]));

    // Calculate GMV from linked task rewards and revenue from chain-emitted
    // fee_wei where present. Legacy rows fall back to a 3% reward estimate.
    let totalCompletedWei = BigInt(0);
    let platformFeeWei = BigInt(0);
    paidTransactions?.filter(isConfirmedPaidTransaction).forEach(tx => {
      const reward = rewardByTaskId.get(tx.task_id!) || BigInt(0);
      totalCompletedWei += reward;
      platformFeeWei += confirmedTransactionFeeWei(tx, rewardByTaskId);
    });

    // Calculate costs
    let totalCostsWei = BigInt(0);
    let totalCostsUsd = 0;
    const costsByCategory: Record<string, { wei: bigint; usd: number }> = {};

    costs?.forEach(cost => {
      const category = cost.category || 'other';
      if (!costsByCategory[category]) {
        costsByCategory[category] = { wei: BigInt(0), usd: 0 };
      }
      if (cost.amount_wei) {
        totalCostsWei += BigInt(cost.amount_wei);
        costsByCategory[category].wei += BigInt(cost.amount_wei);
      }
      if (cost.amount_usd) {
        totalCostsUsd += parseFloat(cost.amount_usd);
        costsByCategory[category].usd += parseFloat(cost.amount_usd);
      }
    });

    // Convert to response format
    const categoryBreakdown: Record<string, { wei: string; usd: number }> = {};
    Object.entries(costsByCategory).forEach(([cat, amounts]) => {
      categoryBreakdown[cat] = {
        wei: amounts.wei.toString(),
        usd: amounts.usd,
      };
    });

    // Estimate ETH price for USD conversion (rough estimate)
    const ethPriceUsd = 2500;
    const platformFeeUsd = (Number(platformFeeWei) / 1e18) * ethPriceUsd;
    const totalCostsWeiUsd = (Number(totalCostsWei) / 1e18) * ethPriceUsd;

    // Net profit calculation
    const netProfitUsd = platformFeeUsd - totalCostsUsd - totalCostsWeiUsd;

    res.json({
      period,
      periodStart: periodStart?.toISOString().split('T')[0] || 'all-time',
      revenue: {
        gmv_wei: totalCompletedWei.toString(),
        platform_fee_wei: platformFeeWei.toString(),
        platform_fee_usd: platformFeeUsd,
        definition: 'platform_fee_wei uses transaction fee_wei from on-chain events when present; legacy rows use a 3% reward estimate',
      },
      costs: {
        total_wei: totalCostsWei.toString(),
        total_usd: totalCostsUsd,
        total_combined_usd: totalCostsUsd + totalCostsWeiUsd,
        by_category: categoryBreakdown,
      },
      profit: {
        net_usd: netProfitUsd,
        is_profitable: netProfitUsd > 0,
      },
      meta: {
        eth_price_usd: ethPriceUsd,
        tasks_completed: paidTransactions?.filter(isConfirmedPaidTransaction).length || 0,
        cost_entries: costs?.length || 0,
      },
    });
  } catch (error) {
    console.error('PnL calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate P&L' });
  }
});

export default router;
