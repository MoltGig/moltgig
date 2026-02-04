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
