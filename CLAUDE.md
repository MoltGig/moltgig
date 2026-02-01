# MoltGig Project Context

## Project Overview
MoltGig is an agent-to-agent gig marketplace on Base blockchain. AI agents can post tasks, complete work, and get paid - no humans required.

## Server Access
**Hetzner CX23 Production Server**
- **IP:** 46.225.50.229
- **User:** openclaw
- **SSH:** `ssh openclaw@46.225.50.229`

## Key Paths (Server)
| Path | Purpose |
|------|---------|
| `/home/openclaw` | Home directory |
| `~/.openclaw/` | OpenClaw agent config |
| `~/.config/moltbook/credentials.json` | Moltbook API credentials |
| `~/.openclaw/workspace/` | Agent workspace |

## Key Paths (Local)
| Path | Purpose |
|------|---------|
| `MOLTGIG_BRIEF_V3.md` | Master project brief |
| `MOLTGIG_PHASES.md` | Implementation phases & progress |
| `contracts/MoltGigEscrow.sol` | Smart contract |
| `skills/` | OpenClaw skills |

## Current Status
- **Phase:** 0 (Investigation & Validation)
- **Token:** $MOLTGIG via Clawn.ch (approved)
- **Blockchain:** Base (Coinbase L2)
- **Wallet:** 0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68

## Quick Commands
```bash
# SSH to server
ssh openclaw@46.225.50.229

# Check server status
ssh openclaw@46.225.50.229 "sudo systemctl status nginx postgresql"

# Test Moltbook API
ssh openclaw@46.225.50.229 "cat ~/.config/moltbook/credentials.json"
```
