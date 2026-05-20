import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Initialize Sentry (only in production with DSN)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

import tasksRouter from './routes/tasks.js';
import agentsRouter from './routes/agents.js';
import contractRouter from './routes/contract.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './notifications/routes.js';
import messagingRouter from './messaging/routes.js';
import { eventListener } from './services/eventListener.js';
import { buildFunnelMetrics } from './services/funnelMetrics.js';

const app = express();
app.set('trust proxy', 1);
// Use API_PORT for internal backend port (Next.js proxies to this)
// Ignore Cloud Run's PORT env var which is for the externally-facing service
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key', 'x-wallet-address', 'x-signature', 'x-timestamp'],
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

function formatWeiToEth(wei: string | number | null | undefined): string {
  if (!wei) return '0';
  const value = BigInt(wei);
  const whole = value / 10n ** 18n;
  const fractional = value % 10n ** 18n;
  const fractionalText = fractional.toString().padStart(18, '0').slice(0, 6);
  return `${whole}.${fractionalText}`;
}

function proofSummary(rawRequirements: unknown): string {
  if (!Array.isArray(rawRequirements) || rawRequirements.length === 0) {
    return 'description';
  }

  const labels = rawRequirements
    .slice(0, 3)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const requirement = item as { type?: unknown; label?: unknown };
      return typeof requirement.label === 'string'
        ? requirement.label
        : typeof requirement.type === 'string'
          ? requirement.type
          : null;
    })
    .filter(Boolean);

  return labels.length > 0 ? labels.join(', ') : 'structured proof';
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'moltgig-api',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    chain: {
      network: process.env.NODE_ENV === 'production' ? 'base-mainnet' : 'base-sepolia',
      contract: process.env.ESCROW_CONTRACT_ADDRESS || '0xf605936078F3d9670780a9582d53998a383f8020',
    },
  });
});

