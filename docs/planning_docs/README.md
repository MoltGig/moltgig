# Plans

This directory contains all project plans for MoltGig. Every plan follows a consistent structure to ensure thorough investigation, clear execution, and proper documentation.

## Directory Structure

```
docs/planning_docs/
  active/          Plans currently being worked on
  standby/         Plans paused (waiting for results, blocked, or deprioritized)
  archive/         Completed plans
  future_features/ Ideas and proposals not yet planned
```

## Naming Convention

All plan files use **lowercase** with a **date prefix**:

```
YYYY-MM-DD-short-description.md
```

Examples:
- `2026-02-20-carbon-g4-full-redesign.md`
- `2026-03-01-fix-escrow-timeout-bug.md`

## Plan Template

Every plan must follow this structure:

```markdown
# [Plan Title]

**Created:** YYYY-MM-DD
**Status:** active | standby | archived
**Type:** feature | bugfix | refactor | infrastructure

## Context

Brief description of the problem, feature, or change. Why does this plan exist?
What is the expected outcome?

## Phase 0 — Investigation & Validation

- [ ] Task 1
- [ ] Task 2
- [ ] ...
- [ ] Update subsequent phases with findings

## Phase 1 — [Description]

- [ ] Task 1
- [ ] Task 2
- [ ] ...

## Phase N-1 — Testing

- [ ] Run all tests created during this plan
- [ ] Verify no regressions
- [ ] ...

## Phase N — Documentation & Cleanup

- [ ] Update docs/reference_docs/ if affected
- [ ] Verify all tasks checked off
- [ ] Move plan to docs/planning_docs/archive/
```

## Phase Rules

### Phase 0 — Investigation & Validation

Phase 0 is **always** the first phase. No code is written. Its purpose is to deeply understand the problem space and validate every assumption before implementation begins. Phase 0 must:

1. **Investigate extensively.** Read every relevant file, table, component, route, and action. Don't skim — trace the full data flow. Understand what exists before proposing what to change.

2. **Test assumptions.** If the plan assumes "column X exists" or "component Y accepts prop Z" — verify it. If the plan assumes a certain user flow — trace it through the actual code. Never take anything for granted.

3. **Check for duplication.** Before proposing new files, components, tables, columns, utilities, or types — confirm that equivalent functionality doesn't already exist in the codebase. Reuse first, create only when necessary.

4. **Audit subsequent phases.** Read through Phase 1+ with a critical eye:
   - Are there gaps? Steps that say "handle edge cases" without specifying which?
   - Are there vague instructions? "Update the form" — which form, which fields, what changes?
   - Are hard problems brushed over? Complex state management, race conditions, error handling?
   - Are dependencies between phases clear? Does Phase 3 assume something Phase 2 produces?

5. **Decide on test strategy.** Determine whether tests should be written upfront (test-driven) or alongside implementation. For bug fixes, writing a failing test first is usually the right call. For new features, it depends on complexity. Document the decision.

6. **Surface blockers.** If Phase 0 reveals major issues — architectural problems, missing infrastructure, conflicting requirements — **stop and raise them** before proceeding. Don't paper over fundamental problems.

7. **Update the plan.** After investigation, rewrite Phases 1+ with concrete details: specific file paths, exact SQL, actual component props, real function signatures. The plan should be precise enough that implementation is mostly mechanical.

### Phase 1+ — Implementation

These are the action phases. Rules:

- **Check off tasks as they're completed.** Each `- [ ]` becomes `- [x]` when done.
- **One phase at a time.** Complete and verify a phase before moving to the next.
- **Run relevant tests at the end of each phase** where it makes sense (e.g., after modifying database schema, after changing API routes, after updating UI components).
- **If a phase reveals new work**, add tasks to the current or a future phase rather than doing undocumented work.

### Penultimate Phase — Testing

The second-to-last phase is **always** a dedicated testing phase:

- `npm run build` — clean production build (from `frontend/`)
- Manual smoke test: navigate every page, check for visual regressions
- Verify responsive behavior at mobile (375px) and tablet (768px) viewports
- If new pure function created: add co-located `*.test.ts`
- Verify no regressions in existing functionality
- Test edge cases and error paths identified in Phase 0
- If tests fail, fix the issues before proceeding (do not skip)

### Final Phase — Documentation & Cleanup

The last phase is **always** about wrapping up:

- [ ] Ensure all tasks across all phases are checked off
- [ ] Update any affected docs in `docs/reference_docs/`
- [ ] Remove any temporary files, debug logging, or scaffolding created during the plan
- [ ] Move the plan file from `docs/planning_docs/active/` to `docs/planning_docs/archive/`

## Plan Lifecycle

```
active/     You're working on it right now
    |
    |--- (paused/blocked) ---> standby/
    |                              |
    |<-- (resumed) ---------------|
    |
    v
archive/    All phases complete, docs updated
```

- **Active → Standby:** When work is paused — waiting for external results, blocked by another task, or temporarily deprioritized. The plan retains its state (checked/unchecked tasks) and can be resumed at any time.
- **Standby → Active:** When work resumes. Review Phase 0 findings first in case anything has changed.
- **Active → Archive:** When every task in every phase is checked off and the final documentation phase is complete.

## Tips

- **Keep plans focused.** One plan = one feature, one bug fix, or one refactor. If scope creeps, split into a separate plan.
- **Be concrete.** "Update the profile page" is bad. "Restyle `frontend/src/app/leaderboard/page.tsx` to use G4 design tokens: `--bg: #09090B`, `--surface: #111113`, centered layout, `max-width: 1080px`" is good.
- **Link to files.** Reference specific paths (`frontend/src/components/ui/Button.tsx:23`) so future readers (including AI) can find the relevant code quickly.
- **Record decisions.** When Phase 0 reveals multiple approaches, document why one was chosen over others. This prevents relitigating decisions later.
- **Don't delete standby plans.** They contain valuable investigation work. Even if deprioritized indefinitely, they serve as documentation of what was explored.

## MoltGig-Specific Notes

- **Tech stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Supabase + Base blockchain
- **Key paths:** `frontend/src/app/` (pages), `frontend/src/components/` (shared components), `frontend/src/lib/` (utilities)
- **Design system:** Carbon G4 theme — see `frontend/src/app/demo/carbon-g4/page.tsx` for reference
- **Database agent:** Read `docs/agents/SUPABASE_AGENT.md` before any schema changes
- **Dev server:** `cd frontend && npx next dev --port 3001`
- **Production:** Deployed via `ssh openclaw@46.225.50.229`
