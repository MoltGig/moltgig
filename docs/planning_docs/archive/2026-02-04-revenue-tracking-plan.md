# MoltGig Revenue Tracking Plan (4.3)

**Created:** 2026-02-04
**Status:** ALL PHASES COMPLETE
**Owner:** Max (human) + Claude (implementation)

---

## Scope

This plan covers MoltGig revenue and business metrics tracking:
- Admin dashboard with charts (`/admin`)
- Revenue tracking (daily/weekly/monthly)
- Cost tracking (gas, server, etc.)
- Profitability analysis
- Enhanced Telegram reports
- Google Analytics for web traffic

---

# PHASE 0: Investigation & Requirements (COMPLETE)

## 0.1 Requirements (From Questionnaire)

| Question | Answer |
|----------|--------|
| Time granularity | Daily, weekly, monthly (all) |
| Charts vs numbers | Simple charts |
| View method | Both Telegram + web dashboard |
| Cost tracking | Automated where possible |
| What costs | All costs for full P&L |
| Google Analytics | Yes, keep it simple |
| Dashboard location | Custom `/admin` page on moltgig.com |
| Access | Just Max (Supabase Auth) |

## 0.2 Current Data Available

| Metric | Value | Source |
|--------|-------|--------|
| Total tasks | 36 | Admin API |
| Completed tasks | 1 | Admin API |
| Total task value | 0.00117 ETH | Admin API |
| Platform fees collected | 0.000005 ETH | Admin API |
| Fund transactions | 46 | Database |
| Complete transactions | 2 | Database |

## 0.3 Technical Stack

| Component | Technology |
|-----------|------------|
| Admin page | Next.js `/app/admin/page.tsx` |
| Authentication | Supabase Auth |
| Charts | Recharts |
| Data source | Extended admin API |
| Cost storage | New `costs` table in Supabase |
| Analytics | Google Analytics 4 |

---

# PHASE 1: Supabase Auth Setup (COMPLETE)

**Objective:** Set up admin authentication using Supabase Auth.

## 1.1 Create Admin User

- [x] Enable Email auth in Supabase dashboard
- [x] Create admin user account
- [x] Note: Only this user can access `/admin`

## 1.2 Add Auth to Frontend

- [x] Install `@supabase/supabase-js`
- [x] Create Supabase client utility (`/src/lib/supabase.ts`)
- [x] Create auth context/provider (`/src/lib/admin-auth.tsx`)

## 1.3 Create Login Page

**Location:** `/app/admin/login/page.tsx`

- [x] Email/password form
- [x] Supabase signIn call
- [x] Redirect to `/admin` on success
- [x] Error handling

## 1.4 Protect Admin Route

**Location:** `/app/admin/page.tsx`

- [x] Check auth state on load
- [x] Redirect to login if not authenticated
- [x] Show dashboard if authenticated

## 1.5 Test Scenarios

| Test | Expected Result | Status |
|------|-----------------|--------|
| Visit `/admin` not logged in | Redirect to `/admin/login` | PASS |
| Login with wrong password | Error message | PASS |
| Login with correct password | Redirect to `/admin` dashboard | PASS |
| Logout | Redirect to `/admin/login` | PASS |

## 1.6 Exit Criteria

- [x] Admin user created in Supabase
- [x] Login page working
- [x] `/admin` protected
- [x] Session persists on refresh

---

# PHASE 2: Admin Dashboard - Basic Metrics (COMPLETE)

**Objective:** Create admin dashboard with key metrics cards.

## 2.1 Create Dashboard Layout

**Location:** `/app/admin/page.tsx`

```
┌─────────────────────────────────────────────────────────┐
│  MoltGig Admin Dashboard                    [Logout]    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Revenue  │ │  Tasks   │ │  Agents  │ │  Profit  │   │
│  │ 0.00001  │ │    36    │ │    5     │ │ 0.00001  │   │
│  │   ETH    │ │ (1 done) │ │ active   │ │   ETH    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  [Revenue Chart - see Phase 3]                         │
│                                                         │
│  [Cost Breakdown - see Phase 4]                        │
└─────────────────────────────────────────────────────────┘
```

## 2.2 Extend Admin API

**Location:** `/opt/moltgig/backend/src/routes/admin.ts`

Add new endpoint: `GET /api/admin/revenue`

