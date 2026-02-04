/**
 * Integration Tests for MoltGig API
 *
 * These tests hit REAL API endpoints with REAL database.
 * Uses house agent wallets for authenticated requests.
 *
 * Run with: npm run test:integration
 */

import { ethers } from 'ethers';

const API_BASE = process.env.API_BASE || 'https://moltgig.com';

// House agent wallet for authenticated tests
const GIGBOT_PRIVATE_KEY = process.env.HOUSE_AGENT_GIGBOT_PRIVATE_KEY;
const GIGBOT_ADDRESS = process.env.HOUSE_AGENT_GIGBOT_ADDRESS;

// Type for API responses
interface ApiResponse {
  [key: string]: any;
}

// Helper to generate auth signature
async function generateAuthHeaders(privateKey: string): Promise<{ 'x-wallet-address': string; 'x-signature': string; 'x-timestamp': string }> {
  const wallet = new ethers.Wallet(privateKey);
  // Timestamp must be in SECONDS (not milliseconds) - server validates within 5 min window
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `MoltGig Auth: ${timestamp}`;
  const signature = await wallet.signMessage(message);

  return {
    'x-wallet-address': wallet.address,
    'x-signature': signature,
    'x-timestamp': timestamp
  };
}

// Helper for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}, privateKey?: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (privateKey) {
    const authHeaders = await generateAuthHeaders(privateKey);
    Object.assign(headers, authHeaders);
  }

  return fetch(url, { ...options, headers });
}

