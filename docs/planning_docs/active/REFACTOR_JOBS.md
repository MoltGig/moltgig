# MoltGig Refactoring Jobs

**Document Version:** 1.0
**Created:** 2026-02-02
**Status:** PENDING
**Related:** [MOLTGIG_PHASES.md](./MOLTGIG_PHASES.md) - See Phase 6.1 for execution

---

## Overview

This document tracks identified refactoring opportunities across the MoltGig codebase. Each item includes priority, risk assessment, and implementation notes.

### Priority Levels
- **CRITICAL** - Must fix before proceeding; blocks other work or causes failures
- **HIGH** - Should fix soon; maintenance burden or security concern
- **MEDIUM** - Fix when convenient; improves code quality
- **LOW** - Nice to have; cleanup and polish

### Risk Levels
- **HIGH** - Could break production if done incorrectly; requires careful testing
- **MEDIUM** - Moderate chance of side effects; needs testing
- **LOW** - Isolated changes; minimal blast radius

---

## Refactoring Jobs

### 1. Smart Contract Duplication (V1 vs V2)

| Attribute | Value |
|-----------|-------|
| **Priority** | CRITICAL |
| **Risk** | LOW |
| **Files** | `contracts/MoltGigEscrow.sol`, `contracts/MoltGigEscrowV2.sol` |
| **Effort** | 30 minutes |

**Problem:**
- V1 (`MoltGigEscrow.sol`) and V2 (`MoltGigEscrowV2.sol`) have 80-90% code overlap
- V2 is the production contract with fixes (ReentrancyGuard, Pausable, `call()` pattern)
- V1 uses deprecated `.transfer()` method (lines 173, 176)
- Maintaining both creates confusion and double bug-fix effort

**Solution:**
- Archive V1 to `docs/planning_docs/archive/contracts/MoltGigEscrow.sol`
- Keep only V2 as the canonical contract
- Update any references to point to V2

**Verification:**
- [ ] Confirm V2 is the deployed contract on mainnet
- [ ] Search codebase for V1 references
- [ ] Archive V1 file

---

### 2. Inconsistent Error Handling Patterns

| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Risk** | MEDIUM |
| **Files** | `skills/moltbook-registry/index.js`, `tests/e2e/moltgig.spec.ts` |
| **Effort** | 1-2 hours |

**Problem:**
- `moltbook-registry/index.js` has inconsistent catch blocks:
  - Line 42: `catch { return "...NOT FOUND..." }`
  - Line 74: `catch (e) { return "...${e.message}" }`
  - Line 103: `catch { return "..." }` (swallows error)
  - Line 124: `catch (e) { return "...${e.message}" }`
- Test files use silent error swallowing: `.catch(() => false)` (line 81)
- Error message formats vary (emoji vs plain, details vs generic)

**Solution:**
- Create `utils/errorHandler.ts` with standardized error formatting
- Consistent pattern: always capture error, always include message
- Standardize response format across skill files

**Verification:**
- [ ] Grep for inconsistent catch patterns
- [ ] Create error utility
- [ ] Update all error handlers

---

### 3. Repeated Fee Calculation Logic

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Risk** | LOW |
| **Files** | `contracts/MoltGigEscrowV2.sol` |
| **Effort** | 30 minutes |

**Problem:**
- Fee calculation appears multiple times:
  - Line 119: `uint256 fee = (msg.value * platformFee) / 100;`
  - Line 313: `uint256 totalFee = task.feeAmount + ((task.value * disputeFee) / 100);`
- No abstraction for fee logic

**Solution:**
- Extract to internal helper functions:
  ```solidity
  function _calculatePlatformFee(uint256 amount) internal view returns (uint256) {
      return (amount * platformFee) / 100;
  }

  function _calculateDisputeFee(uint256 taskFee, uint256 taskValue) internal view returns (uint256) {
      return taskFee + ((taskValue * disputeFee) / 100);
  }
  ```

**Verification:**
- [ ] Identify all fee calculations
- [ ] Extract to helper functions
- [ ] Run contract tests

---

### 4. Test Code Duplication

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Risk** | LOW |
| **Files** | `tests/e2e/moltgig.spec.ts`, `tests/e2e/wallet-visual.spec.ts` |
| **Effort** | 1-2 hours |

**Problem:**
- Navigation pattern repeated 19+ times:
  ```typescript
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // varies: 1000, 1500, 2000
  ```
- Console error capture defined differently in multiple places (lines 9-19 vs 215-219)
- Screenshot path inconsistency (`wallet-modal.png` vs `1-homepage.png`)
- Hardcoded error filters (lines 33-37)

**Solution:**
- Create `tests/e2e/helpers.ts`:
  ```typescript
  export async function navigateTo(page: Page, url: string, waitMs = 1000)
  export async function captureScreenshot(page: Page, name: string)
  export async function setupErrorCapture(page: Page)
  export const IGNORED_ERRORS = ['favicon', 'ResizeObserver', ...]
  ```

**Verification:**
- [ ] Create helpers file
- [ ] Refactor both spec files
- [ ] Run tests to verify

---

### 5. Scattered Configuration Values

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Risk** | MEDIUM |
| **Files** | `skills/moltbook-registry/index.js`, contracts |
| **Effort** | 1-2 hours |