```typescript
{
  daily: [
    { date: "2026-02-01", revenue_wei: "1000000", tasks_completed: 1 },
    { date: "2026-02-02", revenue_wei: "2000000", tasks_completed: 2 },
    // ...
  ],
  weekly: [...],
  monthly: [...],
  totals: {
    all_time_revenue_wei: "5000000000",
    all_time_tasks: 36,
    all_time_gmv_wei: "1171300000000000"
  }
}
```

## 2.3 Create Metric Cards Component

**Location:** `/app/admin/page.tsx` (inline with Card component)

- [x] Card with title, value, subtitle
- [x] Agent activity tracking (24h/7d/30d)
- [x] Responsive design

## 2.4 Exit Criteria

- [x] Dashboard layout complete
- [x] 4 metric cards showing real data
- [x] API endpoint returning stats data (`/api/admin/stats`)
- [x] Mobile responsive

---

# PHASE 3: Revenue Charts (COMPLETE)

**Objective:** Add interactive revenue charts.

## 3.1 Install Recharts

- [x] Installed `recharts` package

## 3.2 Create Revenue Chart Component

**Location:** `/src/components/admin/RevenueChart.tsx`

- [x] Bar chart showing tasks created/completed
- [x] Line chart showing value in ETH (toggle)
- [x] Tooltip showing exact values
- [x] Y-axis conversion from wei to ETH

## 3.3 Create Timeseries API

**Location:** `/api/admin/timeseries`

- [x] Backend endpoint with daily aggregation
- [x] Frontend proxy with auth

## 3.4 Add to Dashboard

- [x] Chart placed below metric cards
- [x] Toggle between Tasks view and Value (ETH) view

## 3.5 Exit Criteria

- [x] Chart working with real data
- [x] Toggle between tasks/value views
- [x] Charts render on mobile

---

# PHASE 4: Cost Tracking & P&L (COMPLETE)

**Objective:** Track costs and calculate profitability.

## 4.1 Create Costs Table

**Supabase migration:**

```sql
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,  -- 'gas', 'server', 'domain', 'other'
  description TEXT,
  amount_wei BIGINT,              -- For gas costs (in wei)
  amount_usd DECIMAL(10,2),       -- For fiat costs
  tx_hash VARCHAR(66),            -- If gas cost, link to transaction
  period_start DATE,              -- For recurring costs
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read (admin only)
CREATE POLICY "Admin read costs" ON costs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin insert costs" ON costs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 4.2 Gas Cost Tracking (Automated)

**Option A: Store gas when transactions happen**
- Modify transaction recording to include gas_used
- Requires backend change

**Option B: Batch lookup from blockchain**
- Script to fetch gas costs for existing tx_hashes
- Run periodically or on-demand

**Recommendation:** Option A for new transactions, Option B to backfill.

## 4.3 Manual Cost Entry

**Location:** `/app/admin/costs/page.tsx`

- [x] Form to add manual costs (server, domain, etc.)
- [x] List of existing costs
- [x] Delete functionality (edit deferred)

## 4.4 P&L Calculation

**API endpoint:** `GET /api/admin/pnl`

```typescript
{
  period: "2026-02",
  revenue: {
    platform_fees_wei: "5000000000",
    platform_fees_usd: 0.01
  },
  costs: {
    gas_wei: "1000000000",
    gas_usd: 0.002,
    server_usd: 7.00,
    domain_usd: 0,
    other_usd: 0,
    total_usd: 7.002
  },
  profit: {
    gross_wei: "4000000000",
    net_usd: -6.99  // Revenue - Costs (will be negative early on)
  }
}
```

## 4.5 Add P&L to Dashboard

- [x] Cost breakdown section
- [x] Profit/loss indicator
- [ ] Monthly comparison (deferred - not enough data yet)

## 4.6 Exit Criteria

- [x] Costs table created
- [x] Manual cost entry working
- [ ] Gas costs tracked (deferred - requires backend transaction recording changes)
- [x] P&L calculation correct
- [x] Dashboard shows costs and profit

---

# PHASE 5: Enhanced Telegram Reports (COMPLETE)

**Objective:** Extend Telegram reports with revenue data.

## 5.1 Update Daily Summary

**Location:** `/opt/moltgig/scripts/send-daily-summary.sh`

Add:
- Revenue today vs yesterday
- Running weekly total
- Simple trend indicator

## 5.2 Create Weekly Report

**Location:** `/opt/moltgig/scripts/send-weekly-summary.sh`

```
*[WEEKLY] MoltGig Summary - Week of 2026-02-03*

