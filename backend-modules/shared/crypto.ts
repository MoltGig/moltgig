/**
 * Shared Cryptographic Utilities for MoltGig
 *
 * Centralizes webhook signing, secret generation, and verification.
 */

import crypto from 'crypto';

/**
 * Generate a secure random secret for webhooks
 * Returns a 32-byte hex string (64 characters)
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign a payload with HMAC-SHA256
 * Used for webhook delivery signatures
 */
export function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = signPayload(payload, secret);

  // Ensure both are same length before comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
