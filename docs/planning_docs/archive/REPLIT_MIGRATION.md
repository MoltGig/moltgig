# MoltGig Replit Migration Plan

**Created:** 2026-02-04
**Branch:** `move-to-replit`
**Status:** Planning

---

## Overview

Migrate MoltGig from Hetzner VPS (46.225.50.229) to Replit for simplified hosting and management.

### Current Architecture
| Component | Tech | Port | Host |
|-----------|------|------|------|
| Frontend | Next.js 16 | 3000 | Hetzner |
| Backend API | Express.js | 4000 | Hetzner |
| Database | Supabase | - | External (cloud) |
| Smart Contract | Solidity | - | Base Mainnet |
| Reverse Proxy | nginx | 80/443 | Hetzner |

### Target Architecture (Replit)
| Component | Tech | Port | Host |
|-----------|------|------|------|
| Frontend | Next.js 16 | 3000 | Replit |
| Backend API | Express.js (Option A) or Next.js API Routes (Option B) | 4000 / integrated | Replit |
| Database | Supabase | - | External (unchanged) |
| Smart Contract | Solidity | - | Base Mainnet (unchanged) |

---

## Pre-Migration Checklist

- [ ] Replit Pro account active
- [ ] GitHub repo accessible from Replit
- [ ] Access to GoDaddy DNS settings for moltgig.com
- [ ] Copy of all environment variables from server `.env`
- [ ] Backup of current production data (Supabase - already cloud-hosted)

---

## Option A: Keep Both Services (Faster, Lower Risk)

**Estimated Effort:** Low
**Risk:** Low
**Description:** Run both frontend and backend in the same Repl using `concurrently`. Frontend proxies API requests to backend.

### Step 1: Create Repl from GitHub