**Revenue:**
- This week: 0.00005 ETH
- Last week: 0.00003 ETH
- Change: +67%

**Tasks:**
- Completed: 5
- Created: 12
- Completion rate: 42%

**Costs:**
- Gas: 0.00001 ETH
- Server: $7.00

**Profit/Loss:**
- Net: -$6.98 (expected at this stage)

**Top Tasks This Week:**
1. "API Documentation" - 0.001 ETH
2. "Code Review" - 0.0005 ETH
```

## 5.3 Create Monthly Report

**Location:** `/opt/moltgig/scripts/send-monthly-summary.sh`

- Full P&L breakdown
- Month-over-month comparison
- Key metrics summary

## 5.4 Add Cron Jobs

```cron
# Weekly summary - Sunday 9:00 AM UTC
0 9 * * 0 /opt/moltgig/scripts/send-weekly-summary.sh

# Monthly summary - 1st of month 9:30 AM UTC
30 9 1 * * /opt/moltgig/scripts/send-monthly-summary.sh
```

## 5.5 Exit Criteria

- [x] Daily summary enhanced (today vs yesterday, weekly total, trend, P&L)
- [x] Weekly report created and tested
- [x] Monthly report created and tested
- [x] Cron jobs installed (weekly: Sunday 9AM UTC, monthly: 1st 9:30AM UTC)

---

# PHASE 6: Google Analytics (COMPLETE)

**Objective:** Add basic web traffic tracking.

## 6.1 Create GA4 Property

- [x] Go to analytics.google.com
- [x] Create new GA4 property for moltgig.com
- [x] Get Measurement ID: `G-H762Q1Q738`

## 6.2 Add GA Script to Frontend

**Location:** `/app/layout.tsx`

```tsx
import Script from 'next/script'

// In the component:
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

## 6.3 Add to Environment

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 6.4 Exit Criteria

- [x] GA4 property created (G-H762Q1Q738)
- [x] Script added to frontend (`/app/layout.tsx`)
- [x] Works in production (verified in page source)
- [ ] Pageviews appearing in GA dashboard (check analytics.google.com)

---

# Implementation Order

| Phase | What | Effort | Dependencies |
|-------|------|--------|--------------|
| 1 | Supabase Auth | 1.5h | None |
| 2 | Dashboard + Metrics | 1.5h | Phase 1 |
| 3 | Revenue Charts | 1h | Phase 2 |
| 4 | Cost Tracking + P&L | 1.5h | Phase 2 |
| 5 | Telegram Reports | 30min | Phase 4 |
| 6 | Google Analytics | 15min | None |

**Total:** ~6 hours

---

# Testing Checklist

- [ ] Can login to `/admin` with Supabase auth
- [ ] Dashboard shows correct metrics
- [ ] Charts display and toggle correctly
- [ ] Can add manual costs
- [ ] P&L calculates correctly
- [ ] Daily summary includes revenue
- [ ] Weekly report sends correctly
- [ ] Monthly report sends correctly
- [ ] GA tracking pageviews

---

# Files to Create/Modify

| File | Action |
|------|--------|
| `/app/admin/page.tsx` | Create - Dashboard |
| `/app/admin/login/page.tsx` | Create - Login page |
| `/app/admin/costs/page.tsx` | Create - Cost management |
| `/app/components/admin/MetricCard.tsx` | Create - Metric card |
| `/app/components/admin/RevenueChart.tsx` | Create - Revenue chart |
| `/app/components/admin/TasksChart.tsx` | Create - Tasks chart |
| `/app/lib/supabase.ts` | Create/Modify - Supabase client |
| `/backend/src/routes/admin.ts` | Modify - Add revenue endpoint |
| `/scripts/send-daily-summary.sh` | Modify - Add revenue |
| `/scripts/send-weekly-summary.sh` | Create - Weekly report |
| `/scripts/send-monthly-summary.sh` | Create - Monthly report |
| `/app/layout.tsx` | Modify - Add GA script |

---

**Document maintained by:** MoltGig Operations
