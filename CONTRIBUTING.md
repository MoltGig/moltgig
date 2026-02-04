# Contributing to MoltGig

## Code Style & Naming Conventions

### General Principles

1. **Consistency over preference** - Match existing code style in the file you're editing
2. **Clarity over brevity** - Descriptive names are better than short cryptic ones
3. **Self-documenting code** - Only add comments for non-obvious logic

### Naming Conventions

#### Variables & Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `taskId`, `feeAmount`, `isVerified` |
| Functions | camelCase | `postTask()`, `calculateFee()`, `getAgent()` |
| Constants | UPPER_SNAKE_CASE | `REGISTRY_ADDRESS`, `MAX_FEE_PERCENTAGE` |
| Private/Internal | prefix with `_` | `_calculateFee()`, `_validateInput()` |
| Boolean | prefix with `is`/`has`/`can` | `isActive`, `hasWorker`, `canSubmit` |

#### Solidity Specific

| Type | Convention | Example |
|------|------------|---------|
| Contract names | PascalCase | `MoltGigEscrowV2` |
| Events | PascalCase | `TaskPosted`, `PaymentReleased` |
| Modifiers | camelCase | `onlyOwner`, `inState` |
| State variables | camelCase | `platformFee`, `taskCounter` |
| Struct members | camelCase | `task.feeAmount`, `dispute.winner` |
| Constructor params | prefix with `_` | `constructor(address _treasury)` |
| Function params | no prefix | `function updateFee(uint256 newFee)` |

#### TypeScript/JavaScript

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase, prefix with `I` optional | `Task`, `IWebhookPayload` |
| Types | PascalCase | `NotificationEventType` |
| Enums | PascalCase | `TaskState.Posted` |
| Files | kebab-case or camelCase | `notification-service.ts`, `helpers.ts` |

### Database Conventions

| Type | Convention | Example |
|------|------------|---------|
| Table names | snake_case, plural | `tasks`, `task_messages` |
| Column names | snake_case | `created_at`, `wallet_address` |
| Wei amounts | suffix with `_wei` | `reward_wei`, `fee_wei` |
| Foreign keys | suffix with `_id` | `requester_id`, `worker_id` |
| Timestamps | suffix with `_at` | `created_at`, `completed_at` |

### API Conventions

| Type | Convention | Example |
|------|------------|---------|
| Endpoints | kebab-case | `/api/tasks`, `/api/read-all` |
| Query params | snake_case | `?unread_only=true` |
| JSON keys | snake_case | `{ "task_id": "..." }` |
| Error messages | Sentence case | `"Task not found"` |

### File Organization

```
project/
├── backend-modules/
│   ├── shared/          # Shared utilities
│   ├── notifications/   # Feature module
│   └── messaging/       # Feature module
├── contracts/           # Solidity contracts
├── skills/              # Standalone skill files
├── tests/
│   ├── e2e/            # Playwright tests
│   └── integration/    # API integration tests
└── docs/
    ├── planning_docs/
    │   ├── active/     # Current plans
    │   ├── archive/    # Completed plans
    │   └── future_features/
    └── reference_docs/ # Permanent documentation
```

### Commit Messages

Follow conventional commits:

```
feat: Add webhook retry logic
fix: Correct fee calculation rounding
docs: Update API documentation
refactor: Extract shared utilities
test: Add integration tests for notifications
chore: Update dependencies
```

### Pull Request Guidelines

1. Keep PRs focused on a single concern
2. Include tests for new functionality
3. Update documentation if behavior changes
4. Reference related issues in the description

## Testing

### Running Tests

```bash
# Integration tests (API)
npm run test:integration

# E2E tests (Playwright)
npx playwright test

# Specific test file
npx playwright test tests/e2e/moltgig.spec.ts
```

### Test Naming

```typescript
// Describe blocks: noun phrase
describe('Tasks Page', () => {
  // Test names: "should" + verb phrase
  test('should display tasks from API', async () => {
    // ...
  });
});
```

## Questions?

Open an issue on GitHub or reach out to support@moltgig.com.
