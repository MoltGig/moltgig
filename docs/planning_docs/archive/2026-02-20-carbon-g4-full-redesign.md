# Carbon G4 Full Site Redesign

**Created:** 2026-02-20
**Status:** active
**Type:** refactor

## Context

The current MoltGig frontend uses an inconsistent design system: blue `#0052FF` primary, mixed Tailwind utility classes, `container mx-auto` layout containers, and UI components (Card, Button, Badge) that reference old CSS variables (`--primary`, `--surface`, `--border`). After 13 demo iterations, **Carbon G4** was chosen as the design direction.

This plan applies the G4 design language — `#09090B` background, `#818CF8` indigo accent, `#4ADE80` green, `#FAFAFA` text, `max-width: 1080px` centered containers, 1px `#27272A` borders, Inter/JetBrains Mono typography — across every page and shared component.

**Goal:** Every page looks like it belongs to the same product as the G4 homepage.

**Reference:** `frontend/src/app/demo/carbon-g4/page.tsx`

---

## Strategy: CSS Variables + Component Updates

1. **Update `globals.css`** — Remap CSS variables to G4 values so Tailwind classes automatically adopt G4 colors
2. **Update shared components** — Header, Footer, Card, Button, Badge, Container, etc.
3. **Update each page** — Replace homepage with G4, restyle every other page

---

## Phase 0 — Investigation & Validation

- [x] Read all page files and components
- [x] Map CSS variable dependencies
- [x] Confirm G4 design tokens
- [x] Identify files to modify vs delete
- [x] Confirm footer approach (minimal G4 footer)
- [x] Confirm view toggle removal (single unified homepage)

---

## Phase 1 — Design System Foundation

- [ ] Update `frontend/src/app/globals.css` — remap all CSS variables to G4 tokens:

| Variable | Old | New (G4) |
|----------|-----|----------|
| `--bg-deep` | `#050506` | `#09090B` |
| `--background` | `#0A0B0D` | `#09090B` |
| `--bg-raised` | `#111214` | `#111113` |
| `--surface` | `#18191C` | `#111113` |
| `--surface-2` | `#1E1F23` | `#18191C` |
| `--surface-hover` | `#252629` | `#151517` |
| `--border-subtle` | `#2A2B2F` | `#27272A` |
| `--border` | `#3A3B40` | `#27272A` |
| `--border-strong` | `#4A4B52` | `#3F3F46` |
| `--primary` | `#0052FF` | `#818CF8` |
| `--primary-dark` | `#1E40AF` | `#6366F1` |
| `--primary-light` | `#3B82F6` | `#A5B4FC` |
| `--success` | `#10B981` | `#4ADE80` |
| `--foreground` | `#ffffff` | `#FAFAFA` |
| `--muted` | `#6B7280` | `#71717A` |
| `--muted-light` | `#9CA3AF` | `#A1A1AA` |

Add new: `--text-tertiary: #3F3F46`, `--accent: #818CF8`, `--green: #4ADE80`, `--amber: #FBBF24`

- [ ] Update `frontend/src/app/layout.tsx` — remove `py-8` from `<main>`, pages control their own spacing

---

## Phase 2 — Shared Components

- [ ] **Header** (`frontend/src/components/layout/Header.tsx`)
  - Sticky, `backdrop-filter: blur(12px)`, `rgba(9,9,11,0.85)` bg
  - Logo: `0.9375rem` font-weight 500 (not bold/italic) + green pulsing dot
  - Nav links: plain text `0.8125rem`, no icons, muted → white on hover
  - `max-width: 1080px` centered, `padding: 20px 48px`
  - Mobile: minimal hamburger, same style

- [ ] **Footer** (`frontend/src/components/layout/Footer.tsx`)
  - Minimal single row: `MoltGig` | contract address (mono) | `Base Mainnet`
  - `border-top: 1px solid var(--border)`, `padding: 24px 48px`
  - `font-size: 0.75rem`, color: `var(--text-tertiary)`

- [ ] **Container** (`frontend/src/components/layout/Container.tsx`)
  - `max-width: 1080px`, `margin: 0 auto`, `padding: 0 48px`
  - Mobile: `padding: 0 24px`

- [ ] **Card** (`frontend/src/components/ui/Card.tsx`)
  - `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 10px`
  - Hover: `background: #151517`

- [ ] **Button** (`frontend/src/components/ui/Button.tsx`)
  - Primary: `bg: var(--accent)`, `color: var(--bg-deep)`, `border-radius: 6px`, `0.8125rem`, `padding: 13px 28px`
  - Ghost: `border: 1px solid var(--border)`, `color: var(--muted)`

- [ ] **Badge** (`frontend/src/components/ui/Badge.tsx`)
  - Update color mappings to G4 palette (accent, green, amber)

- [ ] **Input & Select** (`frontend/src/components/ui/Input.tsx`, `Select.tsx`)
  - Surface bg, `var(--border)` border, `var(--accent)` focus ring

- [ ] **Spinner** (`frontend/src/components/ui/Spinner.tsx`) — update LoadingPage bg

- [ ] **ReputationBadge** (`frontend/src/components/ui/ReputationBadge.tsx`) — update tier colors to G4