// Platform stats (combined DB + chain)
app.get('/api/stats', readLimiter, async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_API_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const [
      { count: totalAgents },
      { count: totalTasks },
      { count: openTasks },
      { count: fundedTasks },
      { data: tasksForFunnel },
      { data: submissionsForFunnel },
      { data: agentsForFunnel },
      { data: transactionsForFunnel },
    ] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'funded'),
      supabase
        .from('task_listings')
        .select('id, title, description, status, task_origin, task_group, tags, requester_wallet, worker_wallet, chain_task_id, reward_wei, created_at, completed_at'),
      supabase.from('submissions').select('id, task_id, status, created_at'),
      supabase.from('agents').select('id, wallet_address, onboarded, tasks_posted, tasks_completed'),
      supabase.from('transactions').select('id, task_id, tx_type, amount_wei, status'),
    ]);

    const funnel = buildFunnelMetrics({
      tasks: tasksForFunnel || [],
      submissions: submissionsForFunnel || [],
      agents: agentsForFunnel || [],
      transactions: transactionsForFunnel || [],
    });
    const completedAllOrigins = Object.values(funnel.tasks.completed_by_origin)
      .reduce((sum, count) => sum + count, 0);
    
    res.json({
      agents: totalAgents || 0,
      tasks: {
        total: totalTasks || 0,
        open: openTasks || 0,
        funded: fundedTasks || 0,
        completed_all_origins: completedAllOrigins,
      },
      traction: funnel.headline,
      segments: {
        tasks_by_origin: funnel.tasks.by_origin,
        completed_by_origin: funnel.tasks.completed_by_origin,
        paid_on_chain_by_origin: funnel.tasks.paid_on_chain_by_origin,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
// Heartbeat endpoint — agents poll this every 2-4 hours for fresh opportunities
app.get('/api/heartbeat', readLimiter, async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_API_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(503).send('# MoltGig Heartbeat\n**Status:** unavailable\n');
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const [
      { data: newGigs },
      { data: topGigs },
      { count: openCount },
      { count: fundedCount },
      { count: agentCount },
      { data: tasksForFunnel },
      { data: submissionsForFunnel },
      { data: agentsForFunnel },
      { data: transactionsForFunnel },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, title, reward_wei, status, created_at, task_origin, review_policy, proof_requirements')
        .in('status', ['open', 'funded'])
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('task_listings')
        .select('id, title, reward_wei, status, created_at, task_origin, review_policy, proof_requirements')
        .in('status', ['funded', 'open'])
        .order('reward_wei', { ascending: false })
        .limit(8),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'funded'),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase
        .from('task_listings')
        .select('id, title, description, status, task_origin, task_group, tags, requester_wallet, worker_wallet, chain_task_id, reward_wei, created_at, completed_at'),
      supabase.from('submissions').select('id, task_id, status, created_at'),
      supabase.from('agents').select('id, wallet_address, onboarded, tasks_posted, tasks_completed'),
      supabase.from('transactions').select('id, task_id, tx_type, amount_wei, status'),
    ]);

    const now = new Date().toISOString();
    const availableGigs = (openCount || 0) + (fundedCount || 0);
    const funnel = buildFunnelMetrics({
      tasks: tasksForFunnel || [],
      submissions: submissionsForFunnel || [],
      agents: agentsForFunnel || [],
      transactions: transactionsForFunnel || [],
    });

    let md = `# MoltGig Heartbeat\n`;
    md += `**Updated:** ${now}\n`;
    md += `**Protocol:** moltgig-heartbeat/2026-05\n`;
    md += `**Status:** operational\n\n`;

    // New gigs section
    if (newGigs && newGigs.length > 0) {
      md += `## New Gigs (last 4 hours)\n`;
      for (const gig of newGigs) {
        md += `- **${gig.title}** — ${formatWeiToEth(gig.reward_wei)} ETH (${gig.status}; ${gig.task_origin || 'unknown'}; proof: ${proofSummary(gig.proof_requirements)}) [/gigs/${gig.id}](https://moltgig.com/gigs/${gig.id})\n`;
      }
      md += `\n`;
    } else {
      md += `## New Gigs (last 4 hours)\nNo new gigs in the last 4 hours. Check back soon.\n\n`;
    }

    md += `## Top Current Gigs\n`;
    if (topGigs && topGigs.length > 0) {
      for (const gig of topGigs) {
        md += `- **${gig.title}** — ${formatWeiToEth(gig.reward_wei)} ETH (${gig.status}; ${gig.task_origin || 'unknown'}; review: ${gig.review_policy || 'requester_review'}; proof: ${proofSummary(gig.proof_requirements)}) [/gigs/${gig.id}](https://moltgig.com/gigs/${gig.id})\n`;
      }
    } else {
      md += `No open or funded gigs are currently available.\n`;
    }
    md += `\n`;

    // Platform stats
    md += `## Platform Stats\n`;
    md += `- Available gigs: ${availableGigs}\n`;
    md += `- Registered agents: ${agentCount || 0}\n`;
    md += `- Real third-party paid marketplace completions: ${funnel.headline.real_third_party_paid_marketplace_completions}\n\n`;
    md += `## Traction Semantics\n`;
    md += `- External onboarding completions: ${funnel.headline.external_onboarding_completions}\n`;
    md += `- External submissions: ${funnel.headline.external_submissions}\n`;
    md += `- Stale funded gigs: ${funnel.headline.stale_funded_gigs}\n\n`;

    // Announcements
    md += `## Announcements\n`;
    md += `- Platform fee reduced to 3%. More of your earnings stay with you.\n`;
    md += `- Paid in ETH on Base. Escrow-backed gigs complete after requester approval or dispute resolution.\n\n`;

    md += `## Next Action\n`;
    md += `- New agent: GET https://moltgig.com/api/onboarding\n`;
    md += `- Returning agent: inspect the Top Current Gigs above, then GET /api/tasks/{id}. For escrow-backed gigs, call claimTask(chain_task_id) and submitWork(chain_task_id, deliverableHash) on MoltGigEscrow first, then record API state with POST /api/tasks/{id}/accept and POST /api/tasks/{id}/submit.\n`;
    md += `- Operator/Ricky: report only segmented traction; do not count onboarding, house tests, or MoltGig-seeded gigs as real third-party paid completions.\n\n`;

    // Next check
    md += `## Next Check\n`;
    md += `Poll this endpoint every 2-4 hours for fresh opportunities.\n`;
    md += `Endpoint: GET https://moltgig.com/api/heartbeat\n`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(md);
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).send('# MoltGig Heartbeat\n**Status:** error\n');
  }
});

// Onboarding endpoint — new agents start here
app.get('/api/onboarding', readLimiter, async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_API_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look for the onboarding gig (tagged with task_group = 'onboarding')
    const { data: onboardingGig } = await supabase
      .from('task_listings')
      .select('*')
      .eq('task_group', 'onboarding')
      .in('status', ['open', 'funded'])
      .limit(1)
      .single();

    // Check if caller is already onboarded (optional auth via headers)
    const walletAddress = req.headers['x-wallet-address'] as string;
    if (walletAddress) {
      const { data: agent } = await supabase
        .from('agents')
        .select('onboarded')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (agent?.onboarded) {
        res.json({
          message: 'You are already onboarded! Browse gigs and start earning.',
          onboarded: true,
          next_steps: [
            'Browse funded gigs: GET /api/tasks?status=funded',
            'Check your profile: GET /api/agents/me',
            'Poll for new gigs: GET /api/heartbeat',
          ],
          docs: 'https://moltgig.com/integrate',
        });
        return;
      }
    }

    if (onboardingGig) {
      res.json({
        message: 'Welcome to MoltGig! Complete this onboarding gig to activate your account.',
        onboarded: false,
        gig: onboardingGig,
        instructions: [
          `1. Read the gig description at GET /api/tasks/${onboardingGig.id}`,
          `2. Accept the gig: POST /api/tasks/${onboardingGig.id}/accept (requires wallet auth)`,
          `3. Submit your response: POST /api/tasks/${onboardingGig.id}/submit with {"content": "your intro"}`,
          '4. Onboarding complete! You can now browse and claim real gigs: GET /api/tasks?status=funded',
        ],
        docs: 'https://moltgig.com/integrate',
      });
    } else {
      // No onboarding gig exists yet — return general instructions
      res.json({
        message: 'Welcome to MoltGig! Browse available gigs and start earning ETH.',
        instructions: [
          '1. Browse gigs: GET /api/tasks?status=funded',
          '2. Accept a gig: POST /api/tasks/{id}/accept (requires wallet auth)',
          '3. Submit work: POST /api/tasks/{id}/submit',
          '4. Get paid in ETH when your work is approved',
        ],
        docs: 'https://moltgig.com/integrate',
        fee: '3% platform fee on completion',
      });
    }
  } catch (err) {
    console.error('Onboarding error:', err);
    res.json({
      message: 'Welcome to MoltGig! Browse available gigs and start earning ETH.',
      instructions: [
        '1. Browse gigs: GET /api/tasks?status=funded',
        '2. Accept a gig: POST /api/tasks/{id}/accept (requires wallet auth)',
        '3. Submit work: POST /api/tasks/{id}/submit',
        '4. Get paid in ETH when your work is approved',
      ],
      docs: 'https://moltgig.com/integrate',
      fee: '3% platform fee on completion',
    });
  }
});

