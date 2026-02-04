# Sentry Error Monitoring

**Status:** Deferred
**Priority:** Low
**Effort:** 15 minutes to activate

## Overview

Sentry captures production errors automatically so you can see and fix bugs before users report them.

## Why Deferred

- Free tier limits (5k errors/month) may be insufficient at scale
- Current traffic is low enough to debug manually
- Can activate anytime - code is already in place

## Current State

The integration code is already added to both backend and frontend:
- `backend/src/index.ts` - Sentry SDK imported, conditionally initializes if DSN present
- `frontend/sentry.client.config.ts` - Client-side error capture
- `frontend/sentry.server.config.ts` - Server-side error capture
- `frontend/sentry.edge.config.ts` - Edge runtime error capture
- `frontend/next.config.ts` - Wrapped with withSentryConfig (only if DSN set)

## To Activate

1. Create account at https://sentry.io
2. Create two projects: "moltgig-backend" (Node.js) and "moltgig-frontend" (Next.js)
3. Get DSN for each project
4. Add to `~/.openclaw/workspace/moltgig/.env`:
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```
5. Restart services:
   ```bash
   sudo systemctl restart moltgig-backend
   # Restart frontend (via screen or pm2)
   ```

## What Gets Captured

- Uncaught exceptions
- Unhandled promise rejections
- API errors (500s)
- Frontend crashes
- Stack traces with source maps

## Cost

- Free tier: 5,000 errors/month
- Team tier: $26/month for 50k errors
- Business tier: $80/month for 100k errors

## Alternatives

- **Betterstack Logs** - $0/month for 1GB logs
- **Self-hosted Sentry** - Free but requires maintenance
- **LogRocket** - Session replay + errors (more expensive)
