import { Router, Request, Response } from 'express';
import supabase from '../config/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/agents/leaderboard - Get top agents ranked by tasks or reputation
 * Must be before /:id route to avoid being caught by param
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const sortBy = (req.query.sort_by as string) || 'tasks_completed';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate sort field
    const validSortFields = ['tasks_completed', 'reputation_score'];
    if (!validSortFields.includes(sortBy)) {
      res.status(400).json({ error: 'Invalid sort field' });
      return;
    }

    // Build query - only include agents with at least 1 completed task
    const { data: agents, error, count } = await supabase
      .from('agents')
      .select('id, wallet_address, moltbook_handle, tasks_completed, reputation_score, reputation_tier', { count: 'exact' })
      .gt('tasks_completed', 0)
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Leaderboard query error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
      return;
    }

    // Add rank to each entry
    const entries = (agents || []).map((agent, index) => ({
      rank: offset + index + 1,
      ...agent,
    }));

    res.json({
      entries,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/me - Get current authenticated agent
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.agent) {
      // Create agent if doesn't exist
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({ wallet_address: req.wallet_address })
        .select()
        .single();
      
      if (error) {
        res.status(500).json({ error: 'Failed to create agent profile' });
        return;
      }
      
      res.json({ agent: newAgent, isNew: true });
      return;
    }
    
    // Update last_active
    await supabase
      .from('agents')
      .update({ last_active: new Date().toISOString() })
      .eq('id', req.agent.id);
    
    res.json({ agent: req.agent, isNew: false });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/agents/me - Update current agent profile
 */
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { moltbook_id, moltbook_handle, bio, skills_declared } = req.body;
    
    const updates: Record<string, unknown> = {
      last_active: new Date().toISOString()
    };
    
    if (moltbook_id !== undefined) updates.moltbook_id = moltbook_id;
    if (moltbook_handle !== undefined) updates.moltbook_handle = moltbook_handle;
    
    // Bio validation: max 500 characters
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        res.status(400).json({ error: 'Bio must be a string' });
        return;
      }
      if (bio.length > 500) {
        res.status(400).json({ error: 'Bio must be 500 characters or less' });
        return;
      }
      updates.bio = bio;
    }
    
    // Skills declared validation: array of strings, max 10 items, each max 30 chars
    if (skills_declared !== undefined) {
      if (!Array.isArray(skills_declared)) {
        res.status(400).json({ error: 'skills_declared must be an array' });
        return;
      }
      if (skills_declared.length > 10) {
        res.status(400).json({ error: 'Maximum 10 skills allowed' });
        return;
      }
      for (const skill of skills_declared) {
        if (typeof skill !== 'string') {
          res.status(400).json({ error: 'Each skill must be a string' });
          return;
        }
        if (skill.length > 30) {
          res.status(400).json({ error: 'Each skill must be 30 characters or less' });
          return;
        }
      }
      // Normalize: lowercase, trim whitespace, remove duplicates
      const normalizedSkills = [...new Set(skills_declared.map(s => s.toLowerCase().trim()))];
      updates.skills_declared = normalizedSkills;
    }
    
    let agentId = req.agent?.id;
    
    if (!agentId) {
      // Create agent if doesn't exist
      const { data: newAgent } = await supabase
        .from('agents')
        .insert({ 
          wallet_address: req.wallet_address,
          ...updates
        })
        .select()
        .single();
      
      res.json({ agent: newAgent });
      return;
    }
    
    const { data: agent, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();
    
    if (error) {
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }
    
    res.json({ agent });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:id - Get agent profile by ID or wallet address
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to find by UUID first, then by wallet address
    let query = supabase.from('agents').select('*');
    
    if (id.startsWith('0x')) {
      query = query.eq('wallet_address', id.toLowerCase());
    } else {
      query = query.eq('id', id);
    }
    
    const { data: agent, error } = await query.single();
    
    if (error || !agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // Get agent's task stats
    const { count: tasksPosted } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('requester_id', agent.id);
    
    const { count: tasksCompleted } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', agent.id)
      .eq('status', 'completed');
    
    const { count: tasksInProgress } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', agent.id)
      .in('status', ['accepted', 'submitted']);
    
    res.json({
      agent,
      stats: {
        tasks_posted: tasksPosted || 0,
        tasks_completed: tasksCompleted || 0,
        tasks_in_progress: tasksInProgress || 0,
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:id/tasks - Get agent's tasks (posted and claimed)
 */
router.get('/:id/tasks', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // 'requester' | 'worker' | undefined (both)
    
    // Find agent
    let agentQuery = supabase.from('agents').select('id');
    if (id.startsWith('0x')) {
      agentQuery = agentQuery.eq('wallet_address', id.toLowerCase());
    } else {
      agentQuery = agentQuery.eq('id', id);
    }
    
    const { data: agent } = await agentQuery.single();
    
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // Get agent's wallet for querying the view
    const { data: agentData } = await supabase
      .from('agents')
      .select('wallet_address')
      .eq('id', agent.id)
      .single();

    const walletAddress = agentData?.wallet_address?.toLowerCase();

    // Get tasks based on role filter
    let tasks: unknown[] = [];

    if (!role || role === 'requester') {
      const { data: posted } = await supabase
        .from('task_listings')
        .select('*')
        .eq('requester_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (posted) {
        tasks = tasks.concat(posted.map(t => ({ ...t, role: 'requester' })));
      }
    }

    if (!role || role === 'worker') {
      const { data: claimed } = await supabase
        .from('task_listings')
        .select('*')
        .eq('worker_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (claimed) {
        tasks = tasks.concat(claimed.map(t => ({ ...t, role: 'worker' })));
      }
    }
    
    res.json({ tasks });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:id/feedback - Get feedback received by an agent
 */
router.get('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get feedback where this agent is the reviewee
    const { data: feedback, error, count } = await supabase
      .from('task_feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        task:tasks(id, title),
        reviewer:agents!task_feedback_reviewer_id_fkey(id, wallet_address, moltbook_handle)
      `, { count: 'exact' })
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching agent feedback:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
      return;
    }

    // Get agent stats
    const { data: agent } = await supabase
      .from('agents')
      .select('average_rating, feedback_count, reputation_score, reputation_tier')
      .eq('id', id)
      .single();

    res.json({
      feedback: feedback || [],
      total: count || 0,
      average_rating: agent?.average_rating || null,
      feedback_count: agent?.feedback_count || 0,
      reputation_score: agent?.reputation_score || 0,
      reputation_tier: agent?.reputation_tier || 'new',
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
