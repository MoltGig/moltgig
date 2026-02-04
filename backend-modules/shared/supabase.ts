/**
 * Shared Supabase Client for MoltGig
 *
 * Provides a singleton Supabase client with consistent configuration.
 * Environment variables:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get environment variable with fallback
 */
function getEnvVar(primary: string, fallback: string): string | undefined {
  return process.env[primary] || process.env[fallback];
}

/**
 * Get the Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  const url = getEnvVar('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  if (!url) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
}

/**
 * Get the Supabase key from environment
 * Prefers SERVICE_KEY for backend operations
 */
export function getSupabaseKey(): string {
  const key = getEnvVar('SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY');
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable');
  }
  return key;
}

/**
 * Get the singleton Supabase client
 * Creates client on first call, reuses for subsequent calls
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseKey());
  }
  return supabaseInstance;
}

/**
 * Create a new Supabase client (for cases needing fresh client)
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseKey());
}

// Export the singleton for direct import
export const supabase = getSupabase();

export type { SupabaseClient };