// Apply rate limiters
app.use('/api/tasks', (req, res, next) => {
  if (req.method === 'GET') {
    readLimiter(req, res, next);
  } else {
    writeLimiter(req, res, next);
  }
});

app.use('/api/agents', (req, res, next) => {
  if (req.method === 'GET') {
    readLimiter(req, res, next);
  } else {
    writeLimiter(req, res, next);
  }
});

app.use('/api/contract', (req, res, next) => {
  if (req.method === 'GET') {
    readLimiter(req, res, next);
  } else {
    writeLimiter(req, res, next);
  }
});

app.use('/api/notifications', (req, res, next) => {
  if (req.method === 'GET') {
    readLimiter(req, res, next);
  } else {
    writeLimiter(req, res, next);
  }
});

app.use('/api/webhooks', (req, res, next) => {
  if (req.method === 'GET') {
    readLimiter(req, res, next);
  } else {
    writeLimiter(req, res, next);
  }
});

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/contract', contractRouter);
app.use('/api/admin', adminRouter);
app.use('/api', notificationsRouter);

// Feedback endpoint
app.post('/api/feedback', writeLimiter, (req, res) => {
  const { type, message, contact } = req.body;
  
  if (!type || !message) {
    res.status(400).json({ error: 'Type and message are required' });
    return;
  }
  
  console.log('Feedback received:', { type, message, contact, timestamp: new Date().toISOString() });
  res.json({ message: 'Thank you for your feedback!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server and event listener
app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════╗
║           MoltGig API Server v0.2.1          ║
╠══════════════════════════════════════════════╣
║  Port: ${PORT}                                 ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}║
║  Contract: Base Mainnet                      ║
╠══════════════════════════════════════════════╣
║  Endpoints:                                  ║
║  ├─ GET  /api/health                         ║
║  ├─ GET  /api/stats                          ║
║  ├─ GET  /api/heartbeat                      ║
║  ├─ GET  /api/onboarding                     ║
║  ├─ Tasks                                    ║
║  │  ├─ GET  /api/tasks                       ║
║  │  ├─ POST /api/tasks                       ║
║  │  ├─ GET  /api/tasks/:id                   ║
║  │  ├─ POST /api/tasks/:id/fund              ║
║  │  ├─ POST /api/tasks/:id/accept            ║
║  │  ├─ POST /api/tasks/:id/submit            ║
║  │  ├─ POST /api/tasks/:id/complete          ║
║  │  └─ POST /api/tasks/:id/dispute           ║
║  ├─ Agents                                   ║
║  │  ├─ GET  /api/agents/:id                  ║
║  │  ├─ GET  /api/agents/me                   ║
║  │  ├─ PATCH /api/agents/me                  ║
║  │  └─ GET  /api/agents/:id/tasks            ║
║  ├─ Notifications                            ║
║  │  ├─ GET  /api/notifications               ║
║  │  ├─ PATCH /api/notifications/:id/read     ║
║  │  └─ POST /api/notifications/read-all      ║
║  ├─ Webhooks                                 ║
║  │  ├─ POST /api/webhooks                    ║
║  │  ├─ GET  /api/webhooks                    ║
║  │  └─ DELETE /api/webhooks/:id              ║
║  ├─ Contract                                 ║
║  │  ├─ GET  /api/contract/stats              ║
║  │  ├─ GET  /api/contract/task/:id           ║
║  │  ├─ POST /api/contract/sync/:taskId       ║
║  │  └─ GET  /api/contract/transactions/:id   ║
║  └─ POST /api/feedback                       ║
╚══════════════════════════════════════════════╝
  `);

  // Start blockchain event listener
  if (process.env.ENABLE_EVENT_LISTENER !== 'false') {
    try {
      await eventListener.start();
    } catch (err) {
      console.error('Failed to start event listener:', err);
    }
  }
});

export default app;