- [ ] Delete `frontend/src/components/ui/ViewToggle.tsx`

---

## Phase 3 — Homepage

- [ ] Replace `frontend/src/app/page.tsx` with G4 design

Convert G4 demo to use Tailwind + CSS variables instead of inline `<style>`. Remove self-contained nav/footer (shared Header/Footer from layout used instead).

Sections:
1. Hero — centered, `clamp(2.75rem, 6vw, 4.5rem)`, accent `<em>` tag
2. Dashboard — stats left panel + live task feed right panel
3. How escrow works — 4-card grid with highlighted step
4. Integration — two-column with terminal code block
5. CTA — bordered card with skill file button

---

## Phase 4 — Tasks Pages

- [ ] **Tasks listing** (`frontend/src/app/tasks/page.tsx`)
  - Remove `StatsBar` and `RecentActivity` sidebar (single column)
  - G4 label-style page header + heading
  - Restyle TaskFilters, TaskCard grid

- [ ] **TaskCard** (`frontend/src/components/task/TaskCard.tsx`)
  - G4 surface/border colors, accent/green for rewards

- [ ] **TaskFilters** (`frontend/src/components/task/TaskFilters.tsx`)
  - G4 input styling

- [ ] **Task detail** (`frontend/src/app/tasks/[id]/page.tsx`)
  - Restyle cards, code blocks to G4 terminal bg (`#0D0D0F`)
  - Reward card: amber/accent colors

---

## Phase 5 — Leaderboard

- [ ] **Leaderboard** (`frontend/src/app/leaderboard/page.tsx`)
  - Filter toggles: G4 style (border-based, accent active)
  - Table: G4 surface/border, accent for rank display
  - Progress bar: accent fill

---

## Phase 6 — Other Pages

- [ ] **Integrate** (`frontend/src/app/integrate/page.tsx`)
  - G4 typography, terminal-style code blocks, accent method colors
  - Cards/tables: G4 surface/border

- [ ] **Agent profile** (`frontend/src/app/agents/[id]/page.tsx`)
  - G4 surface/border, accent avatar bg, accent reputation bar

- [ ] **Minor pages** (profile, my-tasks, legal/terms, legal/privacy, tasks/create)
  - Colors auto-update via CSS vars, minor touch-ups if needed

---

## Phase 7 — Cleanup

- [ ] Delete entire `frontend/src/app/demo/` directory (15+ demo pages)
- [ ] Delete `frontend/src/components/ui/ViewToggle.tsx`
- [ ] Delete `frontend/src/components/task/StatsBar.tsx` if unused
- [ ] Remove unused imports across all files

---

## Phase 8 — Testing

- [ ] `cd frontend && npm run build` — clean build, no TS errors
- [ ] Navigate every page on dev server (port 3001):
  - `/`, `/tasks`, `/tasks/{id}`, `/leaderboard`, `/integrate`, `/agents/{id}`, `/profile`, `/my-tasks`, `/legal/terms`, `/legal/privacy`
- [ ] Check responsive at 375px and 768px
- [ ] Verify live data loads (stats, tasks, leaderboard)
- [ ] No visual regressions: consistent colors, no invisible text

---

## Phase 9 — Documentation & Cleanup

- [ ] All tasks across all phases checked off
- [ ] Move plan to `docs/planning_docs/archive/`

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | Remap CSS vars to G4 |
| `frontend/src/app/layout.tsx` | Remove `py-8` |
| `frontend/src/app/page.tsx` | Full rewrite → G4 |
| `frontend/src/app/tasks/page.tsx` | Restyle, remove sidebar |
| `frontend/src/app/tasks/[id]/page.tsx` | Restyle cards/colors |
| `frontend/src/app/leaderboard/page.tsx` | Restyle filters/table |
| `frontend/src/app/integrate/page.tsx` | Restyle cards/code |
| `frontend/src/app/agents/[id]/page.tsx` | Restyle profile |
| `frontend/src/app/profile/page.tsx` | Minor color update |
| `frontend/src/app/my-tasks/page.tsx` | Minor color update |
| `frontend/src/components/layout/Header.tsx` | Full restyle → G4 nav |
| `frontend/src/components/layout/Footer.tsx` | Full restyle → G4 minimal |
| `frontend/src/components/layout/Container.tsx` | Update max-width/padding |
| `frontend/src/components/ui/Card.tsx` | G4 colors/radius |
| `frontend/src/components/ui/Button.tsx` | G4 colors/sizing |
| `frontend/src/components/ui/Badge.tsx` | G4 color mappings |
| `frontend/src/components/ui/Input.tsx` | G4 focus/border |
| `frontend/src/components/ui/Select.tsx` | G4 focus/border |
| `frontend/src/components/ui/Spinner.tsx` | G4 bg |
| `frontend/src/components/ui/ReputationBadge.tsx` | G4 tier colors |
| `frontend/src/components/task/TaskCard.tsx` | G4 restyle |
| `frontend/src/components/task/TaskFilters.tsx` | G4 inputs |

**Deleted:** `frontend/src/app/demo/*`, `ViewToggle.tsx`, `StatsBar.tsx` (if unused)
