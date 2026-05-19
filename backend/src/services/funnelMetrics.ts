import { addWei, classifyTask, classifyWallet, TaskOrigin } from '../utils/metricsClassification.js';

type CountMap = Record<string, number>;
type WeiMap = Record<string, string>;

interface TaskRow {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  task_origin?: string | null;
  task_group?: string | null;
  tags?: string[] | null;
  requester_wallet?: string | null;
  worker_wallet?: string | null;
  chain_task_id?: number | string | null;
  reward_wei?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
}

interface SubmissionRow {
  id: string;
  task_id: string;
  status?: string | null;
  created_at?: string | null;
}

interface AgentRow {
  id: string;
  wallet_address?: string | null;
  onboarded?: boolean | null;
  tasks_posted?: number | null;
  tasks_completed?: number | null;
}

interface TransactionRow {
  id: string;
  task_id?: string | null;
  tx_type?: string | null;
  amount_wei?: string | number | null;
  status?: string | null;
}

export interface FunnelMetricsInput {
  tasks: TaskRow[];
  submissions: SubmissionRow[];
  agents: AgentRow[];
  transactions: TransactionRow[];
  now?: Date;
}

export function createEmptyOriginMap(): Record<TaskOrigin, number> {
  return {
    house_test: 0,
    onboarding: 0,
    moltgig_seed: 0,
    external: 0,
    unknown: 0,
    demo: 0,
  };
}

function increment(map: CountMap, key: string, amount = 1) {
  map[key] = (map[key] || 0) + amount;
}

function addReward(map: WeiMap, key: string, reward: string | number | null | undefined) {
  map[key] = addWei(map[key] || '0', reward);
}

