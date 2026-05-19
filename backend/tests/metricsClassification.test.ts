import { adminCreateTaskSchema } from '../src/schemas/tasks';
import { buildFunnelMetrics } from '../src/services/funnelMetrics';
import { classifyTask, classifyWallet } from '../src/utils/metricsClassification';

describe('metrics classification', () => {
  it('classifies known house and platform wallets', () => {
    expect(classifyWallet('0x491cfD950cD82BB3878860392a8e807D3A41d434')).toBe('house_agent');
    expect(classifyWallet('0x2E4CCd9d1E14764575C99224684E4020D2eaBd81')).toBe('platform');
    expect(classifyWallet('0x8cd1031f836633f8cea5b0e68b2cbbc7c9747e96')).toBe('external');
    expect(classifyWallet(null)).toBe('unknown');
  });

  it('does not count onboarding as a real third-party completion', () => {
    const classification = classifyTask({
      title: 'MoltGig Onboarding: Introduce Yourself',
      status: 'completed',
      task_group: 'onboarding',
      requester_wallet: '0x2E4CCd9d1E14764575C99224684E4020D2eaBd81',
      worker_wallet: '0x8cd1031f836633f8cea5b0e68b2cbbc7c9747e96',
    });

    expect(classification.origin).toBe('onboarding');
    expect(classification.is_real_third_party_completion).toBe(false);
  });

  it('does not count house-agent tests as real third-party completions', () => {
    const classification = classifyTask({
      title: 'Feedback test - verify system works',
      status: 'completed',
      chain_task_id: 43,
      requester_wallet: '0x491cfD950cD82BB3878860392a8e807D3A41d434',
      worker_wallet: '0xa1caa2416a6d703347dc24b5fea5a823ae171b3e',
    });

    expect(classification.origin).toBe('house_test');
    expect(classification.is_paid_on_chain).toBe(false);
    expect(classification.is_real_third_party_completion).toBe(false);
  });

  it('only treats payment as on-chain paid with confirmed payment evidence', () => {
    const classification = classifyTask({
      title: 'Audit a public GitHub repository',
      status: 'completed',
      chain_task_id: 44,
      paid_transaction_confirmed: true,
      requester_wallet: '0x1111111111111111111111111111111111111111',
      worker_wallet: '0x2222222222222222222222222222222222222222',
    });

    expect(classification.is_paid_on_chain).toBe(true);
  });

  it('counts an external paid completion only when both sides are external', () => {
    const classification = classifyTask({
      title: 'Audit a public GitHub repository',
      status: 'completed',
      chain_task_id: 44,
      requester_wallet: '0x1111111111111111111111111111111111111111',
      worker_wallet: '0x2222222222222222222222222222222222222222',
    });

    expect(classification.origin).toBe('external');
    expect(classification.is_real_third_party_completion).toBe(true);
  });

  it('does not demote external gigs just because their copy mentions testing', () => {
    const classification = classifyTask({
      title: 'Test the integration against the public API',
      status: 'completed',
      requester_wallet: '0x1111111111111111111111111111111111111111',
      worker_wallet: '0x2222222222222222222222222222222222222222',
    });

    expect(classification.origin).toBe('external');
    expect(classification.is_test).toBe(false);
    expect(classification.is_real_third_party_completion).toBe(true);
  });

  it('uses persisted non-external task_origin as an authoritative demotion', () => {
    const classification = classifyTask({
      title: 'External-looking seeded gig',
      status: 'completed',
      task_origin: 'moltgig_seed',
      paid_transaction_confirmed: true,
      requester_wallet: '0x1111111111111111111111111111111111111111',
      worker_wallet: '0x2222222222222222222222222222222222222222',
    });

    expect(classification.origin).toBe('moltgig_seed');
    expect(classification.is_real_third_party_completion).toBe(false);
  });

  it('keeps admin-created seed tasks open until real escrow funding is confirmed', () => {
    expect(() => adminCreateTaskSchema.parse({
      title: 'Seeded gig',
      reward_wei: '1000',
      status: 'funded',
    })).toThrow();
  });
});

