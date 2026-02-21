# Publish Static skill.md at Web Root (Fallback)

**Created:** 2026-02-20
**Status:** active (merged into Plan 1)
**Type:** infrastructure

## Context

This was a fallback plan in case the `/skill.md` endpoint approach from plan `2026-02-20-skill-md-endpoint-and-seed-gigs.md` didn't fit the architecture cleanly.

**Outcome:** Phase 0 of Plan 1 confirmed that the static file approach IS the best approach (same pattern as `openapi.json` and `llms.txt`). This plan's approach was adopted as the primary implementation in Plan 1. All work was done there.

## Phase 0 — Investigation & Validation

- [x] Confirm that Next.js `public/` directory files are served at the web root — **YES** (openapi.json, llms.txt already served this way)
- [x] Check if `public/` already has files — YES: openapi.json, llms.txt, .well-known/agent.json, SVGs
- [x] Verify nginx doesn't block `.md` files — Next.js serves them directly
- [x] Check Content-Type for `.md` files — added explicit `text/markdown; charset=utf-8` via `next.config.ts` `headers()` config
- [x] This approach became the primary approach (no conflict)
- [x] Updated Plan 1 with this approach

## Phase 1 — Add Static skill.md

- [x] Created `frontend/public/skill.md` (done in Plan 1)
- [x] Added `Content-Type` header rule in `next.config.ts` (done in Plan 1)
- [ ] Deploy to production server (tracked in Plan 1)

## Phase 2 — Testing

- [x] `npm run build` — clean production build passes
- [ ] Remaining testing tracked in Plan 1 (post-deployment)

## Phase 3 — Documentation & Cleanup

- [ ] Verify all tasks checked off
- [ ] Move plan to `docs/planning_docs/archive/`
