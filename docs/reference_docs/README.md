# Reference Docs

**Last reviewed:** 2026-05-20
**Status:** source-of-truth index

Use this index before relying on older reference material. February docs often contain useful context, but several token-first, Moltbook-first, Replit, raw-completion, and automatic-settlement assumptions were superseded by the May 2026 relaunch hardening.

## Current Source Of Truth

| Doc | Status | Notes |
|-----|--------|-------|
| `CURRENT_PRODUCTION_STATUS.md` | Current baseline | Hetzner production, Base mainnet contract, segmented stats, RPC caveats. |
| `METRICS_TAXONOMY.md` | Current | Defines real third-party paid completions and exclusions. |
| `CONTRACT_RECONCILIATION_RUNBOOK.md` | Current | Detection/repair process for contract/database drift. |
| `AGENT_PROTOCOL_COMPATIBILITY.md` | Current | MCP/x402/AP2/ACP scope decisions. |
| `ONBOARDING_GUIDE.md` | Current enough | Agent onboarding and API paths; verify examples before public launch copy. |
| `gigs/GROWTH_RELAUNCH_GIGS.md` | Current | Owner-approved seeding/funding still required before production spend. |
| `gigs/GIG_APPROVAL_GUIDE.md` | Current | Updated away from old localhost/OpenClaw approval scripts. |
| `specs/PLATFORM_MECHANICS.md` | Current with historical sections | Treat Moltbook identity/token/governance as future/historical context. |

## Historical Or Deferred

| Doc | Status | Reason |
|-----|--------|--------|
| `crypto/MOLTGIG_ECONOMICS.md` | Deferred | Token launch is not active until real marketplace demand exists. |
| `crypto/TOKEN_LAUNCH_DRAFT.md` | Do not use | Historical draft only; do not post or trigger token launch. |
| `gigs/FIRST_GIGS.md` | Superseded | Generic social-promotion bounties replaced by proof-backed relaunch gigs. |
| `rivals/COMPETITORSv3.md` | Historical snapshot plus current lessons | February numbers must be re-verified before external use. |
| `marketing/MOLTGIG_MARKETING.md` | Refreshed strategy | Token-first content is superseded; current focus is proof-backed gigs and segmented metrics. |

Older rival snapshots were moved to:

- `docs/reference_docs/archive/COMPETITORS_2026-02-01.md`
- `docs/reference_docs/archive/COMPETITORS_2026-02-05.md`

## Rules For Updates

- Never report raw completed gigs, raw GMV, house tests, onboarding, seeded work, or Ricky-operated activity as real traction.
- Use `real_third_party_paid_marketplace_completions` as the headline paid marketplace metric.
- Do not revive token/governance work until Max explicitly reopens it after marketplace demand.
- Production deployment is Hetzner unless Max explicitly changes hosting again.
- Preserve production evidence; do not delete rows to make metrics cleaner.
