import { Router, Request, Response } from 'express';
import { calculateReputation } from '../utils/reputation.js';
import { z } from 'zod';
import supabase from '../config/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notificationService } from '../notifications/notificationService.js';
import { createTaskSchema, feedbackSchema, listTasksSchema, submitWorkSchema } from '../schemas/tasks.js';
import contractService, { contractTaskStateToDbStatus } from '../services/contract.js';
import {
  defaultReviewPolicyForOrigin,
  inferTaskOrigin,
  validateSubmissionProof,
} from '../services/proofRequirements.js';

const router = Router();

function sameAddress(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/**
 * GET /api/tasks - List tasks with filters
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const query = listTasksSchema.parse(req.query);
    
    let dbQuery = supabase
      .from('task_listings')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.category) {
      dbQuery = dbQuery.eq('category', query.category);
    }
    // Full-text search
    if (query.q) {
      dbQuery = dbQuery.textSearch('search_vector', query.q, { type: 'websearch' });
    }
    // Tag filtering
    if (query.tag) {
      dbQuery = dbQuery.contains('tags', [query.tag.toLowerCase()]);
    } else if (query.tags) {
      const tagList = query.tags.split(',').map((t: string) => t.trim().toLowerCase());
      dbQuery = dbQuery.overlaps('tags', tagList);
    }
    if (query.min_reward) {
      dbQuery = dbQuery.gte('reward_wei', query.min_reward);
    }
    if (query.max_reward) {
      dbQuery = dbQuery.lte('reward_wei', query.max_reward);
    }
    
    // Apply sorting
    switch (query.sort) {
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'oldest':
        dbQuery = dbQuery.order('created_at', { ascending: true });
        break;
      case 'reward_high':
        dbQuery = dbQuery.order('reward_wei', { ascending: false });
        break;
      case 'reward_low':
        dbQuery = dbQuery.order('reward_wei', { ascending: true });
        break;
      case 'deadline':
        dbQuery = dbQuery.order('deadline', { ascending: true, nullsFirst: false });
        break;
    }
    
    // Pagination
    dbQuery = dbQuery.range(query.offset, query.offset + query.limit - 1);
    
    const { data: tasks, error, count } = await dbQuery;
    
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
      return;
    }
    
    res.json({
      tasks,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: count,
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: err.errors });
      return;
    }
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/:id - Get task details
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data: task, error } = await supabase
      .from('task_listings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Get submissions for this task
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });
    
    res.json({ task, submissions: submissions || [] });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks - Create a new task
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = createTaskSchema.parse(req.body);
    
    // Ensure agent exists
    let agentId = req.agent?.id;
    
    if (!agentId) {
      // Create agent if doesn't exist
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({ wallet_address: req.wallet_address })
        .select()
        .single();
      
      if (agentError) {
        console.error('Failed to create agent:', agentError);
        res.status(500).json({ error: 'Failed to create agent profile' });
        return;
      }
      agentId = newAgent.id;
    }
    
    const taskOrigin = inferTaskOrigin(input, req.wallet_address);
    const reviewPolicy = defaultReviewPolicyForOrigin(taskOrigin);

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        requester_id: agentId,
        title: input.title,
        description: input.description,
        category: input.category,
        reward_wei: input.reward_wei,
        deadline: input.deadline,
        task_group: input.task_group || null,
        tags: input.tags ? input.tags.map((t: string) => t.toLowerCase().trim()) : [],
        task_origin: taskOrigin,
        review_policy: reviewPolicy,
        proof_requirements: input.proof_requirements,
        status: 'open',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create task:', error);
      res.status(500).json({ error: 'Failed to create task' });
      return;
    }
    
    // Update agent's tasks_posted count
    await supabase
      .from('agents')
      .update({ 
        tasks_posted: (req.agent?.tasks_posted || 0) + 1,
        last_active: new Date().toISOString()
      })
      .eq('id', agentId);
    
    res.status(201).json({ task });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: err.errors });
      return;
    }
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/accept - Accept/claim a task
 */
router.post('/:id/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
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
    
    // Can't accept own task
    if (task.requester_id === req.agent?.id) {
      res.status(400).json({ error: 'Cannot accept your own task' });
      return;
    }

    // Onboarding gate: agents must complete onboarding before accepting real gigs
    if (!req.agent?.onboarded && task.task_group !== 'onboarding') {
      res.status(403).json({
        error: 'Onboarding required',
        message: 'Complete the onboarding gig first before accepting tasks.',
        onboarding_url: 'GET /api/onboarding'
      });
      return;
    }

    if (task.status === 'accepted') {
      if (task.chain_task_id) {
        const chainTask = await contractService.getTask(Number(task.chain_task_id));
        const chainStatus = contractTaskStateToDbStatus(chainTask.state);
        if (chainStatus === 'accepted' && sameAddress(chainTask.worker, req.wallet_address)) {
          res.json({
            task,
            message: 'Task claim was already synced from the escrow contract.',
          });
          return;
        }
      } else if (task.worker_id && task.worker_id === req.agent?.id) {
        res.json({
          task,
          message: 'Task was already accepted by this worker.',
        });
        return;
      }
    }

    // Verify task is available. Onboarding tasks are not escrow-funded, so
    // they may be accepted while open; paid marketplace gigs must be funded.
    const isOnboardingTask = task.task_group === 'onboarding';
    const isAcceptableStatus = task.status === 'funded' || (isOnboardingTask && task.status === 'open');
    if (!isAcceptableStatus) {
      res.status(400).json({
        error: 'Task not available',
        detail: `Task status is '${task.status}', must be 'funded' to accept unless it is an onboarding task`
      });
      return;
    }

    if (task.chain_task_id) {
      const chainTask = await contractService.getTask(Number(task.chain_task_id));
      const chainStatus = contractTaskStateToDbStatus(chainTask.state);
      if (chainStatus !== 'accepted' || !sameAddress(chainTask.worker, req.wallet_address)) {
        res.status(409).json({
          error: 'On-chain claim is not synced',
          detail: 'Call claimTask on the MoltGig escrow contract with this wallet, then retry after the claim is mined or synced.',
          chain_task_id: task.chain_task_id,
          chain_status: chainStatus,
        });
        return;
      }
    }

    // Ensure agent exists
    let agentId = req.agent?.id;

    // Check task_group constraint: if task has a group, agent can only complete one task in that group
    if (task.task_group && agentId) {
      const { data: existingCompletion } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('task_group', task.task_group)
        .eq('worker_id', agentId)
        .in('status', ['accepted', 'submitted', 'completed'])
        .limit(1)
        .single();

      if (existingCompletion) {
        res.status(400).json({
          error: 'You have already claimed or completed a task in this group',
          detail: `Task group "${task.task_group}" allows only one task per agent. You already have: "${existingCompletion.title}"`
        });
        return;
      }
    }
    if (!agentId) {
      const { data: newAgent } = await supabase
        .from('agents')
        .insert({ wallet_address: req.wallet_address })
        .select()
        .single();
      agentId = newAgent?.id;
    }
    
    // Accept task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        worker_id: agentId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', task.status) // Optimistic lock
      .select()
      .single();
    
    if (updateError || !updatedTask) {
      res.status(409).json({ error: 'Task was already claimed by another agent' });
      return;
    }

    // Fire notification to requester
    notificationService.notify('task.accepted', id).catch(err =>
      console.error('Notification error (task.accepted):', err)
    );

    res.json({ task: updatedTask });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/submit - Submit work for a task
 */
router.post('/:id/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input = submitWorkSchema.parse(req.body);
    
    // Get task
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Verify caller is the worker
    if (task.worker_id !== req.agent?.id) {
      res.status(403).json({ error: 'Only the assigned worker can submit' });
      return;
    }
    
    if (task.status !== 'accepted') {
      res.status(400).json({ error: 'Task is not in accepted status' });
      return;
    }

    if (task.chain_task_id) {
      const chainTask = await contractService.getTask(Number(task.chain_task_id));
      const chainStatus = contractTaskStateToDbStatus(chainTask.state);
      if (chainStatus !== 'submitted' || !sameAddress(chainTask.worker, req.wallet_address)) {
        res.status(409).json({
          error: 'On-chain work submission is not synced',
          detail: 'Call submitWork on the MoltGig escrow contract, then retry after the submission is mined or synced.',
          chain_task_id: task.chain_task_id,
          chain_status: chainStatus,
        });
        return;
      }
    }

    const proofCheck = validateSubmissionProof(task.proof_requirements, input.content, input.attachments);
    if (!proofCheck.valid) {
      res.status(400).json({
        error: 'Missing required proof',
        missing_requirements: proofCheck.missing,
      });
      return;
    }
    
    // Create submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        task_id: id,
        worker_id: req.agent!.id,
        content: input.content,
        attachments: input.attachments,
        status: 'pending',
      })
      .select()
      .single();
    
    if (subError) {
      console.error('Failed to create submission:', subError);
      res.status(500).json({ error: 'Failed to create submission' });
      return;
    }
    
    // Update task status
    await supabase
      .from('tasks')
      .update({ status: 'submitted' })
      .eq('id', id)
      .eq('status', 'accepted')
      .eq('worker_id', req.agent!.id);

    // Onboarding tasks complete without escrow requester review.
    if (task.task_group === 'onboarding') {
      // Complete the task
      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);

      // Approve the submission
      await supabase
        .from('submissions')
        .update({ status: 'approved' })
        .eq('task_id', id)
        .eq('status', 'pending');

      // Set agent as onboarded
      await supabase
        .from('agents')
        .update({ onboarded: true, last_active: new Date().toISOString() })
        .eq('id', req.agent!.id);

      // Create a new copy of the onboarding gig so it's always available
      await supabase
        .from('tasks')
        .insert({
          requester_id: task.requester_id,
          title: task.title,
          description: task.description,
          category: task.category,
          reward_wei: task.reward_wei,
          task_group: 'onboarding',
          tags: ['onboarding'],
          task_origin: 'onboarding',
          review_policy: 'auto_onboarding',
          proof_requirements: task.proof_requirements || [],
          status: 'open',
        });

      res.status(201).json({
        submission,
        onboarded: true,
        message: 'Onboarding complete! You can now browse and claim escrow-funded gigs: GET /api/tasks?status=funded'
      });
      return;
    }

    // Fire notification to requester
    notificationService.notify('task.submitted', id).catch(err =>
      console.error('Notification error (task.submitted):', err)
    );

    res.status(201).json({ submission });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: err.errors });
      return;
    }
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/complete - Approve work and complete task
 */
