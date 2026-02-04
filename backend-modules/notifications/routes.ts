/**
 * Notification & Webhook Routes for MoltGig
 *
 * Endpoints:
 *   GET  /api/notifications         - List notifications (paginated)
 *   PATCH /api/notifications/:id/read - Mark single as read
 *   POST /api/notifications/read-all - Mark all as read
 *   POST /api/webhooks              - Register webhook
 *   GET  /api/webhooks              - List agent's webhooks
 *   DELETE /api/webhooks/:id        - Remove webhook
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  WEBHOOK_EVENTS,
  isValidEvent,
  generateSecret,
  getAgent,
  getSupabase
} from '../shared';

const router = Router();

// Valid event types (exported from shared for external use)
const VALID_EVENTS = WEBHOOK_EVENTS;

// ==================== NOTIFICATION ROUTES ====================

/**
 * GET /api/notifications
 * List notifications for authenticated agent
 * Query params: limit (default 20), offset (default 0), unread_only (default false)
 */
router.get('/notifications', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const unreadOnly = req.query.unread_only === 'true';

  let query = getSupabase()
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }

  // Get unread count
  const { count: unreadCount } = await getSupabase()
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .is('read_at', null);

  return res.json({
    notifications: data,
    pagination: {
      total: count,
      limit,
      offset,
      has_more: offset + limit < (count || 0)
    },
    unread_count: unreadCount || 0
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;

  // Verify notification belongs to agent
  const { data: notification, error: fetchError } = await getSupabase()
    .from('notifications')
    .select('id, agent_id, read_at')
    .eq('id', id)
    .single();

  if (fetchError || !notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.agent_id !== agent.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (notification.read_at) {
    return res.json({ message: 'Already marked as read', notification });
  }

  const { data, error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }

  return res.json({ message: 'Marked as read', notification: data });
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for authenticated agent
 */
router.post('/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { data, error, count } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('agent_id', agent.id)
    .is('read_at', null)
    .select('id');

  if (error) {
    console.error('Error marking all as read:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }

  return res.json({
    message: 'All notifications marked as read',
    updated_count: data?.length || 0
  });
});

// ==================== WEBHOOK ROUTES ====================

/**
 * POST /api/webhooks
 * Register a new webhook
 * Body: { url: string, events: string[] }
 */
router.post('/webhooks', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { url, events } = req.body;

  // Validate URL
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!url.startsWith('https://')) {
    return res.status(400).json({ error: 'URL must use HTTPS' });
  }

  // Validate events
  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      error: 'At least one event type is required',
      valid_events: VALID_EVENTS
    });
  }

  const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    return res.status(400).json({
      error: `Invalid event types: ${invalidEvents.join(', ')}`,
      valid_events: VALID_EVENTS
    });
  }

  // Check webhook limit (max 5 per agent)
  const { count } = await getSupabase()
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id);

  if ((count || 0) >= 5) {
    return res.status(400).json({
      error: 'Maximum webhook limit (5) reached. Delete an existing webhook first.'
    });
  }

  // Generate secret
  const secret = generateSecret();

  // Create webhook
  const { data, error } = await getSupabase()
    .from('webhooks')
    .insert({
      agent_id: agent.id,
      url,
      events,
      secret
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating webhook:', error);
    if (error.message.includes('webhooks_url_https')) {
      return res.status(400).json({ error: 'URL must use HTTPS' });
    }
    return res.status(500).json({ error: 'Failed to create webhook' });
  }

  return res.status(201).json({
    message: 'Webhook registered successfully',
    webhook: {
      id: data.id,
      url: data.url,
      events: data.events,
      secret: data.secret, // Only shown once at creation
      is_active: data.is_active,
      created_at: data.created_at
    },
    important: 'Save the secret - it will not be shown again. Use it to verify webhook signatures.'
  });
});

/**
 * GET /api/webhooks
 * List all webhooks for authenticated agent
 */
router.get('/webhooks', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { data, error } = await getSupabase()
    .from('webhooks')
    .select('id, url, events, is_active, failure_count, last_success_at, last_failure_at, created_at')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching webhooks:', error);
    return res.status(500).json({ error: 'Failed to fetch webhooks' });
  }

  return res.json({
    webhooks: data,
    count: data?.length || 0
  });
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
router.delete('/webhooks/:id', requireAuth, async (req: Request, res: Response) => {
  const agent = getAgent(req);
  if (!agent) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;

  // Verify webhook belongs to agent
  const { data: webhook, error: fetchError } = await getSupabase()
    .from('webhooks')
    .select('id, agent_id')
    .eq('id', id)
    .single();

  if (fetchError || !webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  if (webhook.agent_id !== agent.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await getSupabase()
    .from('webhooks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }

  return res.json({ message: 'Webhook deleted successfully' });
});

export default router;
