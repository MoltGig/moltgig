import { buildContractReconciliation } from '../src/services/contractReconciliation';

jest.mock('../src/services/contract', () => ({
  contractTaskStateToDbStatus: (state: number) => ({
    0: 'funded',
    1: 'accepted',
    2: 'accepted',
    3: 'submitted',
    4: 'disputed',
    5: 'completed',
    6: 'cancelled',
  }[state] || 'open'),
  contractService: {
    getTaskCounter: jest.fn(),
    getTask: jest.fn(),
  },
}));

const { contractService } = jest.requireMock('../src/services/contract');

describe('contract reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags resolved chain tasks that are missing confirmed payment transactions', async () => {
    contractService.getTaskCounter.mockResolvedValue(1);
    contractService.getTask.mockResolvedValue({
      state: 5,
      poster: '0x1111111111111111111111111111111111111111',
      worker: '0x2222222222222222222222222222222222222222',
      value: '1000',
    });

    const report = await buildContractReconciliation([
      {
        id: 'task-1',
        chain_task_id: 1,
        status: 'completed',
        reward_wei: '1000',
        requester_wallet: '0x1111111111111111111111111111111111111111',
        worker_wallet: '0x2222222222222222222222222222222222222222',
      },
    ]);

    expect(report.mismatches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: 'payment_transaction',
        db_task_id: 'task-1',
        chain_task_id: 1,
      }),
    ]));
    expect(report.summary.mismatches).toBe(1);
  });

  it('treats confirmed complete transactions as payment evidence', async () => {
    contractService.getTaskCounter.mockResolvedValue(1);
    contractService.getTask.mockResolvedValue({
      state: 5,
      poster: '0x1111111111111111111111111111111111111111',
      worker: '0x2222222222222222222222222222222222222222',
      value: '1000',
    });

    const report = await buildContractReconciliation([
      {
        id: 'task-1',
        chain_task_id: 1,
        status: 'completed',
        reward_wei: '1000',
        requester_wallet: '0x1111111111111111111111111111111111111111',
        worker_wallet: '0x2222222222222222222222222222222222222222',
      },
    ], [
      {
        task_id: 'task-1',
        tx_type: 'complete',
        status: 'confirmed',
      },
    ]);

    expect(report.mismatches).toHaveLength(0);
  });
});