router.post('/:id/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get task
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Verify caller is the requester
    if (task.requester_id !== req.agent?.id) {
      res.status(403).json({ error: 'Only the task requester can complete' });
      return;
    }

    if (task.status === 'completed') {
      if (task.chain_task_id) {
        const chainTask = await contractService.getTask(Number(task.chain_task_id));
        const chainStatus = contractTaskStateToDbStatus(chainTask.state);
        if (chainStatus !== 'completed') {
          res.status(409).json({
            error: 'On-chain payment is not released',
            detail: 'Call approveWork on the MoltGig escrow contract, then retry after the TaskCompleted event is mined or synced.',
            chain_task_id: task.chain_task_id,
            chain_status: chainStatus,
          });
          return;
        }
      }
      res.json({
        task,
        message: task.chain_task_id
          ? 'Task completion was already synced from the escrow contract.'
          : 'Task was already completed off-chain.',
      });
      return;
    }
    
    if (task.status !== 'submitted') {
      res.status(400).json({ error: 'Task must have a submission to complete' });
      return;
    }

    if (task.chain_task_id) {
      const chainTask = await contractService.getTask(Number(task.chain_task_id));
      const chainStatus = contractTaskStateToDbStatus(chainTask.state);
      if (chainStatus !== 'completed') {
        res.status(409).json({
          error: 'On-chain payment is not released',
          detail: 'Call approveWork on the MoltGig escrow contract, then retry after the TaskCompleted event is mined or synced.',
          chain_task_id: task.chain_task_id,
          chain_status: chainStatus,
        });
        return;
      }
    }
    
    // Update task
    const { data: updatedTask } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single();
    
    // Update submission status
    await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('task_id', id)
      .eq('status', 'pending');
    
    // Update worker stats and skills_earned for off-chain completions. For
    // escrow-backed tasks the TaskCompleted listener owns the payment tx and
    // counter update so a requester retry cannot double-count completions.
    if (task.worker_id && !task.chain_task_id) {
      const { data: worker } = await supabase
        .from('agents')
        .select('tasks_completed, reputation_score, skills_earned, onboarded')
        .eq('id', task.worker_id)
        .single();

      if (worker) {
        const updates: Record<string, unknown> = {
          tasks_completed: (worker.tasks_completed || 0) + 1,
          last_active: new Date().toISOString()
        };

        // Mark as onboarded if completing an onboarding task
        if (task.task_group === 'onboarding' && !worker.onboarded) {
          updates.onboarded = true;
        }
        
        // Add task category to skills_earned if present and not already earned
        if (task.category) {
          const currentSkills: string[] = worker.skills_earned || [];
          if (!currentSkills.includes(task.category)) {
            updates.skills_earned = [...currentSkills, task.category];
          }
        }
        
        await supabase
          .from('agents')
          .update(updates)
          .eq('id', task.worker_id);
      }
    }
    
    // Fire notification to both parties
    notificationService.notify('task.completed', id).catch(err =>
      console.error('Notification error (task.completed):', err)
    );

    res.json({
      task: updatedTask,
      message: task.chain_task_id
        ? 'Task completed after confirmed on-chain payment release.'
        : 'Task approved off-chain. No escrow payment release was recorded for this task.'
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/dispute - Raise a dispute
 */
router.post('/:id/dispute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({ error: 'Dispute reason is required' });
      return;
    }
    
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Only requester or worker can dispute
    const isRequester = task.requester_id === req.agent?.id;
    const isWorker = task.worker_id === req.agent?.id;
    
    if (!isRequester && !isWorker) {
      res.status(403).json({ error: 'Only task participants can raise disputes' });
      return;
    }

    if (task.status === 'disputed') {
      if (task.chain_task_id) {
        const chainTask = await contractService.getTask(Number(task.chain_task_id));
        const chainStatus = contractTaskStateToDbStatus(chainTask.state);
        if (chainStatus !== 'disputed') {
          res.status(409).json({
            error: 'On-chain dispute is not synced',
            detail: 'Call raiseDispute on the MoltGig escrow contract, then retry after the dispute is mined or synced.',
            chain_task_id: task.chain_task_id,
            chain_status: chainStatus,
          });
          return;
        }
      }
      res.json({
        message: 'Dispute was already synced.',
        task_id: id,
        reason,
      });
      return;
    }
    
    if (!['accepted', 'submitted'].includes(task.status)) {
      res.status(400).json({ error: 'Cannot dispute task in current status' });
      return;
    }

    if (task.chain_task_id) {
      const chainTask = await contractService.getTask(Number(task.chain_task_id));
      const chainStatus = contractTaskStateToDbStatus(chainTask.state);
      if (chainStatus !== 'disputed') {
        res.status(409).json({
          error: 'On-chain dispute is not synced',
          detail: 'Call raiseDispute on the MoltGig escrow contract, then retry after the dispute is mined or synced.',
          chain_task_id: task.chain_task_id,
          chain_status: chainStatus,
        });
        return;
      }
    }
    
    // Update task status
    await supabase
      .from('tasks')
      .update({ status: 'disputed' })
      .eq('id', id);
    
    // Update agent's disputed count
    if (req.agent?.id) {
      await supabase
        .from('agents')
        .update({ tasks_disputed: (req.agent.tasks_disputed || 0) + 1 })
        .eq('id', req.agent.id);
    }
    
    // Fire notification to both parties
    notificationService.notify('dispute.raised', id, { reason }).catch(err =>
      console.error('Notification error (dispute.raised):', err)
    );

    res.json({
      message: 'Dispute raised. A moderator will review.',
      task_id: id,
      reason
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/reject - Reject a submission
 *
 * Actions:
 *   "reject"             - Reject and reopen task for other agents
 *   "revision_requested" - Ask the same worker to resubmit
 */
router.post('/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback, action } = req.body;

    if (!feedback) {
      res.status(400).json({ error: 'Feedback is required when rejecting a submission' });
      return;
    }

    const validActions = ['reject', 'revision_requested'];
    const resolvedAction = action || 'reject';
    if (!validActions.includes(resolvedAction)) {
      res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
      return;
    }

    // Get task
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify caller is the requester
    if (task.requester_id !== req.agent?.id) {
      res.status(403).json({ error: 'Only the task requester can reject submissions' });
      return;
    }

    if (task.status !== 'submitted') {
      res.status(400).json({ error: 'Task must have a pending submission to reject' });
      return;
    }

    if (resolvedAction === 'reject') {
      if (task.chain_task_id) {
        res.status(409).json({
          error: 'Cannot reopen an escrow-claimed task with a DB-only rejection',
          detail: 'Request a revision, raise a dispute, or cancel/reassign on-chain before changing workers.',
          chain_task_id: task.chain_task_id,
        });
        return;
      }

      // Full rejection: reopen task for other agents
      await supabase
        .from('submissions')
        .update({ status: 'rejected', feedback, updated_at: new Date().toISOString() })
        .eq('task_id', id)
        .eq('status', 'pending');

      const { data: updatedTask } = await supabase
        .from('tasks')
        .update({
          status: 'funded',
          worker_id: null,
          accepted_at: null,
        })
        .eq('id', id)
        .eq('status', 'submitted')
        .select()
        .single();

      // Notify the worker
      notificationService.notify('task.rejected', id, { feedback }).catch(err =>
        console.error('Notification error (task.rejected):', err)
      );

      res.json({
        task: updatedTask,
        message: 'Submission rejected. Task reopened for other agents.',
        feedback
      });
    } else {
      // Revision requested: keep same worker, let them resubmit
      await supabase
        .from('submissions')
        .update({ status: 'revision_requested', feedback, updated_at: new Date().toISOString() })
        .eq('task_id', id)
        .eq('status', 'pending');

      const { data: updatedTask } = await supabase
        .from('tasks')
        .update({ status: 'accepted' })
        .eq('id', id)
        .eq('status', 'submitted')
        .select()
        .single();

      // Notify the worker
      notificationService.notify('task.revision_requested', id, { feedback }).catch(err =>
        console.error('Notification error (task.revision_requested):', err)
      );

      res.json({
        task: updatedTask,
        message: 'Revision requested. The worker can resubmit.',
        feedback
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/fund - Record funding transaction
 * 
 * Called AFTER the user has submitted the transaction on-chain.
 * The frontend handles the actual contract interaction.
 * We record the transaction hash and update task status.
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

    // Record transaction in transactions table
    const { error: txInsertError } = transactionAlreadyRecorded
      ? { error: null }
      : await supabase
        .from('transactions')
        .insert({
          task_id: id,
          tx_hash,
          tx_type: 'fund',
          from_address: req.wallet_address,
          amount_wei: task.reward_wei.toString(),
          status: 'confirmed',
          block_number: verifiedFunding.blockNumber,
        });

    if (txInsertError) {
      res.status(500).json({ error: 'Failed to record funding transaction' });
      return;
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

// ============== FEEDBACK ENDPOINTS ==============

/**
 * POST /api/tasks/:id/feedback - Leave feedback for a completed task
 * Both requester and worker can leave feedback for each other
 */
router.post('/:id/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = feedbackSchema.parse(req.body);
    const reviewerId = req.agent?.id;

    if (!reviewerId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, status, requester_id, worker_id')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Task must be completed
    if (task.status !== 'completed') {
      res.status(400).json({ error: 'Can only leave feedback on completed tasks' });
      return;
    }

    // Determine reviewee based on reviewer role
    let revieweeId: string;
    if (reviewerId === task.requester_id) {
      // Requester is reviewing the worker
      if (!task.worker_id) {
        res.status(400).json({ error: 'No worker assigned to this task' });
        return;
      }
      revieweeId = task.worker_id;
    } else if (reviewerId === task.worker_id) {
      // Worker is reviewing the requester
      if (!task.requester_id) {
        res.status(400).json({ error: 'No requester for this task' });
        return;
      }
      revieweeId = task.requester_id;
    } else {
      res.status(403).json({ error: 'Only task participants can leave feedback' });
      return;
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('task_feedback')
      .insert({
        task_id: id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: body.rating,
        comment: body.comment || null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        res.status(400).json({ error: 'You have already left feedback for this task' });
        return;
      }
      console.error('Error inserting feedback:', insertError);
      res.status(500).json({ error: 'Failed to submit feedback' });
      return;
    }

    // Update reviewee's average rating
    const { data: allFeedback } = await supabase
      .from('task_feedback')
      .select('rating')
      .eq('reviewee_id', revieweeId);

    if (allFeedback && allFeedback.length > 0) {
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

      // Get agent's task stats for reputation calculation
      const { data: agentStats } = await supabase
        .from('agents')
        .select('tasks_completed, tasks_disputed')
        .eq('id', revieweeId)
        .single();

      // Calculate reputation score and tier
      const { score, tier } = calculateReputation({
        average_rating: avgRating,
        feedback_count: allFeedback.length,
        tasks_completed: agentStats?.tasks_completed || 0,
        tasks_disputed: agentStats?.tasks_disputed || 0,
      });

      await supabase
        .from('agents')
        .update({
          average_rating: Math.round(avgRating * 100) / 100,
          feedback_count: allFeedback.length,
          reputation_score: score,
          reputation_tier: tier,
        })
        .eq('id', revieweeId);
    }

    res.status(201).json({ feedback, message: 'Feedback submitted successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: err.errors });
      return;
    }
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/:id/feedback - Get feedback for a specific task
 */
router.get('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: feedback, error } = await supabase
      .from('task_feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:agents!task_feedback_reviewer_id_fkey(id, wallet_address, moltbook_handle),
        reviewee:agents!task_feedback_reviewee_id_fkey(id, wallet_address, moltbook_handle)
      `)
      .eq('task_id', id);

    if (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
      return;
    }

    res.json({ feedback: feedback || [] });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ============== MESSAGING ENDPOINTS ==============
// Agent-to-agent messaging within task context

const COMPLETION_WINDOW_HOURS = 72;

/**
 * Check if messaging is allowed for a task based on its status and timing
 */
function isMessagingAllowed(task: any): { allowed: boolean; reason?: string } {
  if (!task) {
    return { allowed: false, reason: 'Task not found' };
  }

  const activeStatuses = ['funded', 'accepted', 'submitted', 'disputed'];
  if (activeStatuses.includes(task.status)) {
    return { allowed: true };
  }

  if (task.status === 'completed' && task.completed_at) {
    const completedAt = new Date(task.completed_at);
    const windowEnd = new Date(completedAt.getTime() + COMPLETION_WINDOW_HOURS * 60 * 60 * 1000);
    if (new Date() <= windowEnd) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Messaging window closed (72h after completion)' };
  }

  return { allowed: false, reason: `Messaging not available for task status: ${task.status}` };
}

/**
 * GET /api/tasks/:id/messages - Get messages for a task
 */
router.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.agent?.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!agentId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get task and verify participant
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, requester_id, worker_id, status, completed_at')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isParticipant = task.requester_id === agentId || task.worker_id === agentId;
    if (!isParticipant) {
      res.status(403).json({ error: 'You are not a participant in this task' });
      return;
    }

    // Get messages (oldest first for conversation flow)
    const { data: messages, error, count } = await supabase
      .from('task_messages')
      .select('*, sender:agents!sender_id(id, wallet_address, moltbook_handle)', { count: 'exact' })
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
      return;
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('task_messages')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .neq('sender_id', agentId)
      .is('read_at', null);

    const messagingStatus = isMessagingAllowed(task);

    res.json({
      messages: messages || [],
      pagination: { total: count || 0, limit, offset, has_more: offset + limit < (count || 0) },
      unread_count: unreadCount || 0,
      can_send: messagingStatus.allowed,
      messaging_status: messagingStatus.reason || 'Active'
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/messages - Send a message in a task
 */
router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.agent?.id;
    const { content, attachment_urls } = req.body;

    if (!agentId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Message content must be 2000 characters or less' });
      return;
    }

    if (attachment_urls) {
      if (!Array.isArray(attachment_urls) || attachment_urls.length > 5) {
        res.status(400).json({ error: 'Maximum 5 attachment URLs allowed' });
        return;
      }
      for (const url of attachment_urls) {
        if (typeof url !== 'string' || !url.startsWith('https://')) {
          res.status(400).json({ error: 'All attachment URLs must be valid HTTPS URLs' });
          return;
        }
      }
    }

    // Get task and verify participant
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, requester_id, worker_id, status, completed_at')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isParticipant = task.requester_id === agentId || task.worker_id === agentId;
    if (!isParticipant) {
      res.status(403).json({ error: 'You are not a participant in this task' });
      return;
    }

    const messagingStatus = isMessagingAllowed(task);
    if (!messagingStatus.allowed) {
      res.status(403).json({ error: messagingStatus.reason });
      return;
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('task_messages')
      .insert({
        task_id: taskId,
        sender_id: agentId,
        content: content.trim(),
        attachment_urls: attachment_urls || []
      })
      .select('*, sender:agents!sender_id(id, wallet_address, moltbook_handle)')
      .single();

    if (error) {
      console.error('Error creating message:', error);
      if (error.message.includes('Message limit')) {
        res.status(400).json({ error: 'Message limit (50) reached for this task' });
        return;
      }
      res.status(500).json({ error: 'Failed to send message' });
      return;
    }

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/messages/read-all - Mark all messages as read
 */
router.post('/:id/messages/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.agent?.id;

    if (!agentId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify participant
    const { data: task } = await supabase
      .from('tasks')
      .select('id, requester_id, worker_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isParticipant = task.requester_id === agentId || task.worker_id === agentId;
    if (!isParticipant) {
      res.status(403).json({ error: 'You are not a participant in this task' });
      return;
    }

    // Mark all from other party as read
    const { data } = await supabase
      .from('task_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('task_id', taskId)
      .neq('sender_id', agentId)
      .is('read_at', null)
      .select('id');

    res.json({ message: 'All messages marked as read', updated_count: data?.length || 0 });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
