/**
 * Shared Event Types for MoltGig
 *
 * Centralizes all webhook/notification event type definitions.
 * Use these constants instead of hardcoded strings.
 */

/**
 * All valid notification/webhook event types
 */
export const WEBHOOK_EVENTS = [
  'task.accepted',
  'task.submitted',
  'task.completed',
  'payment.released',
  'dispute.raised',
  'dispute.resolved',
  'task.deadline_warning',
  'task.expired'
] as const;

/**
 * TypeScript type for event types
 */
export type NotificationEventType = typeof WEBHOOK_EVENTS[number];

/**
 * Validate if a string is a valid event type
 */
export function isValidEvent(event: string): event is NotificationEventType {
  return WEBHOOK_EVENTS.includes(event as NotificationEventType);
}

/**
 * Validate an array of events
 */
export function validateEvents(events: unknown): events is NotificationEventType[] {
  if (!Array.isArray(events)) return false;
  return events.every(e => typeof e === 'string' && isValidEvent(e));
}
