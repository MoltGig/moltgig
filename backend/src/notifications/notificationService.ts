/**
 * Notification Service for MoltGig
 *
 * Handles creating notifications and delivering webhooks.
 *
 * Usage:
 *   import { notificationService } from './notificationService';
 *   await notificationService.notify('task.accepted', taskId, requesterId, { ... });
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Types
export type NotificationEventType =
  | 'task.accepted'
  | 'task.submitted'
  | 'task.completed'
  | 'payment.released'
  | 'dispute.raised'
  | 'dispute.resolved'
  | 'task.deadline_warning'
  | 'task.expired';

interface NotificationData {
  task_id?: string;
  task_title?: string;
  amount_wei?: string;
  worker_id?: string;
  requester_id?: string;
  deadline?: string;
  reason?: string;
  resolution?: string;
  [key: string]: unknown;
}

interface WebhookPayload {
  event: NotificationEventType;
  data: NotificationData;
  timestamp: string;
  notification_id: string;
}

// Event configurations: title templates and recipients
const EVENT_CONFIG: Record<NotificationEventType, {
  title: (data: NotificationData) => string;
  body: (data: NotificationData) => string;
  recipients: 'requester' | 'worker' | 'both';
}> = {
  'task.accepted': {
    title: (d) => `Task accepted: ${d.task_title || 'Untitled'}`,
    body: (d) => `Your task has been claimed by a worker.`,
    recipients: 'requester'
  },
  'task.submitted': {
    title: (d) => `Work submitted: ${d.task_title || 'Untitled'}`,
    body: (d) => `The worker has submitted their deliverable. Review and approve within 72 hours.`,
    recipients: 'requester'
  },
  'task.completed': {
    title: (d) => `Task completed: ${d.task_title || 'Untitled'}`,
    body: (d) => `The task has been approved and payment is being released.`,
    recipients: 'both'
  },
  'payment.released': {
    title: (d) => `Payment received`,
    body: (d) => `You received ${formatWei(d.amount_wei)} ETH for completing a task.`,
    recipients: 'worker'
  },
  'dispute.raised': {
    title: (d) => `Dispute raised: ${d.task_title || 'Untitled'}`,
    body: (d) => `A dispute has been raised. Reason: ${d.reason || 'Not specified'}`,
    recipients: 'both'
  },
  'dispute.resolved': {
    title: (d) => `Dispute resolved: ${d.task_title || 'Untitled'}`,
    body: (d) => `The dispute has been resolved. Outcome: ${d.resolution || 'See details'}`,
    recipients: 'both'
  },
  'task.deadline_warning': {
    title: (d) => `Deadline approaching: ${d.task_title || 'Untitled'}`,
    body: (d) => `Your task deadline is in 24 hours: ${d.deadline || 'Check task details'}`,
    recipients: 'worker'
  },
  'task.expired': {
    title: (d) => `Task expired: ${d.task_title || 'Untitled'}`,
    body: (d) => `The task deadline has passed without a submission.`,
    recipients: 'both'
  }
};

function formatWei(wei: string | undefined): string {
  if (!wei) return '0';
  const eth = BigInt(wei) / BigInt(10 ** 18);
  const remainder = BigInt(wei) % BigInt(10 ** 18);
  const decimal = remainder.toString().padStart(18, '0').slice(0, 6);
  return `${eth}.${decimal}`;
}

class NotificationService {
  private supabase: SupabaseClient;
  private webhookTimeout = 5000; // 5 second timeout
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 30000]; // 1s, 5s, 30s

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a notification for a task event
   */
  async notify(
    eventType: NotificationEventType,
    taskId: string,
    data: NotificationData = {}
  ): Promise<{ success: boolean; notificationIds: string[]; errors: string[] }> {
    const errors: string[] = [];
    const notificationIds: string[] = [];

    try {
      // Get task with requester and worker info
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .select('id, title, requester_id, worker_id, reward_wei, deadline')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return { success: false, notificationIds: [], errors: [`Task not found: ${taskId}`] };
      }

      // Enrich data with task info
      const enrichedData: NotificationData = {
        task_id: task.id,
        task_title: task.title,
        amount_wei: task.reward_wei?.toString(),
        requester_id: task.requester_id,
        worker_id: task.worker_id,
        deadline: task.deadline,
        ...data
      };

      const config = EVENT_CONFIG[eventType];
      const title = config.title(enrichedData);
      const body = config.body(enrichedData);

      // Determine recipients
      const recipientIds: string[] = [];
      if (config.recipients === 'requester' && task.requester_id) {
        recipientIds.push(task.requester_id);
      } else if (config.recipients === 'worker' && task.worker_id) {
        recipientIds.push(task.worker_id);
      } else if (config.recipients === 'both') {
        if (task.requester_id) recipientIds.push(task.requester_id);
        if (task.worker_id) recipientIds.push(task.worker_id);
      }

      // Create notifications for each recipient
      for (const agentId of recipientIds) {
        const { data: notification, error: notifError } = await this.supabase
          .from('notifications')
          .insert({
            agent_id: agentId,
            event_type: eventType,
            title,
            body,
            data: enrichedData
          })
          .select('id')
          .single();

        if (notifError) {
          errors.push(`Failed to create notification for ${agentId}: ${notifError.message}`);
        } else if (notification) {
          notificationIds.push(notification.id);

          // Deliver webhooks asynchronously (don't await)
          this.deliverWebhooks(agentId, eventType, enrichedData, notification.id)
            .catch(err => console.error('Webhook delivery error:', err));
        }
      }

      return {
        success: errors.length === 0,
        notificationIds,
        errors
      };
    } catch (error) {
      return {
        success: false,
        notificationIds,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Deliver webhooks for an agent
   */
  private async deliverWebhooks(
    agentId: string,
    eventType: NotificationEventType,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    // Get active webhooks for this agent that subscribe to this event
    const { data: webhooks, error } = await this.supabase
      .from('webhooks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error || !webhooks || webhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
      notification_id: notificationId
    };

    for (const webhook of webhooks) {
      this.deliverSingleWebhook(webhook, payload);
    }
  }

  /**
   * Deliver a single webhook with retries
   */
  private async deliverSingleWebhook(
    webhook: { id: string; url: string; secret: string; failure_count: number },
    payload: WebhookPayload,
    attempt = 0
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);
    const signature = this.signPayload(payloadString, webhook.secret);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.webhookTimeout);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MoltGig-Signature': signature,
          'X-MoltGig-Event': payload.event
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Success - reset failure count
        await this.supabase
          .from('webhooks')
          .update({
            failure_count: 0,
            last_success_at: new Date().toISOString()
          })
          .eq('id', webhook.id);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Retry or mark as failed
      if (attempt < this.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt]));
        return this.deliverSingleWebhook(webhook, payload, attempt + 1);
      }

      // Max retries exceeded
      const newFailureCount = webhook.failure_count + 1;
      const updates: Record<string, unknown> = {
        failure_count: newFailureCount,
        last_failure_at: new Date().toISOString()
      };

      // Disable webhook after 10 consecutive failures
      if (newFailureCount >= 10) {
        updates.is_active = false;
      }

      await this.supabase
        .from('webhooks')
        .update(updates)
        .eq('id', webhook.id);
    }
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for documentation/testing)
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate a secure webhook secret
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export { NotificationService };
