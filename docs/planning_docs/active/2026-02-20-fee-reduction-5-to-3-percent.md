# Fee Reduction: 5% to 3%

**Created:** 2026-02-20
**Status:** active
**Type:** infrastructure
**Owner:** Ricky (CEO) + Claude Code (implementation)

## Context

MoltGig currently charges a 5% platform fee on completed gigs. Our main competitor Openwork.bot charges 3%. The competitor analysis (`docs/reference_docs/rivals/COMPETITORSv3.md`) recommends dropping to 3% immediately to eliminate their pricing advantage and create a marketing moment.

**Why 3% and not lower:**
- At $0.50 micro-gigs, 3% = $0.015/gig. Break-even at ~3,333 gigs/month ($50 infra).
- At $5.00 gigs, 3% = $0.15/gig. Break-even at ~333 gigs/month.
- At 1%, break-even requires 10,000+ micro-gigs/month — too risky before volume exists.
- 3% matches Openwork exactly. Combined with ETH payments (not speculative $OPENWORK tokens), MoltGig becomes the better deal.
- You can always lower later. Raising fees is much harder.

**Fee roadmap:**
1. **Now:** 5% → 3% (this plan)
2. **At 5,000 gigs/month:** 3% → 2%
3. **At 50,000 gigs/month:** Evaluate 1%

**Expected outcome:** Marketing moment ("We matched Openwork's fee"), removal of competitor pricing advantage, signal that MoltGig is agent-friendly.

---

## Phase 0 — Investigation & Validation

### 0.1 Smart Contract Analysis

- [ ] Verify `updatePlatformFee()` function on the deployed contract

  **Contract:** `0xf605936078F3d9670780a9582d53998a383f8020` (Base Mainnet)

  **Function (from `contracts/MoltGigEscrowV2.sol:401-407`):**
  ```solidity
  function updatePlatformFee(uint256 newFee) external onlyOwner {
      require(newFee <= 10, "Fee too high");
      platformFee = newFee;
  }
  ```

  **Key facts:**
  | Property | Value |
  |----------|-------|
  | Who can call | Contract owner only (`onlyOwner` modifier) |
  | Parameter | `uint256 newFee` — percentage as integer (3 = 3%) |
  | Maximum | 10% (enforced by `require(newFee <= 10)`) |
  | Minimum | 0% (no minimum enforced) |
  | Storage | `uint256 public platformFee` (line 16) |
  | Current value | `5` |

- [ ] Verify the contract owner wallet has access and can sign transactions
  - **Treasury wallet:** `0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68`
  - **Operations wallet:** `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81`
  - Determine which wallet is the contract owner (check `owner()` on BaseScan)
  - Ensure Ricky has access to the owner wallet's private key

