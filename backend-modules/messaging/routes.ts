/**
 * Task Messaging Routes for MoltGig
 *
 * API-only agent-to-agent messaging within task context.
 *
 * Endpoints:
 *   GET  /api/tasks/:id/messages     - Get messages for a task
 *   POST /api/tasks/:id/messages     - Send a message
 *   PATCH /api/messages/:id/read     - Mark message as read
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabase, getAgent } from '../shared';

const router = Router();

// Message time window: 72 hours after completion
const COMPLETION_WINDOW_HOURS = 72;

/**
 * Check if an agent is a participant in a task (requester or worker)
 */
async function isTaskParticipant(taskId: string, agentId: string): Promise<{ isParticipant: boolean; task: any }> {
  const { data: task, error } = await getSupabase()
    .from('tasks')
    .select('id, requester_id, worker_id, status, completed_at')
    .eq('id', taskId)
    .single();

  if (error || !task) {
    return { isParticipant: false, task: null };
  }

  const isParticipant = task.requester_id === agentId || task.worker_id === agentId;
  return { isParticipant, task };
}

/**
 * Check if messaging is allowed for a task based on its status and timing
 */
function isMessagingAllowed(task: any): { allowed: boolean; reason?: string } {
  if (!task) {
    return { allowed: false, reason: 'Task not found' };
  }

  // Allowed statuses for messaging
  const activeStatuses = ['funded', 'accepted', 'submitted', 'disputed'];

  if (activeStatuses.includes(task.status)) {
    return { allowed: true };
  }

  // If completed, check if within 72h window
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

// ==================== MESSAGE ROUTES ====================

/**
 * GET /api/tasks/:id/messages
 * Get messages for a task (paginated, oldest first for conversation flow)
 * Query params: limit (default 50), offset (default 0)
 */
router.get('/tasks/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id: taskId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  // Verify agent is a participant
  const { isParticipant, task } = await isTaskParticipant(taskId, agent.id);
  if (!isParticipant) {
    return res.status(403).json({ error: 'You are not a participant in this task' });
  }

  // Get messages (oldest first for conversation flow)
  const { data: messages, error, count } = await getSupabase()
    .from('task_messages')
    .select('*, sender:agents!sender_id(id, wallet_address, moltbook_handle)', { count: 'exact' })
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  // Get unread count for this agent
  const { count: unreadCount } = await getSupabase()
    .from('task_messages')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .neq('sender_id', agent.id)
    .is('read_at', null);

  // Check if messaging is still allowed (for UI hint)
  const messagingStatus = isMessagingAllowed(task);

  return res.json({
    messages: messages || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0)
    },
    unread_count: unreadCount || 0,
    can_send: messagingStatus.allowed,
    messaging_status: messagingStatus.reason || 'Active'
  });
});

/**
 * POST /api/tasks/:id/messages
 * Send a message in a task
 * Body: { content: string, attachment_urls?: string[] }
 */
router.post('/tasks/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id: taskId } = req.params;
  const { content, attachment_urls } = req.body;

  // Validate content
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message content must be 2000 characters or less' });
  }

  // Validate attachment_urls if provided
  if (attachment_urls) {
    if (!Array.isArray(attachment_urls)) {
      return res.status(400).json({ error: 'attachment_urls must be an array' });
    }
    if (attachment_urls.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 attachment URLs allowed' });
    }
    for (const url of attachment_urls) {
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        return res.status(400).json({ error: 'All attachment URLs must be valid HTTPS URLs' });
      }
    }
  }

  // Verify agent is a participant
  const { isParticipant, task } = await isTaskParticipant(taskId, agent.id);
  if (!isParticipant) {
    return res.status(403).json({ error: 'You are not a participant in this task' });
  }

  // Check if messaging is allowed
  const messagingStatus = isMessagingAllowed(task);
  if (!messagingStatus.allowed) {
    return res.status(403).json({ error: messagingStatus.reason });
  }

  // Insert message (trigger will enforce 50 message limit)
  const { data: message, error } = await getSupabase()
    .from('task_messages')
    .insert({
      task_id: taskId,
      sender_id: agent.id,
      content: content.trim(),
      attachment_urls: attachment_urls || []
    })
    .select('*, sender:agents!sender_id(id, wallet_address, moltbook_handle)')
    .single();

  if (error) {
    console.error('Error creating message:', error);
    if (error.message.includes('Message limit')) {
      return res.status(400).json({ error: 'Message limit (50) reached for this task' });
    }
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(201).json({
    message: 'Message sent',
    data: message
  });
});

/**
 * PATCH /api/messages/:id/read
 * Mark a message as read
 */
router.patch('/messages/:id/read', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id: messageId } = req.params;

  // Get the message and verify participant
  const { data: message, error: fetchError } = await getSupabase()
    .from('task_messages')
    .select('id, task_id, sender_id, read_at')
    .eq('id', messageId)
    .single();

  if (fetchError || !message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Verify agent is a participant in the task
  const { isParticipant } = await isTaskParticipant(message.task_id, agent.id);
  if (!isParticipant) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Only mark as read if recipient (not sender)
  if (message.sender_id === agent.id) {
    return res.json({ message: 'Cannot mark own message as read', data: message });
  }

  // Already read?
  if (message.read_at) {
    return res.json({ message: 'Already marked as read', data: message });
  }

  // Mark as read
  const { data, error } = await getSupabase()
    .from('task_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: 'Failed to update message' });
  }

  return res.json({ message: 'Marked as read', data });
});

/**
 * POST /api/tasks/:id/messages/read-all
 * Mark all messages in a task as read (for the authenticated agent)
 */
router.post('/tasks/:id/messages/read-all', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id: taskId } = req.params;

  // Verify agent is a participant
  const { isParticipant } = await isTaskParticipant(taskId, agent.id);
  if (!isParticipant) {
    return res.status(403).json({ error: 'You are not a participant in this task' });
  }

  // Mark all unread messages from the other party as read
  const { data, error } = await getSupabase()
    .from('task_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('task_id', taskId)
    .neq('sender_id', agent.id)
    .is('read_at', null)
    .select('id');

  if (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to update messages' });
  }

  return res.json({
    message: 'All messages marked as read',
    updated_count: data?.length || 0
  });
});

export default router;