export function buildFunnelMetrics(input: FunnelMetricsInput) {
  const now = input.now || new Date();
  const twentyFourHoursAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const confirmedPaidTaskIds = new Set(
    input.transactions
      .filter((tx) =>
        tx.task_id &&
        ['complete', 'dispute_resolve'].includes(tx.tx_type || '') &&
        ['confirmed', 'success'].includes(tx.status || '')
      )
      .map((tx) => tx.task_id as string)
  );

  const tasksById = new Map(input.tasks.map((task) => [task.id, task]));
  const byOrigin = createEmptyOriginMap();
  const completedByOrigin = createEmptyOriginMap();
  const paidOnChainByOrigin = createEmptyOriginMap();
  const gmvByOriginWei: Record<TaskOrigin, string> = {
    house_test: '0',
    onboarding: '0',
    moltgig_seed: '0',
    external: '0',
    unknown: '0',
    demo: '0',
  };
  const statusByOrigin: Record<TaskOrigin, CountMap> = {
    house_test: {},
    onboarding: {},
    moltgig_seed: {},
    external: {},
    unknown: {},
    demo: {},
  };

  let realThirdPartyCompleted = 0;
  let paidRealThirdPartyCompleted = 0;
  let externalSubmissions = 0;
  let acceptedExternalSubmissions = 0;
  let externalOnboardingCompletions = 0;
  let staleFundedGigs = 0;

  const classifiedTasks = input.tasks.map((task) => {
    const classification = classifyTask({
      ...task,
      paid_transaction_confirmed: confirmedPaidTaskIds.has(task.id),
    });
    const origin = classification.origin;
    byOrigin[origin] += 1;
    increment(statusByOrigin[origin], task.status || 'unknown');
    addReward(gmvByOriginWei, origin, task.reward_wei);

    if (task.status === 'completed') {
      completedByOrigin[origin] += 1;
    }

    if (classification.is_paid_on_chain) {
      paidOnChainByOrigin[origin] += 1;
    }

    if (classification.is_real_third_party_completion) {
      realThirdPartyCompleted += 1;
      if (classification.is_paid_on_chain) {
        paidRealThirdPartyCompleted += 1;
      }
    }

    if (
      origin === 'onboarding' &&
      task.status === 'completed' &&
      classification.is_external_worker
    ) {
      externalOnboardingCompletions += 1;
    }

    if (task.status === 'funded' && task.created_at) {
      const createdAt = new Date(task.created_at).getTime();
      if (Number.isFinite(createdAt) && createdAt < twentyFourHoursAgo) {
        staleFundedGigs += 1;
      }
    }

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      reward_wei: task.reward_wei?.toString() || '0',
      chain_task_id: task.chain_task_id,
      classification,
    };
  });

  for (const submission of input.submissions) {
    const task = tasksById.get(submission.task_id);
    const classification = task ? classifyTask(task) : null;
    if (classification?.is_external_worker) {
      externalSubmissions += 1;
      if (submission.status === 'approved') {
        acceptedExternalSubmissions += 1;
      }
    }
  }

  const externalOnboardedAgents = input.agents.filter((agent) =>
    agent.onboarded && classifyWallet(agent.wallet_address) === 'external'
  ).length;
  externalOnboardingCompletions = Math.max(externalOnboardingCompletions, externalOnboardedAgents);

  const transactionStats = input.transactions.reduce(
    (acc, tx) => {
      increment(acc.by_type, tx.tx_type || 'unknown');
      increment(acc.by_status, tx.status || 'unknown');
      if (tx.amount_wei) {
        acc.amount_by_type_wei[tx.tx_type || 'unknown'] = addWei(
          acc.amount_by_type_wei[tx.tx_type || 'unknown'] || '0',
          tx.amount_wei
        );
      }
      return acc;
    },
    {
      total: input.transactions.length,
      by_type: {} as CountMap,
      by_status: {} as CountMap,
      amount_by_type_wei: {} as WeiMap,
    }
  );

  const agentCounterDrift = input.agents.map((agent) => {
    const postedActual = input.tasks.filter((task) => task.requester_wallet?.toLowerCase() === agent.wallet_address?.toLowerCase()).length;
    const completedActual = input.tasks.filter((task) => task.worker_wallet?.toLowerCase() === agent.wallet_address?.toLowerCase() && task.status === 'completed').length;
    return {
      agent_id: agent.id,
      wallet_address: agent.wallet_address,
      stored_tasks_posted: agent.tasks_posted || 0,
      actual_tasks_posted: postedActual,
      stored_tasks_completed: agent.tasks_completed || 0,
      actual_tasks_completed: completedActual,
      posted_delta: postedActual - (agent.tasks_posted || 0),
      completed_delta: completedActual - (agent.tasks_completed || 0),
    };
  }).filter((row) => row.posted_delta !== 0 || row.completed_delta !== 0);

  return {
    generated_at: now.toISOString(),
    headline: {
      real_third_party_paid_marketplace_completions: paidRealThirdPartyCompleted,
      real_third_party_completed_marketplace_gigs: realThirdPartyCompleted,
      external_onboarding_completions: externalOnboardingCompletions,
      external_submissions: externalSubmissions,
      accepted_external_submissions: acceptedExternalSubmissions,
      stale_funded_gigs: staleFundedGigs,
    },
    tasks: {
      total: input.tasks.length,
      by_origin: byOrigin,
      completed_by_origin: completedByOrigin,
      paid_on_chain_by_origin: paidOnChainByOrigin,
      status_by_origin: statusByOrigin,
      gmv_by_origin_wei: gmvByOriginWei,
    },
    submissions: {
      total: input.submissions.length,
      external_worker: externalSubmissions,
      approved_external_worker: acceptedExternalSubmissions,
    },
    agents: {
      total: input.agents.length,
      onboarded: input.agents.filter((agent) => agent.onboarded).length,
      counter_drift: agentCounterDrift,
    },
    transactions: transactionStats,
    samples: {
      real_third_party_completions: classifiedTasks.filter((task) => task.classification.is_real_third_party_completion),
      non_external_completions: classifiedTasks.filter((task) => task.status === 'completed' && !task.classification.is_real_third_party_completion),
    },
    definitions: {
      real_third_party_paid_marketplace_completion: 'Completed marketplace gig where requester and worker are external wallets, task is not onboarding/test/house-seeded, and a confirmed complete or worker-won dispute_resolve transaction exists.',
      real_third_party_completed_marketplace_gig: 'Completed marketplace gig where requester and worker are external wallets and task is not onboarding/test/house-seeded, whether paid on-chain or marked complete off-chain.',
    },
  };
}
