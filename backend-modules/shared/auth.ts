/**
 * Shared Authentication Utilities for MoltGig
 *
 * Centralizes request authentication helpers.
 */

import { Request } from 'express';

/**
 * Agent type as stored in request by auth middleware
 */
export interface AuthenticatedAgent {
  id: string;
  wallet_address: string;
  name?: string;
}

/**
 * Extended Request type with authenticated agent
 */
export interface AuthenticatedRequest extends Request {
  agent: AuthenticatedAgent;
}

/**
 * Get authenticated agent from request
 * Returns null if not authenticated
 */
export function getAgent(req: Request): AuthenticatedAgent | null {
  return (req as AuthenticatedRequest).agent || null;
}

/**
 * Check if request has authenticated agent
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return getAgent(req) !== null;
}

/**
 * Check if agent is participant in a task
 */
export function isTaskParticipant(
  agent: AuthenticatedAgent,
  task: { requester_id?: string | null; worker_id?: string | null }
): boolean {
  return agent.id === task.requester_id || agent.id === task.worker_id;
}