describe('funnel metrics', () => {
  it('segments real completions from onboarding and house tests', () => {
    const metrics = buildFunnelMetrics({
      now: new Date('2026-05-19T12:00:00.000Z'),
      agents: [
        {
          id: 'a1',
          wallet_address: '0x491cfD950cD82BB3878860392a8e807D3A41d434',
          tasks_posted: 1,
          tasks_completed: 0,
        },
        {
          id: 'a2',
          wallet_address: '0xa1caa2416a6d703347dc24b5fea5a823ae171b3e',
          tasks_posted: 0,
          tasks_completed: 1,
        },
        {
          id: 'a3',
          wallet_address: '0x1111111111111111111111111111111111111111',
          onboarded: true,
          tasks_posted: 1,
          tasks_completed: 0,
        },
        {
          id: 'a4',
          wallet_address: '0x2222222222222222222222222222222222222222',
          onboarded: true,
          tasks_posted: 0,
          tasks_completed: 1,
        },
      ],
      tasks: [
        {
          id: 'house-test',
          title: 'E2E Test Task - Automated',
          status: 'completed',
          chain_task_id: 2,
          requester_wallet: '0x491cfD950cD82BB3878860392a8e807D3A41d434',
          worker_wallet: '0xa1caa2416a6d703347dc24b5fea5a823ae171b3e',
          reward_wei: '100',
        },
        {
          id: 'onboarding',
          title: 'MoltGig Onboarding: Introduce Yourself',
          status: 'completed',
          task_group: 'onboarding',
          requester_wallet: '0x2E4CCd9d1E14764575C99224684E4020D2eaBd81',
          worker_wallet: '0x2222222222222222222222222222222222222222',
          reward_wei: '100',
        },
        {
          id: 'external',
          title: 'Audit a public GitHub repository',
          status: 'completed',
          task_origin: 'external',
          chain_task_id: 44,
          requester_wallet: '0x1111111111111111111111111111111111111111',
          worker_wallet: '0x2222222222222222222222222222222222222222',
          reward_wei: '100',
        },
        {
          id: 'seeded-explicit',
          title: 'Seeded but external wallets',
          status: 'completed',
          task_origin: 'moltgig_seed',
          chain_task_id: 45,
          requester_wallet: '0x3333333333333333333333333333333333333333',
          worker_wallet: '0x4444444444444444444444444444444444444444',
          reward_wei: '100',
        },
      ],
      submissions: [
        { id: 's1', task_id: 'onboarding', status: 'approved' },
        { id: 's2', task_id: 'external', status: 'approved' },
      ],
      transactions: [
        { id: 't1', task_id: 'house-test', tx_type: 'complete', amount_wei: '100', status: 'confirmed' },
        { id: 't2', task_id: 'external', tx_type: 'complete', amount_wei: '100', status: 'confirmed' },
        { id: 't3', task_id: 'seeded-explicit', tx_type: 'complete', amount_wei: '100', status: 'confirmed' },
      ],
    });

    expect(metrics.headline.real_third_party_paid_marketplace_completions).toBe(1);
    expect(metrics.headline.external_onboarding_completions).toBe(2);
    expect(metrics.tasks.completed_by_origin.house_test).toBe(1);
    expect(metrics.tasks.completed_by_origin.onboarding).toBe(1);
    expect(metrics.tasks.completed_by_origin.external).toBe(1);
    expect(metrics.tasks.completed_by_origin.moltgig_seed).toBe(1);
  });

  it('does not count requester-won dispute refunds as paid completions', () => {
    const metrics = buildFunnelMetrics({
      now: new Date('2026-05-19T12:00:00.000Z'),
      agents: [],
      submissions: [],
      tasks: [
        {
          id: 'requester-won-dispute',
          title: 'External disputed gig',
          status: 'cancelled',
          chain_task_id: 77,
          requester_wallet: '0x1111111111111111111111111111111111111111',
          worker_wallet: '0x2222222222222222222222222222222222222222',
          reward_wei: '100',
        },
      ],
      transactions: [
        {
          id: 'refund-1',
          task_id: 'requester-won-dispute',
          tx_type: 'refund',
          amount_wei: '100',
          status: 'confirmed',
        },
      ],
    });

    expect(metrics.headline.real_third_party_paid_marketplace_completions).toBe(0);
    expect(metrics.tasks.paid_on_chain_by_origin.external).toBe(0);
  });
});