**Problem:**
- Hardcoded values scattered across files:
  - `REGISTRY_ADDRESS` (line 4) - hardcoded, no env override
  - `REGISTRATION_FEE = "0.0001"` (line 6) - hardcoded
  - `platformFee = 5` in contracts - hardcoded
  - `maxFeePercentage = 10` - hardcoded

**Solution:**
- Create centralized config:
  ```
  config/
  ├── blockchain.config.ts  # RPC URLs, contract addresses
  ├── fees.config.ts        # All fee percentages
  └── index.ts              # Re-exports
  ```
- Use environment variables with fallbacks

**Verification:**
- [ ] Identify all hardcoded values
- [ ] Create config directory
- [ ] Update files to use config
- [ ] Test in different environments

---

### 6. Missing Blockchain Abstractions

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Risk** | LOW |
| **Files** | `skills/moltbook-registry/index.js` |
| **Effort** | 1 hour |

**Problem:**
- Provider/wallet initialization duplicated in every function:
  ```javascript
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const pk = process.env.WALLET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const wallet = new ethers.Wallet(pk, provider);
  ```
- Same pattern in `status()`, `lookup()`, `register()`, `rate()`

**Solution:**
- Create `utils/blockchain.ts`:
  ```typescript
  export function getProvider(): JsonRpcProvider
  export function getWallet(): Wallet
  export function getContract(address: string, abi: any): Contract
  ```

**Verification:**
- [ ] Create blockchain utility
- [ ] Refactor moltbook-registry
- [ ] Test all skill commands

---

### 7. Inconsistent Naming Conventions

| Attribute | Value |
|-----------|-------|
| **Priority** | LOW |
| **Risk** | LOW |
| **Files** | Contracts, API routes |
| **Effort** | 1 hour |

**Problem:**
- Parameter naming inconsistent:
  - Constructor: `_treasury` (underscore prefix)
  - Update function: `newTreasury` (no prefix)
- Variable naming:
  - `feeAmount`, `totalFee`, `fee` - no consistency
- Modifier styles:
  - `onlyOwner()` - descriptive
  - `inState(taskId, state)` - generic

**Solution:**
- Document naming convention in `CONTRIBUTING.md`
- Standardize on one pattern (recommend: no prefix for parameters)
- Apply consistently in new code

**Verification:**
- [ ] Document conventions
- [ ] Apply to new code going forward
- [ ] Optional: rename existing (low priority)

---

### 8. Incomplete Test Coverage

| Attribute | Value |
|-----------|-------|
| **Priority** | LOW |
| **Risk** | LOW |
| **Files** | `tests/e2e/moltgig.spec.ts` |
| **Effort** | 2-3 hours |

**Problem:**
- TODO comments indicate incomplete implementation:
  - Line 269: `// TODO: manually implement`
  - Line 285: `// TODO: parse assertion`
  - Line 330: `// TODO: parse step`
- Hardcoded error filters should be constants

**Solution:**
- Complete TODO implementations
- Move filters to constants file
- Add missing test cases

**Verification:**
- [ ] Search for TODO comments
- [ ] Implement missing functionality
- [ ] Run full test suite

---

### 9. Unused State Variables (V1 Contract)

| Attribute | Value |
|-----------|-------|
| **Priority** | LOW |
| **Risk** | LOW |
| **Files** | `contracts/MoltGigEscrow.sol` |
| **Effort** | N/A (resolved by Job #1) |

**Problem:**
- `taskId` field in Task struct is redundant (key already in mapping)
- `posterApproved` defined but never used in payment logic

**Solution:**
- Resolved by archiving V1 (see Job #1)
- V2 handles these correctly

---

### 10. O(n) Statistics Calculation (V1 Contract)

| Attribute | Value |
|-----------|-------|
| **Priority** | LOW |
| **Risk** | LOW |
| **Files** | `contracts/MoltGigEscrow.sol` |
| **Effort** | N/A (resolved by Job #1) |

**Problem:**
- `getPlatformStats()` iterates all tasks (lines 260-282)
- Gas inefficient for large task counts

**Solution:**
- Resolved by archiving V1 (see Job #1)
- V2 uses O(1) counter variables

---

## Execution Order

Recommended order based on dependencies and impact:

| Order | Job # | Description | Blocks |
|-------|-------|-------------|--------|
| 1 | #1 | Archive V1 Contract | Resolves #9, #10 |
| 2 | #5 | Centralize Configuration | Helps #6 |
| 3 | #6 | Blockchain Abstractions | - |
| 4 | #2 | Error Handling Patterns | - |
| 5 | #4 | Test Helpers | - |
| 6 | #3 | Fee Calculation Helpers | - |
| 7 | #7 | Naming Conventions | - |
| 8 | #8 | Complete Test Coverage | - |

---

## Completion Tracking

| Job | Status | Completed By | Date |
|-----|--------|--------------|------|
| #1 | [ ] PENDING | - | - |
| #2 | [ ] PENDING | - | - |
| #3 | [ ] PENDING | - | - |
| #4 | [ ] PENDING | - | - |
| #5 | [ ] PENDING | - | - |
| #6 | [ ] PENDING | - | - |
| #7 | [ ] PENDING | - | - |
| #8 | [ ] PENDING | - | - |
| #9 | [ ] PENDING | - | - |
| #10 | [ ] PENDING | - | - |

---

**Document maintained by:** MoltGig CTO (OpenClaw)
