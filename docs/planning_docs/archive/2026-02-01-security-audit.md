# MoltGig Security Audit Report
**Date:** 2026-02-01
**Auditor:** Claude Code (self-audit)
**Scope:** Backend API, Smart Contract

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 2 |
| Medium | 4 |
| Low | 3 |
| Informational | 2 |

**Overall Assessment:** The codebase follows good security practices with proper authentication, input validation, and access controls. However, the smart contract has several issues that should be addressed before mainnet deployment.

---

## Critical Issues

### C-1: Smart Contract pause() Function Not Implemented
**Location:** `contracts/MoltGigEscrow.sol:256-258`
**Severity:** Critical
**Status:** MUST FIX before mainnet

```solidity
function pause() external onlyOwner {
    // Implementation for emergency pause functionality
}
```

**Issue:** The pause function is empty. In an emergency (exploit, bug), there's no way to halt operations.

**Recommendation:** Implement using OpenZeppelin's Pausable:
```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract MoltGigEscrow is Pausable {
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function postTask(...) external payable whenNotPaused returns (uint256) {
        // ...
    }
}
```

---

## High Severity Issues

### H-1: Reentrancy Risk in Payment Functions
**Location:** `contracts/MoltGigEscrow.sol:167-181, 206-232`
**Severity:** High

**Issue:** External calls (transfers) are made before state updates in `_releasePayment` and `resolveDispute`. While `transfer()` limits gas to 2300, this pattern is still risky.

**Current Code:**
```solidity
function _releasePayment(uint256 taskId) internal {
    // ...
    payable(treasury).transfer(task.feeAmount);  // External call
    payable(task.worker).transfer(payment);       // External call
    task.state = TaskState.Resolved;              // State update AFTER
}
```

**Recommendation:** Use checks-effects-interactions pattern + ReentrancyGuard:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function _releasePayment(uint256 taskId) internal nonReentrant {
    Task storage task = tasks[taskId];
    task.state = TaskState.Resolved;  // State update FIRST

    uint256 payment = task.value - task.feeAmount;

    (bool feeSuccess, ) = payable(treasury).call{value: task.feeAmount}("");
    require(feeSuccess, "Fee transfer failed");

    (bool paySuccess, ) = payable(task.worker).call{value: payment}("");
    require(paySuccess, "Payment transfer failed");
}
```

### H-2: No Task Cancellation Function
**Location:** `contracts/MoltGigEscrow.sol`
**Severity:** High

**Issue:** If a poster creates a task but no worker claims it, funds are locked forever. There's no cancel/refund mechanism.

**Recommendation:** Add cancel function:
```solidity
function cancelTask(uint256 taskId) external inState(taskId, TaskState.Posted) {
    Task storage task = tasks[taskId];
    require(msg.sender == task.poster, "Only poster can cancel");
    require(block.timestamp > task.deadline, "Wait for deadline");

    task.state = TaskState.Cancelled;
    payable(task.poster).call{value: task.value}("");
}
```

---

## Medium Severity Issues

### M-1: Fund Endpoint Trusts Client Transaction Hash
**Location:** `backend/src/routes/tasks.ts:POST /:id/fund`
**Severity:** Medium

**Issue:** The `/fund` endpoint accepts a transaction hash without verifying it on-chain. A malicious user could submit a fake tx_hash.

**Current Code:**
```typescript
// Validate tx_hash format
if (!tx_hash.match(/^0x[a-fA-F0-9]{64}$/)) {
    res.status(400).json({ error: 'Invalid transaction hash format' });
    return;
}
// No on-chain verification!
```

**Recommendation:** Add on-chain verification:
```typescript
// Verify transaction on chain
const receipt = await provider.getTransactionReceipt(tx_hash);
if (!receipt || receipt.status !== 1) {
    res.status(400).json({ error: 'Transaction not confirmed' });
    return;
}
// Verify it's to our contract with correct value
```

**Mitigation:** The event listener should catch this eventually, but immediate verification is better.

### M-2: CORS Allows All Origins
**Location:** `backend/src/index.ts:16`
**Severity:** Medium

**Issue:** CORS is configured to allow `*` by default.

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',  // Defaults to allow all
```

**Recommendation:** Set explicit origin in production:
```bash
# .env
CORS_ORIGIN=https://moltgig.com
```

### M-3: getPlatformStats Has O(n) Complexity
**Location:** `contracts/MoltGigEscrow.sol:261-282`
**Severity:** Medium (Gas)

**Issue:** Loops through all tasks to calculate stats. Will become expensive at scale.

**Recommendation:** Track counters incrementally:
```solidity
uint256 public activeTasks;
uint256 public completedTasks;
uint256 public totalFeesCollected;

// Update on state changes
function _releasePayment(uint256 taskId) internal {
    // ...
    activeTasks--;
    completedTasks++;
    totalFeesCollected += task.feeAmount;
}
```

### M-4: Using transfer() Instead of call()
**Location:** `contracts/MoltGigEscrow.sol:173, 176, 224, 227`
**Severity:** Medium

**Issue:** `transfer()` forwards only 2300 gas. If treasury or worker is a contract with a receive function that uses more gas, transfers will fail.

**Recommendation:** Use `call` with success check:
```solidity
(bool success, ) = payable(recipient).call{value: amount}("");
require(success, "Transfer failed");
```

---

## Low Severity Issues

### L-1: No Rate Limiting on Auth Failures
**Location:** `backend/src/middleware/auth.ts`
**Severity:** Low

**Issue:** Failed authentication attempts aren't specifically rate-limited, allowing brute force attempts on signatures.

**Recommendation:** Track failed attempts per wallet and implement exponential backoff.

### L-2: Timestamp Window Could Be Tighter
**Location:** `backend/src/middleware/auth.ts:40`
**Severity:** Low

**Issue:** 5-minute timestamp window is reasonable but could be tighter.

**Recommendation:** Consider 2-3 minutes for tighter replay protection.

### L-3: Stats Endpoint Creates New Supabase Client
**Location:** `backend/src/index.ts:52-54`
**Severity:** Low (Performance)

**Issue:** Creates a new Supabase client on each stats request instead of reusing the singleton.

```typescript
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(...);  // New client each time
```

**Recommendation:** Import and use the existing singleton from config/supabase.js

---

## Informational

### I-1: Missing Worker Deadline Grace Period
**Location:** `contracts/MoltGigEscrow.sol:139`

Worker can't submit if deadline passed, even by 1 second. Consider adding a grace period for edge cases.

### I-2: No Upgrade Path
**Location:** `contracts/MoltGigEscrow.sol`

Contract is not upgradeable. If bugs are found after deployment, a new contract must be deployed and users migrated. Consider using a proxy pattern for mainnet.

---

## Fixes Required Before Mainnet

| Issue | Priority | Effort |
|-------|----------|--------|
| C-1: Implement pause() | Critical | Low |
| H-1: Add ReentrancyGuard | High | Low |
| H-2: Add cancelTask() | High | Medium |
| M-1: Verify tx on-chain | Medium | Medium |
| M-2: Restrict CORS | Medium | Low |

---

## Checklist for Production

- [ ] Implement pause/unpause functionality
- [ ] Add ReentrancyGuard to all payment functions
- [ ] Add cancelTask function
- [ ] Change transfer() to call() pattern
- [ ] Set CORS_ORIGIN in production environment
- [ ] Add on-chain transaction verification
- [ ] Consider proxy pattern for upgradeability
- [ ] External audit (recommended)

---

**Signed:** Claude Code Security Audit
**Date:** 2026-02-01
