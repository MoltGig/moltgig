import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Admin API Key middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-admin-api-key'] as string;
  const validKey = process.env.ADMIN_API_KEY;

  if (!validKey) {
    return res.status(503).json({ error: 'Admin API not configured' });
  }

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid admin API key' });
  }

  next();
};

// Apply admin auth to all routes
router.use(adminAuth);

// GET /api/admin/stats - Internal metrics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get task stats
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, reward_wei');

    if (tasksError) throw tasksError;

    const taskStats = {
      total: tasks?.length || 0,
      byStatus: {} as Record<string, number>,
      totalValueWei: '0',
      completedValueWei: '0',
    };

    let totalValue = BigInt(0);
    let completedValue = BigInt(0);

    tasks?.forEach(task => {
      taskStats.byStatus[task.status] = (taskStats.byStatus[task.status] || 0) + 1;
      const reward = BigInt(task.reward_wei || '0');
      totalValue += reward;
      if (task.status === 'completed') {
        completedValue += reward;
      }
    });

    taskStats.totalValueWei = totalValue.toString();
    taskStats.completedValueWei = completedValue.toString();

    // Get agent stats with activity
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, tasks_posted, tasks_completed, average_rating, feedback_count, last_active');

    if (agentsError) throw agentsError;

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

    // Platform fee revenue (5% of completed value)
    const feeRevenue = (completedValue * BigInt(5)) / BigInt(100);

    res.json({
      tasks: taskStats,
      agents: agentStats,
      disputes: disputeStats,
      feedback: feedbackStats,
      revenue: {
        platformFeeWei: feeRevenue.toString(),
        // Approximate USD (assuming $2500/ETH)
        platformFeeUsd: Number(feeRevenue) / 1e18 * 2500,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
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

    // Update task with resolution
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'resolved',
        dispute_resolution: resolution,
        dispute_reason: reason,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log the resolution
    console.log(`Dispute resolved: Task ${id}, Resolution: ${resolution}, Reason: ${reason}`);

    res.json({
      success: true,
      taskId: id,
      resolution,
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

export default router;

// GET /api/admin/timeseries - Time series data for charts
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Get task creation by day
    const { data: tasksByDay, error: tasksError } = await supabase.rpc('get_tasks_by_day', { num_days: days });
    
    // Fallback: query directly if RPC doesn't exist
    let dailyData: Array<{ date: string; tasks_created: number; tasks_completed: number; value_created_wei: string; value_completed_wei: string }> = [];
    
    if (tasksError) {
      // Direct query approach
      const { data: tasks } = await supabase
        .from('tasks')
        .select('created_at, completed_at, status, reward_wei')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      // Group by day
      const byDay: Record<string, { created: number; completed: number; valueCreated: bigint; valueCompleted: bigint }> = {};
      
      // Initialize all days in range
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        byDay[dateStr] = { created: 0, completed: 0, valueCreated: BigInt(0), valueCompleted: BigInt(0) };
      }
      
      tasks?.forEach(task => {
        const createdDate = new Date(task.created_at).toISOString().split('T')[0];
        if (byDay[createdDate]) {
          byDay[createdDate].created++;
          byDay[createdDate].valueCreated += BigInt(task.reward_wei || '0');
        }
        
        if (task.completed_at && task.status === 'completed') {
          const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
          if (byDay[completedDate]) {
            byDay[completedDate].completed++;
            byDay[completedDate].valueCompleted += BigInt(task.reward_wei || '0');
          }
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
    }
    
    // Calculate revenue (5% of completed value)
    const revenueData = dailyData.map(d => ({
      date: d.date,
      revenue_wei: ((BigInt(d.value_completed_wei) * BigInt(5)) / BigInt(100)).toString(),
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
    
    // Get revenue (completed tasks)
    let tasksQuery = supabase
      .from('tasks')
      .select('reward_wei, completed_at')
      .eq('status', 'completed');

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

    if (periodStart) {
      tasksQuery = tasksQuery.gte('completed_at', periodStart.toISOString());
      costsQuery = costsQuery.gte('created_at', periodStart.toISOString());
    }

    const [{ data: tasks }, { data: costs }] = await Promise.all([
      tasksQuery,
      costsQuery,
    ]);

    // Calculate revenue (5% platform fee)
    let totalCompletedWei = BigInt(0);
    tasks?.forEach(task => {
      totalCompletedWei += BigInt(task.reward_wei || '0');
    });
    const platformFeeWei = (totalCompletedWei * BigInt(5)) / BigInt(100);

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
        tasks_completed: tasks?.length || 0,
        cost_entries: costs?.length || 0,
      },
    });
  } catch (error) {
    console.error('PnL calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate P&L' });
  }
});
