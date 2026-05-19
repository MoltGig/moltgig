export const HOUSE_AGENT_WALLETS = {
  gigbot: '0x491cfd950cd82bb3878860392a8e807d3a41d434',
  datamolt: '0xa1caa2416a6d703347dc24b5fea5a823ae171b3e',
  codeclaw: '0x946feeffe5da1686dc762ca85cc54f9ab934bd60',
} as const;

export const PLATFORM_WALLETS = {
  treasury: '0xa5bfb6c6e3085e7fd4b7328b52edda30ef683d68',
  operations: '0x2e4ccd9d1e14764575c99224684e4020d2eabd81',
  ricky_operator: '0x57f5049a2f30070d0654e6bc7dbe092cfaa77214',
} as const;

const HOUSE_AGENT_SET: Set<string> = new Set(Object.values(HOUSE_AGENT_WALLETS));
const PLATFORM_WALLET_SET: Set<string> = new Set(Object.values(PLATFORM_WALLETS));

const TEST_COPY_PATTERNS = [
  /\be2e\b/i,
  /\btest\b/i,
  /\bfeedback\s+test\b/i,
  /\bplatform\s+functionality\s+check\b/i,
  /\bverify\s+system\s+works\b/i,
];

const ONBOARDING_COPY_PATTERNS = [
  /\bonboarding\b/i,
  /\bintroduce\s+yourself\b/i,
];

export type AgentWalletKind = 'house_agent' | 'platform' | 'external' | 'unknown';
export type TaskOrigin = 'house_test' | 'onboarding' | 'moltgig_seed' | 'external' | 'unknown' | 'demo';

export interface ClassifiableTask {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  task_origin?: TaskOrigin | string | null;
  task_group?: string | null;
  tags?: string[] | null;
  requester_wallet?: string | null;
  worker_wallet?: string | null;
  chain_task_id?: number | string | null;
  reward_wei?: string | number | null;
  paid_transaction_confirmed?: boolean | null;
}

export interface TaskClassification {
  origin: TaskOrigin;
  requester_kind: AgentWalletKind;
  worker_kind: AgentWalletKind;
  is_house_agent_activity: boolean;
  is_platform_funded: boolean;
  is_onboarding: boolean;
  is_test: boolean;
  is_external_requester: boolean;
  is_external_worker: boolean;
  is_real_third_party_completion: boolean;
  is_paid_on_chain: boolean;
}

export function normalizeWallet(address?: string | null): string | null {
  return address ? address.toLowerCase() : null;
}

export function classifyWallet(address?: string | null): AgentWalletKind {
  const normalized = normalizeWallet(address);
  if (!normalized) return 'unknown';
  if (HOUSE_AGENT_SET.has(normalized)) return 'house_agent';
  if (PLATFORM_WALLET_SET.has(normalized)) return 'platform';
  return 'external';
}

function hasPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function hasTag(task: ClassifiableTask, tag: string): boolean {
  return Array.isArray(task.tags) && task.tags.some((item) => item.toLowerCase() === tag);
}

export function classifyTask(task: ClassifiableTask): TaskClassification {
  const title = task.title || '';
  const description = task.description || '';
  const combinedCopy = `${title}\n${description}`;
  const explicitOrigin = task.task_origin as TaskOrigin | null | undefined;
  const taskGroup = task.task_group?.toLowerCase() || null;
  const requesterKind = classifyWallet(task.requester_wallet);
  const workerKind = classifyWallet(task.worker_wallet);

  const isPlatformFunded = requesterKind === 'platform' || requesterKind === 'house_agent';
  const isHouseAgentActivity = requesterKind === 'house_agent' || workerKind === 'house_agent';
  const isExternalRequester = requesterKind === 'external';
  const isExternalWorker = workerKind === 'external';
  const copyHintsAreAuthoritative = isPlatformFunded || isHouseAgentActivity;

  const isOnboarding =
    explicitOrigin === 'onboarding' ||
    taskGroup === 'onboarding' ||
    hasTag(task, 'onboarding') ||
    (copyHintsAreAuthoritative && hasPattern(combinedCopy, ONBOARDING_COPY_PATTERNS));

  const isTest =
    explicitOrigin === 'house_test' ||
    taskGroup === 'test' ||
    hasTag(task, 'test') ||
    (copyHintsAreAuthoritative && hasPattern(combinedCopy, TEST_COPY_PATTERNS));

  let origin: TaskOrigin = 'unknown';
  if (explicitOrigin && explicitOrigin !== 'unknown' && explicitOrigin !== 'external') {
    origin = explicitOrigin;
  } else if (isTest || (requesterKind === 'house_agent' && workerKind === 'house_agent')) {
    origin = 'house_test';
  } else if (isOnboarding) {
    origin = 'onboarding';
  } else if (isPlatformFunded) {
    origin = 'moltgig_seed';
  } else if (isExternalRequester) {
    origin = 'external';
  }

  const isPaidOnChain = task.paid_transaction_confirmed === true;
  const isRealThirdPartyCompletion =
    task.status === 'completed' &&
    origin === 'external' &&
    isExternalRequester &&
    isExternalWorker &&
    !isTest &&
    !isOnboarding;

  return {
    origin,
    requester_kind: requesterKind,
    worker_kind: workerKind,
    is_house_agent_activity: isHouseAgentActivity,
    is_platform_funded: isPlatformFunded,
    is_onboarding: isOnboarding,
    is_test: isTest,
    is_external_requester: isExternalRequester,
    is_external_worker: isExternalWorker,
    is_real_third_party_completion: isRealThirdPartyCompletion,
    is_paid_on_chain: isPaidOnChain,
  };
}

export function addWei(a: string, b: string | number | null | undefined): string {
  return (BigInt(a || '0') + BigInt(b || '0')).toString();
}
