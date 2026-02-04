# Replit Migration Issues

**Created:** 2026-02-04
**Status:** ✅ COMPLETE

---

## Overview

Migrating MoltGig from Hetzner VPS to Replit. Two issues to resolve:
1. Replit API returning "Internal Server Error"
2. Server cleanup (delete MoltGig files, keep OpenClaw)

---

## Issue 1: Replit API Error

### Current State
- **Homepage:** ✅ Working (HTTP 200)
- **API endpoints:** ❌ All returning "Internal Server Error"
  - `/api/health`
  - `/api/tasks`
  - `/api/stats`

### Diagnosis Needed
Check Replit deployment logs for the actual error message.

### Potential Causes
1. **Environment variables** - Missing or misconfigured secrets
2. **Supabase connection** - Invalid key format or connection issue
3. **Build/runtime error** - Code issue during startup

### Replit Secrets Configured
```
SESSION_SECRET
MOLTGIG_ETHERSCAN_API_KEY
MOLTGIG_ALCHEMY_API_KEY
MOLTGIG_RAINBOW_WALLET_PRIVATE_KEY
SUPABASE_PROJECT_URL
SUPABASE_PUBLISHABLE_API_KEY          ← Updated to JWT format
MOLTGIG_TREASURY_WALLET_ADDRESS
MOLTGIG_OPERATIONS_WALLET_ADDRESS
MOLTGIG_OPERATIONS_WALLET_PRIVATE_KEY
MOLTGIG_ALERTS_TELEGRAM_API
MOLTGIG_ALERTS_TELEGRAM_CHAT_ID
```

### Code Fixes Applied
- ✅ Changed RPC fallback from `base-sepolia` to `base-mainnet` in:
  - `backend/src/services/eventListener.ts`
  - `backend/src/services/contract.ts`
- ✅ Merged PR #2 to main

### Next Steps
- [ ] Check Replit deployment logs for actual error
- [ ] Verify all required env vars are set
- [ ] Redeploy after fixing

---

## Issue 2: Server Cleanup

### Context
MoltGig was previously hosted on Hetzner VPS (46.225.50.229). After codebase separation (Phase 4.1), MoltGig lives at `/opt/moltgig/` while OpenClaw agent system lives at `~/.openclaw/`.

Now that MoltGig is on Replit, we need to clean up the server.

### Server Structure

| Location | What | Action |
|----------|------|--------|
| `/opt/moltgig/` | Main MoltGig app (separated) | **DELETE** |
| `~/.openclaw/workspace/moltgig/` | Old stale copy | **DELETE** |
| `~/.openclaw/` | OpenClaw agent system | **KEEP** |
| `/var/www/moltgig/` | A2A static files | **DELETE** |
| `/etc/nginx/sites-enabled/moltgig.com` | nginx config | **DELETE** |

### MoltGig Files to DELETE

```
/opt/moltgig/                              ← Main MoltGig app
~/.openclaw/workspace/moltgig/             ← Old stale copy
/var/www/moltgig/                          ← Static A2A files
/etc/nginx/sites-enabled/moltgig.com       ← nginx config
~/.openclaw/workspace/MOLTGIG_BRIEF_V3.md  ← Reference doc
~/.openclaw/workspace/MOLTGIG_PHASES.md    ← Reference doc
~/.openclaw/workspace/moltgig-homepage.png ← Screenshot
~/.moltgig.env                             ← Old env file
```

### OpenClaw Files to KEEP

```
~/.openclaw/                               ← All of it (agents, config, credentials, skills)
~/.openclaw/workspace/                     ← Keep (except moltgig subdirectory and moltgig docs)
  ├── SOUL.md, USER.md, AGENTS.md, etc.   ← OpenClaw agent files
  └── skills/                              ← OpenClaw skills
```

### Cleanup Commands

**1. Stop MoltGig Services**
```bash
sudo systemctl stop moltgig-backend
sudo systemctl disable moltgig-backend
sudo rm /etc/systemd/system/moltgig-backend.service
sudo systemctl daemon-reload
```

**2. Disable nginx MoltGig Site**
```bash
sudo rm /etc/nginx/sites-enabled/moltgig.com
sudo nginx -t && sudo systemctl reload nginx
```

**3. Delete MoltGig Directories**
```bash
sudo rm -rf /opt/moltgig/
sudo rm -rf /var/www/moltgig/
rm -rf ~/.openclaw/workspace/moltgig/
```

**4. Delete MoltGig Files from OpenClaw Workspace**
```bash
rm ~/.openclaw/workspace/MOLTGIG_BRIEF_V3.md
rm ~/.openclaw/workspace/MOLTGIG_PHASES.md
rm ~/.openclaw/workspace/moltgig-homepage.png
rm ~/.moltgig.env
```

**5. Clean Up SSL Cert (Optional)**
```bash
sudo certbot delete --cert-name moltgig.com
```

### Pre-Cleanup Checklist
- [ ] Replit deployment working (API responding)
- [ ] moltgig.com DNS pointing to Replit
- [ ] All functionality verified on Replit

---

## Resolution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-04 | Fixed RPC fallback (sepolia → mainnet) | PR #2 merged |
| 2026-02-04 | Updated SUPABASE_PUBLISHABLE_API_KEY to JWT | ✅ Fixed |
| 2026-02-04 | Fixed Replit Autoscale port conflict | ✅ PR merged |
| 2026-02-04 | Replit deployment working | ✅ All endpoints responding |
| 2026-02-04 | Hetzner server cleanup | ✅ Complete |

---

## Cleanup Completed

**Deleted from Hetzner server:**
- `/opt/moltgig/` - Main MoltGig app
- `/var/www/moltgig/` - Static A2A files
- `~/.openclaw/workspace/moltgig/` - Old stale copy
- `/etc/nginx/sites-enabled/moltgig.com` - nginx config
- `/etc/systemd/system/moltgig-backend.service` - Systemd service
- `~/.openclaw/workspace/MOLTGIG_*.md` - Reference docs
- SSL certificate for moltgig.com

**Kept on Hetzner server:**
- `~/.openclaw/` - OpenClaw agent system (intact)
- Backup: `~/moltgig-env-backup-20260204.txt`

---

## Final State

| Component | Location | Status |
|-----------|----------|--------|
| MoltGig App | Replit | ✅ Live |
| MoltGig Code | GitHub | ✅ Synced |
| Database | Supabase | ✅ Unchanged |
| OpenClaw | Hetzner | ✅ Intact |
| Domain | moltgig.com → Replit | ✅ Working |
