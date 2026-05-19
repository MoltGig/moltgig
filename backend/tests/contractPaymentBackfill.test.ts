const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('contract payment event backfill', () => {
  const queryFilter = jest.fn();
  const getTask = jest.fn();
  const getBlockNumber = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.CONTRACT_DEPLOY_BLOCK = '90';
    process.env.ESCROW_EVENT_BACKFILL_CHUNK_SIZE = '10';

    jest.doMock('../src/config/supabase', () => ({
      __esModule: true,
      default: { from: jest.fn() },
    }));

    jest.doMock('ethers', () => ({
      ethers: {
        ZeroAddress: ZERO_ADDRESS,
        JsonRpcProvider: jest.fn(() => ({ getBlockNumber })),
      },
      JsonRpcProvider: jest.fn(() => ({ getBlockNumber })),
      Wallet: jest.fn(),
      Contract: jest.fn(() => ({
        filters: {
          TaskCompleted: jest.fn((taskId) => ({ name: 'TaskCompleted', taskId })),
          DisputeResolved: jest.fn((taskId) => ({ name: 'DisputeResolved', taskId })),
        },
        queryFilter,
        getTask,
      })),
    }));
  });

  afterEach(() => {
    delete process.env.CONTRACT_DEPLOY_BLOCK;
    delete process.env.ESCROW_EVENT_BACKFILL_CHUNK_SIZE;
  });

  it('classifies worker-won disputes from the chain worker when the DB worker is missing', async () => {
    const worker = '0x2222222222222222222222222222222222222222';
    getBlockNumber.mockResolvedValue(120);
    getTask.mockResolvedValue({
      id: BigInt(7),
      poster: '0x1111111111111111111111111111111111111111',
      worker,
      description: '',
      value: BigInt(1000),
      deadline: BigInt(0),
      state: 5,
      feeAmount: BigInt(30),
      deliverable: '',
      posterApproved: true,
      workerApproved: true,
    });
    queryFilter.mockImplementation(async (filter) => {
      if (filter.name === 'TaskCompleted') return [];
      return [{
        transactionHash: '0x' + 'a'.repeat(64),
        blockNumber: 119,
        index: 4,
        args: {
          winner: worker,
          fee: BigInt(30),
        },
      }];
    });

    const { ContractService } = await import('../src/services/contract');
    const service = new ContractService();
    const event = await service.findPaymentEventForTask(7, null);

    expect(event).toEqual(expect.objectContaining({
      txType: 'dispute_resolve',
      toAddress: worker,
      feeWei: '30',
    }));
    expect(getTask).toHaveBeenCalledWith(7);
  });

  it('stops scanning once the latest matching chunk is found', async () => {
    getBlockNumber.mockResolvedValue(120);
    getTask.mockResolvedValue({
      id: BigInt(7),
      poster: '0x1111111111111111111111111111111111111111',
      worker: ZERO_ADDRESS,
      description: '',
      value: BigInt(1000),
      deadline: BigInt(0),
      state: 5,
      feeAmount: BigInt(30),
      deliverable: '',
      posterApproved: true,
      workerApproved: true,
    });
    queryFilter.mockImplementation(async (filter, startBlock, endBlock) => {
      if (filter.name === 'TaskCompleted' && startBlock === 111 && endBlock === 120) {
        return [{
          transactionHash: '0x' + 'b'.repeat(64),
          blockNumber: 118,
          index: 1,
          args: {
            payment: BigInt(970),
            fee: BigInt(30),
          },
        }];
      }
      return [];
    });

    const { ContractService } = await import('../src/services/contract');
    const service = new ContractService();
    const event = await service.findPaymentEventForTask(7, null);

    expect(event).toEqual(expect.objectContaining({
      txType: 'complete',
      txHash: '0x' + 'b'.repeat(64),
      amountWei: '970',
      feeWei: '30',
    }));
    expect(queryFilter).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TaskCompleted' }),
      111,
      120
    );
    expect(queryFilter).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TaskCompleted' }),
      101,
      110
    );
  });
});