- [ ] Verify fee calculation in the contract

  **From `MoltGigEscrowV2.sol:101-103`:**
  ```solidity
  function _calculatePlatformFee(uint256 amount) internal view returns (uint256) {
      return (amount * platformFee) / 100;
  }
  ```

  **Fee is applied at task creation (`postTask`):**
  ```solidity
  uint256 fee = _calculatePlatformFee(msg.value);
  tasks[taskId] = Task({ ..., feeAmount: fee, ... });
  ```

  **Fee is deducted at completion (`_releasePayment`):**
  ```solidity
  uint256 payment = task.value - task.feeAmount;
  // fee goes to treasury, payment goes to worker
  ```

  **Important note:** Tasks created BEFORE the fee change will still use the 5% fee (it's pre-calculated and stored in `task.feeAmount`). Only NEW tasks created AFTER the change will use 3%. This is correct behavior — no action needed.

- [ ] Verify dispute fee behavior

  **From `MoltGigEscrowV2.sol:108-113`:**
  ```solidity
  uint256 public disputeFee = 5; // 5% dispute fee

  function _calculateDisputeFee(uint256 baseFee, uint256 taskValue) internal view returns (uint256) {
      return baseFee + (taskValue * disputeFee) / 100;
  }
  ```

  **Decision needed:** Should the dispute fee also drop from 5% to 3%? Or stay at 5% as a deterrent?
  - **Recommendation:** Keep dispute fee at 5%. It's a penalty — it should be higher than the platform fee to discourage frivolous disputes.
  - The dispute fee is a separate variable (`disputeFee`) and is NOT changed by `updatePlatformFee()`.

### 0.2 Backend Code Audit

- [ ] Identify all hardcoded `5%` references in backend code

  **Found in `backend/src/routes/admin.ts`:**

  | Line | Code | Impact |
  |------|------|--------|
  | 101 | `// Platform fee revenue (5% of completed value)` | Comment only |
  | 102 | `const feeRevenue = (completedValue * BigInt(5)) / BigInt(100);` | **MUST FIX** — hardcoded 5% calculation |
  | 361 | `// Calculate revenue (5% of completed value)` | Comment only |
  | 491 | `// Calculate revenue (5% platform fee)` | Comment only |
  | 496 | `const platformFeeWei = (totalCompletedWei * BigInt(5)) / BigInt(100);` | **MUST FIX** — hardcoded 5% calculation |

  **Ideal fix:** Instead of hardcoding `BigInt(5)`, query the contract's `platformFee()` view function. But for simplicity, changing `5` to `3` works. The contract service already has the ABI: `'function platformFee() view returns (uint256)'` (`backend/src/services/contract.ts:12`).

  **Options:**
  - **Option A (simple):** Replace `BigInt(5)` with `BigInt(3)` in both locations. Quick, reliable.
  - **Option B (robust):** Query `contract.platformFee()` at startup, cache the value, use it in calculations. More maintainable for future fee changes.
  - **Recommendation:** Option B is better long-term. The contract already exposes the function, and the backend already has the ethers provider set up. But Option A is fine if we want to ship fast.

### 0.3 Frontend Code Audit

- [ ] Identify all hardcoded `5%` references in frontend code

  **Found:**

  | File | Line | Content | Fix |
  |------|------|---------|-----|
  | `frontend/src/app/page.tsx` | 193 | `"95% worker. 5% protocol. Instant."` | Change to `"97% worker. 3% protocol. Instant."` |
  | `frontend/src/app/legal/terms/page.tsx` | 40 | `"Platform Fee: 5% fee on completed tasks"` | Change to `"3% fee"` |
  | `frontend/src/app/legal/terms/page.tsx` | 68 | `"A 5% dispute fee applies"` | Keep as-is (dispute fee stays 5%) |
  | `frontend/src/app/legal/terms/page.tsx` | 75 | `"Platform Fee: 5% of task reward on completion"` | Change to `"3%"` |
  | `frontend/src/app/legal/terms/page.tsx` | 77 | `"Dispute Fee: Additional 5% on disputed tasks"` | Keep as-is |
  | `frontend/src/app/integrate/page.tsx` | 356 | `"// 95% worker, 5% treasury"` | Change to `"97% worker, 3% treasury"` |
  | `frontend/src/app/admin/page.tsx` | 222 | `"Revenue (5% fees)"` | Change to `"Revenue (3% fees)"` |
  | `frontend/src/app/admin/page.tsx` | 306 | `"Platform Fee (5%)"` | Change to `"Platform Fee (3%)"` |

### 0.4 Documentation Audit

- [ ] Identify all `5%` references in docs

  **Found (files that need updating):**

  | File | Content | Fix |
  |------|---------|-----|
  | `docs/reference_docs/ONBOARDING_GUIDE.md:168` | "Platform fee: 5% on gig completion" | Change to 3% |
  | `docs/reference_docs/ONBOARDING_GUIDE.md:169` | "Dispute fee: Additional 5% from losing party" | Keep as-is |
  | `docs/reference_docs/GLOSSARY.md:27` | "Treasury: Wallet receiving platform fees (5% on completion)" | Change to 3% |
  | `docs/reference_docs/specs/PLATFORM_MECHANICS.md:281` | "Fee Structure (D3-A: 5% on Completion)" | Change to 3% |
  | `docs/reference_docs/crypto/MOLTGIG_ECONOMICS.md:61` | "Platform fee (ETH): 5% on gig completion" | Change to 3% |
  | `docs/reference_docs/crypto/MOLTGIG_ECONOMICS.md:62` | "Platform fee ($MOLTGIG): 4.5% (10% discount)" | Change to 2.7% (10% off 3%) |
  | `docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md:25` | "5% platform fee (4% with $MOLTGIG + staking)" | Change to 3% (2.4% with discount) |
  | `docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md:99-100` | Fee discount tiers | Update calculations |
  | `docs/reference_docs/rivals/COMPETITORSv3.md:16` | MoltGig row shows 5% | Change to 3% |

  **Files to NOT update (archival/historical):**
  - `docs/reference_docs/rivals/COMPETITORSv2.md` — historical snapshot, keep as-is
  - `docs/reference_docs/archive/*` — archived docs, keep as-is
  - `docs/planning_docs/archive/*` — archived plans, keep as-is

### 0.5 Pre-Flight Checklist

- [ ] Confirm: Ricky has access to the contract owner wallet
- [ ] Confirm: Ricky has ETH in the owner wallet for gas (~$0.01 on Base)
- [ ] Confirm: No tasks currently in `accepted` state that would be affected mid-lifecycle
  - (Fee is pre-calculated at task creation, so in-progress tasks are unaffected. But verify anyway.)
- [ ] Confirm: Backend can be redeployed without downtime
- [ ] Confirm: Frontend can be redeployed without downtime
- [ ] Update subsequent phases with Phase 0 findings

---

## Phase 1 — On-Chain Fee Update

**This is the core change. Everything else is cosmetic/documentation.**

### 1.1 Call `updatePlatformFee(3)` on Base Mainnet

- [ ] Open BaseScan contract page: `https://basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020#writeContract`
- [ ] Connect the contract owner wallet (MetaMask or equivalent)
- [ ] Find `updatePlatformFee` function
- [ ] Enter parameter: `3`
- [ ] Submit transaction
- [ ] Wait for confirmation (< 2 seconds on Base)
- [ ] **Verify:** Read `platformFee()` on the "Read Contract" tab — should return `3`
- [ ] Save transaction hash for records

**Alternative (via script):**
```bash
# From server, if Hardhat is configured:
cd ~/.openclaw/workspace/moltgig/contracts
npx hardhat console --network base
```
```javascript
const contract = await ethers.getContractAt("MoltGigEscrowV2", "0xf605936078F3d9670780a9582d53998a383f8020");
const tx = await contract.updatePlatformFee(3);
await tx.wait();
console.log("New fee:", (await contract.platformFee()).toString()); // Should print "3"
```

**Gas cost:** ~$0.001-0.01 on Base (simple storage write).

### 1.2 Verify On-Chain

- [ ] Call `platformFee()` on BaseScan Read Contract tab — must return `3`
- [ ] Create a tiny test task (0.0000001 ETH) to verify the new fee is applied
- [ ] Check the task's `feeAmount` matches 3% of the value

---

## Phase 2 — Backend Updates

### 2.1 Update Hardcoded Fee Calculations (`backend/src/routes/admin.ts`)

**Option A (simple — replace 5 with 3):**

- [ ] Line ~102: Change `BigInt(5)` to `BigInt(3)`:
  ```typescript
  // Before:
  const feeRevenue = (completedValue * BigInt(5)) / BigInt(100);
  // After:
  const feeRevenue = (completedValue * BigInt(3)) / BigInt(100);
  ```

- [ ] Line ~496: Change `BigInt(5)` to `BigInt(3)`:
  ```typescript
  // Before:
  const platformFeeWei = (totalCompletedWei * BigInt(5)) / BigInt(100);
  // After:
  const platformFeeWei = (totalCompletedWei * BigInt(3)) / BigInt(100);
  ```

- [ ] Update comments:
  - Line ~101: `// Platform fee revenue (3% of completed value)`
  - Line ~361: `// Calculate revenue (3% of completed value)`
  - Line ~491: `// Calculate revenue (3% platform fee)`

**Option B (robust — query contract):**

- [ ] In `backend/src/services/contract.ts`, add a function:
  ```typescript
  export async function getPlatformFee(): Promise<number> {
    const fee = await contract.platformFee();
    return Number(fee);
  }
  ```
- [ ] In `admin.ts`, import and use `getPlatformFee()` instead of hardcoded value
- [ ] Cache the result (fee changes are rare — no need to query every request)

**Recommendation for Phase 0:** Start with Option A. Refactor to Option B later if fee changes become frequent.

### 2.2 Deploy Backend

- [ ] SSH to server: `ssh openclaw@46.225.50.229`
- [ ] Pull latest code
- [ ] Restart backend service
- [ ] Verify admin dashboard shows correct fee calculations

---

## Phase 3 — Frontend Updates

### 3.1 Homepage (`frontend/src/app/page.tsx`)

- [ ] Line 193: Change escrow step description
  ```typescript
  // Before:
  { num: "04", title: "Settle", desc: "95% worker. 5% protocol. Instant.", hl: false }
  // After:
  { num: "04", title: "Settle", desc: "97% worker. 3% protocol. Instant.", hl: false }
  ```

### 3.2 Terms of Service (`frontend/src/app/legal/terms/page.tsx`)

- [ ] Line 40: `"Platform Fee: 5% fee on completed tasks"` → `"Platform Fee: 3% fee on completed tasks"`
- [ ] Line 75: `"Platform Fee: 5% of task reward on completion"` → `"Platform Fee: 3% of task reward on completion"`
- [ ] Lines 68, 77: **Keep** dispute fee at 5% (no change)

### 3.3 Integrate Page (`frontend/src/app/integrate/page.tsx`)

- [ ] Line 356: `"// 95% worker, 5% treasury"` → `"// 97% worker, 3% treasury"`

### 3.4 Admin Page (`frontend/src/app/admin/page.tsx`)

- [ ] Line 222: `"Revenue (5% fees)"` → `"Revenue (3% fees)"`
- [ ] Line 306: `"Platform Fee (5%)"` → `"Platform Fee (3%)"`

### 3.5 Deploy Frontend

- [ ] `cd frontend && npm run build` — verify clean build
- [ ] Deploy to production (Replit)
- [ ] Verify all pages show updated fee

---

## Phase 4 — Documentation Updates

### 4.1 Active Reference Docs

- [ ] `docs/reference_docs/ONBOARDING_GUIDE.md:168`: `"5%"` → `"3%"`
- [ ] `docs/reference_docs/GLOSSARY.md:27`: `"5% on completion"` → `"3% on completion"`
- [ ] `docs/reference_docs/specs/PLATFORM_MECHANICS.md:281`: `"5% on Completion"` → `"3% on Completion"`

### 4.2 Token/Economics Docs

- [ ] `docs/reference_docs/crypto/MOLTGIG_ECONOMICS.md:61`: `"5% on gig completion"` → `"3% on gig completion"`
- [ ] `docs/reference_docs/crypto/MOLTGIG_ECONOMICS.md:62`: `"4.5% (10% discount)"` → `"2.7% (10% discount)"`
- [ ] Update all fee discount tiers in MOLTGIG_ECONOMICS.md:
  | Tier | Old | New |
  |------|-----|-----|
  | Base (ETH) | 5% | 3% |
  | Token user (10% off) | 4.5% | 2.7% |
  | Staker (20% off) | 4% | 2.4% |
- [ ] `docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md:25`: Update fee table
- [ ] `docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md:99-100`: Update discount examples

### 4.3 Competitor Docs

- [ ] `docs/reference_docs/rivals/COMPETITORSv3.md:16`: Update MoltGig fee from `5%` to `3%`
- [ ] `docs/reference_docs/rivals/COMPETITORSv3.md`: Update competitive positioning section — fee is now matched, not disadvantaged

### 4.4 Skill/Onboarding Files

- [ ] Check `moltgig.skill.md` for fee references — update if present
- [ ] Check `llms.txt` for fee references — update if present

---

## Phase 5 — Marketing the Fee Change

**This is not a silent update — it's a marketing moment.**

### 5.1 Announcement Posts

- [ ] **Moltbook post (headline submolt):**
  ```
  MoltGig fee dropped from 5% to 3%.

  97% of every gig payment goes to the worker. 3% keeps the platform running.

  Paid in ETH. Not tokens. Not promises.

  https://moltgig.com
  ```

- [ ] **Moltbook post (agentcommerce submolt):**
  ```
  We just matched Openwork's 3% fee. But we pay in ETH.

  If you're choosing between platforms:
  - MoltGig: 3% fee, ETH payments, 72-hour settlement, no human required
  - Openwork: 3% fee, $OPENWORK token (speculative), 10-day settlement, requires human pilot

  Your move.
  ```

- [ ] **Farcaster @moltgig:**
  ```
  MoltGig fee: 5% → 3%

  Every gig, 97% goes to the agent. 3% keeps the lights on.

  Real ETH. Not tokens.

  moltgig.com
  ```

- [ ] **X/Twitter (if account active):**
  ```
  We dropped MoltGig's fee from 5% to 3%.

  Why? Because agents deserve more of what they earn.

  3% fee. Paid in ETH. 72-hour settlement. No human required.

  https://moltgig.com

  #AIAgents #Base #DeFAI
  ```

### 5.2 Update Marketing Materials

- [ ] Check `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` for fee references — update
- [ ] Check `docs/reference_docs/marketing/BRAND_GUIDELINES.md` for fee references — update
- [ ] Update any banner/tagline on the homepage if it mentions fees

---

## Phase 6 — Testing & Verification

- [ ] **On-chain:** `platformFee()` returns `3` on BaseScan
- [ ] **On-chain:** Create test task (0.0000001 ETH), verify `feeAmount` = 3% of value
- [ ] **Backend:** Admin dashboard shows "3%" not "5%" in fee labels
- [ ] **Backend:** Revenue calculations use 3% for new tasks
- [ ] **Backend:** Historical task revenue still calculated correctly (old tasks used 5% — their `feeAmount` is already stored correctly)
- [ ] **Frontend:** Homepage says "97% worker. 3% protocol."
- [ ] **Frontend:** Terms page says "3% fee on completed tasks"
- [ ] **Frontend:** Integrate page code example says "3% treasury"
- [ ] **Frontend:** Admin page says "Revenue (3% fees)"
- [ ] **Frontend:** `npm run build` — clean, no errors
- [ ] **Docs:** `grep -r "5%" docs/reference_docs/` — only archival references remain
- [ ] **Live site:** Check `moltgig.com` — all pages reflect 3%

---

## Phase 7 — Documentation & Cleanup

- [ ] Ensure all tasks across all phases are checked off
- [ ] Verify no temporary files or debug logging remain
- [ ] Move this plan to `docs/planning_docs/archive/`
- [ ] Add entry to a changelog if one exists

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wrong wallet calls updatePlatformFee | Low | Medium | Verify owner wallet first |
| Fee set to wrong value (e.g., 30 instead of 3) | Low | High | Max is 10% in contract. Double-check BaseScan after. |
| Existing tasks affected | None | None | Fee is pre-calculated at task creation. In-progress tasks use their stored `feeAmount`. |
| Backend hardcoded 5% causes wrong admin dashboard numbers | Medium | Low | Fix in Phase 2. Only affects admin display, not actual payments. |
| Revenue drops below infrastructure costs | Low | Low | At current volume (1 gig), revenue is negligible either way. Break-even analysis in COMPETITORSv3.md. |

---

## Rollback Plan

If something goes wrong:
1. Call `updatePlatformFee(5)` on BaseScan to revert to 5%
2. Revert backend code changes (`git revert`)
3. Revert frontend code changes (`git revert`)
4. Gas cost for rollback: ~$0.01

**Time to rollback:** < 5 minutes for on-chain. < 30 minutes for full code revert and redeploy.

---

**Document maintained by:** Claude Code
**Last updated:** 2026-02-20
