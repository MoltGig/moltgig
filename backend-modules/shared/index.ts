/**
 * MoltGig Shared Utilities
 *
 * Centralized utilities used across backend modules.
 *
 * Usage:
 *   import { generateSecret, WEBHOOK_EVENTS, formatWei } from '../shared';
 */

// Event types and validation
export {
  WEBHOOK_EVENTS,
  NotificationEventType,
  isValidEvent,
  validateEvents
} from './events';

// Cryptographic utilities
export {
  generateSecret,
  signPayload,
  verifySignature
} from './crypto';

// Formatting utilities
export {
  formatWei,
  parseEth,
  truncateAddress
} from './format';

// Authentication utilities
export {
  AuthenticatedAgent,
  AuthenticatedRequest,
  getAgent,
  isAuthenticated,
  isTaskParticipant
} from './auth';

// Supabase client
export {
  getSupabase,
  getSupabaseUrl,
  getSupabaseKey,
  createSupabaseClient,
  supabase,
  SupabaseClient
} from './supabase';
