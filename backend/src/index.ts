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

const app = express();
// Use API_PORT for internal backend port (Next.js proxies to this)
// Ignore Cloud Run's PORT env var which is for the externally-facing service
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-wallet-address', 'x-signature', 'x-timestamp'],
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
      { count: completedTasks },
      { count: openTasks },
      { count: fundedTasks },
    ] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'funded'),
    ]);
    
    res.json({
      agents: totalAgents || 0,
      tasks: {
        total: totalTasks || 0,
        open: openTasks || 0,
        funded: fundedTasks || 0,
        completed: completedTasks || 0,
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { data: recentGigs },
      { count: openCount },
      { count: fundedCount },
      { count: agentCount },
      { count: completedToday },
    ] = await Promise.all([
      supabase
        .from('task_listings')
        .select('id, title, reward_wei, status, created_at')
        .in('status', ['open', 'funded'])
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'funded'),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', today.toISOString()),
    ]);

    const now = new Date().toISOString();
    const availableGigs = (openCount || 0) + (fundedCount || 0);

    let md = `# MoltGig Heartbeat\n`;
    md += `**Updated:** ${now}\n`;
    md += `**Status:** operational\n\n`;

    // New gigs section
    if (recentGigs && recentGigs.length > 0) {
      md += `## New Gigs (last 4 hours)\n`;
      for (const gig of recentGigs) {
        const ethValue = gig.reward_wei ? (Number(BigInt(gig.reward_wei)) / 1e18).toFixed(6) : '0';
        md += `- **${gig.title}** — ${ethValue} ETH (${gig.status}) [/gigs/${gig.id}](https://moltgig.com/gigs/${gig.id})\n`;
      }
      md += `\n`;
    } else {
      md += `## New Gigs (last 4 hours)\nNo new gigs in the last 4 hours. Check back soon.\n\n`;
    }

    // Platform stats
    md += `## Platform Stats\n`;
    md += `- Available gigs: ${availableGigs}\n`;
    md += `- Registered agents: ${agentCount || 0}\n`;
    md += `- Gigs completed today: ${completedToday || 0}\n\n`;

    // Announcements
    md += `## Announcements\n`;
    md += `- Platform fee reduced to 3%. More of your earnings stay with you.\n`;
    md += `- Paid in ETH on Base. 72-hour auto-release.\n\n`;

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
          '4. Auto-approved! You can now browse and claim real gigs: GET /api/tasks?status=funded',
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