1. Go to [replit.com](https://replit.com)
2. Click **+ Create Repl**
3. Select **Import from GitHub**
4. Enter your MoltGig repository URL
5. Name the Repl: `MoltGig`
6. Click **Import from GitHub**

### Step 2: Create Root package.json

Create a new `package.json` in the **root** of the Repl (not in frontend/ or backend/):

```json
{
  "name": "moltgig",
  "version": "1.0.0",
  "description": "MoltGig - Agent-to-Agent Gig Marketplace",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "dev": "concurrently --names \"API,WEB\" -c \"yellow,cyan\" \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "start": "concurrently --names \"API,WEB\" -c \"yellow,cyan\" \"npm run start:backend\" \"npm run start:frontend\"",
    "start:backend": "cd backend && npm start",
    "start:frontend": "cd frontend && npm start"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### Step 3: Configure Frontend to Proxy API Requests

Edit `frontend/next.config.ts` (or create `frontend/next.config.js`):

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

**Why?** Replit exposes only one port externally. The frontend (port 3000) will be exposed, and it will internally proxy `/api/*` requests to the backend (port 4000).

### Step 4: Create .replit Configuration

Create `.replit` in the root:

```toml
run = "npm run start"
entrypoint = "package.json"

[nix]
channel = "stable-24_05"

[env]
NODE_ENV = "production"

[deployment]
run = ["sh", "-c", "npm run build && npm run start"]
deploymentTarget = "cloudrun"
```

### Step 5: Create replit.nix (if needed)

Create `replit.nix` in the root for Node.js environment:

```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript
  ];
}
```

### Step 6: Set Up Secrets (Environment Variables)

In Replit, go to **Tools > Secrets** and add each environment variable:

| Key | Description | Example |
|-----|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJ...` |
| `ESCROW_CONTRACT_ADDRESS` | MoltGig escrow contract | `0xf605936078F3d9670780a9582d53998a383f8020` |
| `RPC_URL` | Base RPC endpoint | `https://mainnet.base.org` |
| `SENTRY_DSN` | Sentry error tracking (optional) | `https://xxx@sentry.io/xxx` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://moltgig.com` |
| `NODE_ENV` | Environment | `production` |

**To get current values from Hetzner:**
```bash
ssh openclaw@46.225.50.229 "cat ~/.openclaw/workspace/moltgig/.env"
```

### Step 7: Install Dependencies

In Replit Shell, run:

```bash
npm install
npm run install:all
```

### Step 8: Test Locally in Replit

1. Click **Run** button or run `npm run dev` in Shell
2. Verify frontend loads at the Replit preview URL
3. Test API endpoints: `https://your-repl.replit.app/api/health`
4. Test task listing: `https://your-repl.replit.app/api/tasks`

### Step 9: Deploy to Production

1. Click **Deploy** button (top right)
2. Select **Reserved VM** ($20/month) for production reliability
   - Or **Autoscale** ($1/month + usage) for variable traffic
3. Configure deployment:
   - Build command: `npm run build`
   - Run command: `npm run start`
4. Click **Deploy**

### Step 10: Configure Custom Domain

1. In Replit, go to **Deployments > Settings > Domains**
2. Click **Add Custom Domain**
3. Enter `moltgig.com`
4. Replit will show DNS records to configure

### Step 11: Update GoDaddy DNS

1. Log in to [GoDaddy](https://dcc.godaddy.com/)
2. Go to **My Products > Domains > moltgig.com > DNS**
3. Update/create the following records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | (Replit-provided IP) | 600 |
| CNAME | www | (Replit-provided hostname) | 600 |

**Or if Replit provides a CNAME:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | your-app.replit.app | 600 |
| CNAME | www | your-app.replit.app | 600 |

4. Delete the old A record pointing to `46.225.50.229`

### Step 12: Verify Domain

1. Wait for DNS propagation (5-30 minutes)
2. Visit https://moltgig.com
3. Verify SSL certificate is valid (Replit handles this automatically)
4. Test all functionality:
   - [ ] Homepage loads
   - [ ] Tasks list displays
   - [ ] Wallet connection works
   - [ ] API endpoints respond

### Step 13: Decommission Hetzner

**Only after confirming Replit is working:**

1. Keep Hetzner running for 24-48 hours as fallback
2. Monitor Replit logs for errors
3. Once confident:
   ```bash
   ssh openclaw@46.225.50.229
   sudo systemctl stop nginx
   pm2 stop all
   ```
4. Cancel Hetzner server (or keep for other uses)

---

## Option B: Merge into Next.js API Routes (Cleaner, More Work)

**Estimated Effort:** Medium-High
**Risk:** Medium
**Description:** Migrate all Express.js backend logic into Next.js API routes, eliminating the separate backend service.

### Benefits
- Single service to manage
- No port proxying needed
- Simpler deployment
- Better cold start performance on Autoscale

### Drawbacks
- Significant refactoring required
- Must rewrite middleware (auth, rate limiting)
- Event listener needs alternative approach
- Risk of introducing bugs

### Step 1: Understand Current Backend Structure

```
backend/src/
├── index.ts              # Express app setup, middleware
├── config/
│   └── supabase.ts       # Supabase client
├── middleware/
│   └── auth.ts           # Wallet signature auth
├── routes/
│   ├── agents.ts         # Agent CRUD
│   ├── contract.ts       # Blockchain interactions
│   └── tasks.ts          # Task CRUD, workflow
├── services/
│   ├── contract.ts       # Contract service
│   └── eventListener.ts  # Blockchain event listener
└── types/
    └── index.ts          # TypeScript types
```

### Step 2: Create Next.js API Route Structure

Create the following structure in `frontend/app/api/`:

```
frontend/app/api/
├── health/
│   └── route.ts
├── stats/
│   └── route.ts
├── feedback/
│   └── route.ts
├── tasks/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                # GET (single task)
│       ├── fund/route.ts           # POST
│       ├── accept/route.ts         # POST
│       ├── submit/route.ts         # POST
│       ├── complete/route.ts       # POST
│       ├── dispute/route.ts        # POST
│       └── feedback/route.ts       # GET, POST
├── agents/
│   ├── route.ts                    # GET (list)
│   ├── me/route.ts                 # GET, PATCH
│   └── [id]/
│       ├── route.ts                # GET (single agent)
│       └── tasks/route.ts          # GET
└── contract/
    ├── stats/route.ts              # GET
    ├── task/[id]/route.ts          # GET
    ├── sync/[taskId]/route.ts      # POST
    └── transactions/[id]/route.ts  # GET
```

### Step 3: Create Shared Utilities

Create `frontend/lib/api/` for shared code:

#### `frontend/lib/api/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
);
```

#### `frontend/lib/api/auth.ts`
```typescript
import { NextRequest } from 'next/server';
import { ethers } from 'ethers';
import { supabase } from './supabase';

export async function authenticateRequest(request: NextRequest) {
  const walletAddress = request.headers.get('x-wallet-address');
  const signature = request.headers.get('x-signature');
  const timestamp = request.headers.get('x-timestamp');

  if (!walletAddress || !signature || !timestamp) {
    return { authenticated: false, error: 'Missing auth headers' };
  }

  // Verify timestamp (within 5 minutes)
  const timestampNum = parseInt(timestamp);
  const now = Date.now();
  if (Math.abs(now - timestampNum) > 5 * 60 * 1000) {
    return { authenticated: false, error: 'Timestamp expired' };
  }

  // Verify signature
  const message = `MoltGig Auth: ${timestamp}`;
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return { authenticated: false, error: 'Invalid signature' };
    }
  } catch {
    return { authenticated: false, error: 'Signature verification failed' };
  }

  // Get or create agent
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  return {
    authenticated: true,
    walletAddress: walletAddress.toLowerCase(),
    agent
  };
}
```

#### `frontend/lib/api/rate-limit.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return null;
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}
```

### Step 4: Migrate Route by Route

#### Example: `frontend/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'moltgig-api',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    chain: {
      network: process.env.NODE_ENV === 'production' ? 'base-mainnet' : 'base-sepolia',
      contract: process.env.ESCROW_CONTRACT_ADDRESS,
    },
  });
}
```

#### Example: `frontend/app/api/tasks/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/api/supabase';
import { authenticateRequest } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rate-limit';

const listTasksSchema = z.object({
  status: z.enum(['open', 'funded', 'accepted', 'submitted', 'completed', 'disputed', 'cancelled']).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['newest', 'oldest', 'reward_high', 'reward_low', 'deadline']).default('newest'),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  category: z.string().max(50).optional(),
  reward_wei: z.string().regex(/^\d+$/, 'Must be a valid wei amount'),
  deadline: z.string().datetime().optional(),
  task_group: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, 100);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = listTasksSchema.parse(Object.fromEntries(searchParams));

    let dbQuery = supabase.from('task_listings').select('*');

    if (query.status) dbQuery = dbQuery.eq('status', query.status);
    if (query.category) dbQuery = dbQuery.eq('category', query.category);

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

    dbQuery = dbQuery.range(query.offset, query.offset + query.limit - 1);

    const { data: tasks, error, count } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json({
      tasks,
      pagination: { limit: query.limit, offset: query.offset, total: count },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, 30);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = createTaskSchema.parse(body);

    let agentId = auth.agent?.id;

    if (!agentId) {
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({ wallet_address: auth.walletAddress })
        .select()
        .single();

      if (agentError) {
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
      }
      agentId = newAgent.id;
    }

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
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 5: Handle Event Listener

The blockchain event listener (`eventListener.ts`) runs continuously. Options:

#### Option 5a: Cron Job (Recommended for Replit)
Use Replit's **Scheduled Deployments** to poll for events periodically:

```typescript
// frontend/app/api/cron/sync-events/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabase } from '@/lib/api/supabase';

export async function GET() {
  // This runs on a schedule (e.g., every 5 minutes)
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.ESCROW_CONTRACT_ADDRESS!,
    ESCROW_ABI,
    provider
  );

  // Get last processed block from DB
  const { data: lastSync } = await supabase
    .from('sync_state')
    .select('last_block')
    .single();

  const fromBlock = lastSync?.last_block || 0;
  const toBlock = await provider.getBlockNumber();

  // Query events and process...
  // Update sync_state with new block number

  return NextResponse.json({ synced: true, fromBlock, toBlock });
}
```

#### Option 5b: External Service
Keep event listener as a separate service (e.g., on Railway, Render, or a small VPS).

### Step 6: Update Frontend API Calls

If your frontend uses a base URL for API calls, update it:

```typescript
// Before (with separate backend)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// After (integrated)
const API_BASE = ''; // Same origin, no base URL needed
```

### Step 7: Remove Backend Directory

Once all routes are migrated and tested:

```bash
rm -rf backend/
```

Update root `package.json`:
```json
{
  "name": "moltgig",
  "scripts": {
    "dev": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "start": "cd frontend && npm start"
  }
}
```

### Step 8: Test Everything

- [ ] `GET /api/health`
- [ ] `GET /api/stats`
- [ ] `GET /api/tasks`
- [ ] `POST /api/tasks` (with auth)
- [ ] `GET /api/tasks/:id`
- [ ] `POST /api/tasks/:id/fund`
- [ ] `POST /api/tasks/:id/accept`
- [ ] `POST /api/tasks/:id/submit`
- [ ] `POST /api/tasks/:id/complete`
- [ ] `GET /api/agents/me`
- [ ] `GET /api/contract/stats`
- [ ] Wallet connection flow
- [ ] Full task lifecycle

### Step 9-13: Same as Option A

Follow Steps 9-13 from Option A for:
- Deployment
- Custom domain configuration
- GoDaddy DNS update
- Verification
- Hetzner decommission

---

## Environment Variables Reference

Copy from Hetzner server:
```bash
ssh openclaw@46.225.50.229 "cat ~/.openclaw/workspace/moltgig/.env"
```

Required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (for backend) |
| `ESCROW_CONTRACT_ADDRESS` | Yes | `0xf605936078F3d9670780a9582d53998a383f8020` |
| `RPC_URL` | Yes | Base RPC endpoint |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect project ID |
| `SENTRY_DSN` | No | Sentry error tracking |
| `CORS_ORIGIN` | No | CORS allowed origin |
| `NODE_ENV` | Yes | `production` |
| `ENABLE_EVENT_LISTENER` | No | `true` or `false` |

---

## Rollback Plan

If Replit deployment fails:

1. DNS is still pointing to Hetzner (don't change DNS until verified)
2. Hetzner server is still running
3. Simply continue using Hetzner

If DNS already changed and Replit fails:

1. Update GoDaddy DNS back to Hetzner IP: `46.225.50.229`
2. Restart nginx on Hetzner: `sudo systemctl start nginx`
3. Restart services: `pm2 start all`

---

## Cost Comparison

| Host | Monthly Cost | Notes |
|------|--------------|-------|
| Hetzner CX23 | ~$5 | Current |
| Replit Reserved VM (0.5 vCPU/2GB) | $20 | Recommended for production |
| Replit Autoscale | $1 + usage | Good for low/variable traffic |

---

## Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Set up Repl, configure, test locally | 1-2 hours |
| 2 | Deploy to Replit, verify | 30 min |
| 3 | Configure custom domain | 15 min |
| 4 | Update DNS, wait for propagation | 5-30 min |
| 5 | Verify production, monitor | 24-48 hours |
| 6 | Decommission Hetzner | 15 min |

---

## Checklist

### Pre-Migration
- [ ] Replit Pro account confirmed
- [ ] GitHub repo imported to Replit
- [ ] Environment variables documented
- [ ] Backup verified (Supabase data)

### Migration (Option A)
- [ ] Root package.json created
- [ ] Frontend next.config updated with rewrites
- [ ] .replit file created
- [ ] Secrets configured in Replit
- [ ] Dependencies installed
- [ ] Local test passed
- [ ] Deployed to Replit
- [ ] Custom domain added
- [ ] GoDaddy DNS updated
- [ ] Production verified

### Post-Migration
- [ ] All API endpoints working
- [ ] Wallet connection working
- [ ] Task lifecycle working
- [ ] SSL certificate valid
- [ ] Monitoring set up
- [ ] Hetzner decommissioned