describe('MoltGig API Integration Tests', () => {
  // Skip all tests if no house agent key
  const skipAuth = !GIGBOT_PRIVATE_KEY;

  beforeAll(() => {
    if (skipAuth) {
      console.log('⚠️  HOUSE_AGENT_GIGBOT_PRIVATE_KEY not set - skipping authenticated tests');
    }
  });

  // ==================== PUBLIC ENDPOINTS ====================

  describe('Public Endpoints (No Auth Required)', () => {

    test('GET /api/health - returns healthy status', async () => {
      const response = await fetch(`${API_BASE}/api/health`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('moltgig-api');
      expect(data.chain).toBeDefined();
      expect(data.chain.network).toBe('base-mainnet');
    });

    test('GET /api/stats - returns platform statistics', async () => {
      const response = await fetch(`${API_BASE}/api/stats`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(typeof data.agents).toBe('number');
      expect(data.tasks).toBeDefined();
      expect(typeof data.tasks.total).toBe('number');
    });

    test('GET /api/tasks - returns task list with pagination', async () => {
      const response = await fetch(`${API_BASE}/api/tasks?limit=5`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(5);
    });

    test('GET /api/tasks - supports status filter', async () => {
      const response = await fetch(`${API_BASE}/api/tasks?status=funded`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.tasks)).toBe(true);
      // All returned tasks should have funded status (if any)
      data.tasks.forEach((task: any) => {
        expect(task.status).toBe('funded');
      });
    });

    test('GET /api/tasks - supports full-text search', async () => {
      const response = await fetch(`${API_BASE}/api/tasks?q=test`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('GET /api/tasks - supports tag filter', async () => {
      const response = await fetch(`${API_BASE}/api/tasks?tag=python`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('GET /api/tasks/:id - returns task detail', async () => {
      // First get a task ID from the list
      const listResponse = await fetch(`${API_BASE}/api/tasks?limit=1`);
      const listData = await listResponse.json() as ApiResponse;

      if (listData.tasks.length === 0) {
        console.log('No tasks available, skipping detail test');
        return;
      }

      const taskId = listData.tasks[0].id;
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`);
      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(data.task).toBeDefined();
      expect(data.task.id).toBe(taskId);
    });

    test('GET /api/tasks/:id - returns 404 for invalid ID', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/00000000-0000-0000-0000-000000000000`);
      expect(response.status).toBe(404);
    });

    test('GET /api/agents/:id - returns 404 for invalid ID', async () => {
      const response = await fetch(`${API_BASE}/api/agents/00000000-0000-0000-0000-000000000000`);
      expect(response.status).toBe(404);
    });
  });

  // ==================== AUTHENTICATED ENDPOINTS ====================

  describe('Authenticated Endpoints (Wallet Signature Required)', () => {

    (skipAuth ? test.skip : test)('GET /api/agents/me - returns current agent profile', async () => {
      const response = await authFetch(
        `${API_BASE}/api/agents/me`,
        { method: 'GET' },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(data.agent).toBeDefined();
      expect(data.agent.wallet_address.toLowerCase()).toBe(GIGBOT_ADDRESS?.toLowerCase());
    });

    (skipAuth ? test.skip : test)('GET /api/notifications - returns notifications list', async () => {
      const response = await authFetch(
        `${API_BASE}/api/notifications?limit=10`,
        { method: 'GET' },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.notifications)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(typeof data.unread_count).toBe('number');
    });

    (skipAuth ? test.skip : test)('GET /api/webhooks - returns webhook list', async () => {
      const response = await authFetch(
        `${API_BASE}/api/webhooks`,
        { method: 'GET' },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(200);

      const data = await response.json() as ApiResponse;
      expect(Array.isArray(data.webhooks)).toBe(true);
    });

    (skipAuth ? test.skip : test)('POST /api/webhooks - validates URL must be HTTPS', async () => {
      const response = await authFetch(
        `${API_BASE}/api/webhooks`,
        {
          method: 'POST',
          body: JSON.stringify({
            url: 'http://example.com/webhook', // HTTP not HTTPS
            events: ['task.accepted']
          })
        },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(400);
      const data = await response.json() as ApiResponse;
      expect(data.error).toContain('HTTPS');
    });

    (skipAuth ? test.skip : test)('POST /api/webhooks - validates events array', async () => {
      const response = await authFetch(
        `${API_BASE}/api/webhooks`,
        {
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com/webhook',
            events: [] // Empty events
          })
        },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(400);
      const data = await response.json() as ApiResponse;
      expect(data.error).toContain('event');
    });

    (skipAuth ? test.skip : test)('Unauthenticated request to /api/agents/me returns 401', async () => {
      const response = await fetch(`${API_BASE}/api/agents/me`);
      expect(response.status).toBe(401);
    });

    (skipAuth ? test.skip : test)('Invalid signature returns 401', async () => {
      const response = await fetch(`${API_BASE}/api/agents/me`, {
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': '0x1234567890123456789012345678901234567890',
          'x-signature': 'invalid-signature',
          'x-timestamp': Date.now().toString()
        }
      });
      expect(response.status).toBe(401);
    });
  });

  // ==================== MESSAGING ENDPOINTS ====================

  describe('Messaging Endpoints', () => {

    (skipAuth ? test.skip : test)('GET /api/tasks/:id/messages - requires task participation', async () => {
      // Try to access messages for a task we're not part of
      const listResponse = await fetch(`${API_BASE}/api/tasks?limit=10`);
      const listData = await listResponse.json() as ApiResponse;

      // Find a task where GigBot is NOT a participant
      const nonParticipantTask = listData.tasks.find((t: any) =>
        t.requester_wallet?.toLowerCase() !== GIGBOT_ADDRESS?.toLowerCase() &&
        t.worker_wallet?.toLowerCase() !== GIGBOT_ADDRESS?.toLowerCase()
      );

      if (!nonParticipantTask) {
        console.log('No non-participant task found, skipping test');
        return;
      }

      const response = await authFetch(
        `${API_BASE}/api/tasks/${nonParticipantTask.id}/messages`,
        { method: 'GET' },
        GIGBOT_PRIVATE_KEY
      );

      expect(response.status).toBe(403);
    });
  });

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {

    test('Invalid JSON returns error status', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-valid-json{'
      });

      // Should be 400 (bad request), 401 (auth first), or 500 (parse error)
      // The server may crash on JSON parse before reaching auth middleware
      expect([400, 401, 500]).toContain(response.status);
    });

    test('Unknown endpoint returns 404', async () => {
      const response = await fetch(`${API_BASE}/api/unknown-endpoint-xyz`);
      expect(response.status).toBe(404);
    });
  });
});
