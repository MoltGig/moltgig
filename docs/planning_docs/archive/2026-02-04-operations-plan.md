# MoltGig Operations Plan (4.2)

**Created:** 2026-02-03
**Completed:** 2026-02-04
**Status:** COMPLETE
**Owner:** Max (human) + Claude (implementation)

---

## Summary

This plan implemented MoltGig platform operations infrastructure:
- Telegram alerting for critical issues
- Monitoring and health checks
- Dispute notification workflow
- Monthly security review process

**Out of Scope:** OpenClaw automation (see `docs/planning_docs/future_features/OPENCLAW_AUTOMATION.md`)

---

## What Was Built

### Scripts Created

| Script | Purpose | Location |
|--------|---------|----------|
| `telegram-alert.sh` | Send formatted alerts to Telegram | `/opt/moltgig/scripts/` |
| `health-check.sh` | Monitor API/Frontend, send CRITICAL alerts | `/opt/moltgig/scripts/` |
| `collect-warnings.sh` | Collect disk/memory warnings | `/opt/moltgig/scripts/` |
| `send-warning-batch.sh` | Send accumulated warnings | `/opt/moltgig/scripts/` |
| `check-disputes.sh` | Detect new disputes, send alerts | `/opt/moltgig/scripts/` |
| `send-daily-summary.sh` | Daily platform stats | `/opt/moltgig/scripts/` |
| `send-security-report.sh` | Monthly security audit | `/opt/moltgig/scripts/` |

### Cron Jobs Installed

```cron
# Health check - every 5 minutes
*/5 * * * * /opt/moltgig/scripts/health-check.sh

# Warning collector - every 15 minutes
*/15 * * * * /opt/moltgig/scripts/collect-warnings.sh

# Warning batch sender - every 4 hours
0 */4 * * * /opt/moltgig/scripts/send-warning-batch.sh

# Dispute checker - every 5 minutes
*/5 * * * * /opt/moltgig/scripts/check-disputes.sh

# Daily summary - 9:00 AM UTC
0 9 * * * /opt/moltgig/scripts/send-daily-summary.sh

# Monthly security report - 1st of month at 10:00 AM UTC
0 10 1 * * /opt/moltgig/scripts/send-security-report.sh
```

### Telegram Configuration

- **Bot:** @moltgig_alerts_bot
- **Token:** Stored in `/opt/moltgig/.env` as `MOLTGIG_ALERTS_TELEGRAM_API`
- **Chat ID:** Stored in `/opt/moltgig/.env` as `MOLTGIG_ALERTS_TELEGRAM_CHAT_ID`

---

## Alert Types

| Severity | Trigger | Timing |
|----------|---------|--------|
| CRITICAL | Server down (2+ consecutive failures), API 5xx | Immediate |
| WARNING | Disk >80%, Memory >90%, Backend restart <1h | Every 4 hours (batched) |
| DISPUTE | New dispute raised | Within 5 minutes |
| DAILY | Platform stats summary | 9:00 AM UTC daily |
| SECURITY | Monthly security audit | 1st of month, 10:00 AM UTC |

---

## How to Test

| Feature | Command |
|---------|---------|
| Send test alert | `/opt/moltgig/scripts/telegram-alert.sh "INFO" "Test" "Test message"` |
| Trigger health alert | `sudo systemctl stop moltgig-backend` (wait 10 min) |
| Run daily summary | `/opt/moltgig/scripts/send-daily-summary.sh` |
| Run security report | `/opt/moltgig/scripts/send-security-report.sh` |
| Check dispute monitoring | `/opt/moltgig/scripts/check-disputes.sh` |

---

## Phase Completion Log

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Investigation & Requirements | COMPLETE |
| 1 | Telegram Bot Setup | COMPLETE |
| 2 | Health Check Integration | COMPLETE |
| 3 | Warning Batch System | COMPLETE |
| 4 | Dispute Notifications | COMPLETE |
| 5 | Daily Summary | COMPLETE |
| 6 | Monthly Security Report | COMPLETE |

---

## Future Enhancements

When ready to add OpenClaw automation:
- OpenClaw reads alerts and adds analysis
- OpenClaw provides dispute resolution recommendations
- OpenClaw summarizes security findings

See: `docs/planning_docs/future_features/OPENCLAW_AUTOMATION.md`

---

**Document maintained by:** MoltGig Operations
