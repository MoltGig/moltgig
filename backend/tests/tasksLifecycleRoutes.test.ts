import express from 'express';
import request from 'supertest';

const requesterAgent = {
  id: 'requester-id',
  wallet_address: '0x1111111111111111111111111111111111111111',
  tasks_posted: 1,
  tasks_completed: 0,
  tasks_disputed: 0,
  onboarded: true,
};

const workerAgent = {
  id: 'worker-id',
  wallet_address: '0x2222222222222222222222222222222222222222',
  tasks_posted: 0,
  tasks_completed: 0,
  tasks_disputed: 0,
  skills_earned: [],
  onboarded: true,
};

const agents = new Map([
  [requesterAgent.id, { ...requesterAgent }],
  [workerAgent.id, { ...workerAgent }],
]);

const tasks = new Map<string, Record<string, any>>();
const submissions: Array<Record<string, any>> = [];
const transactions: Array<Record<string, any>> = [];

function resetData() {
  agents.set(requesterAgent.id, { ...requesterAgent });
  agents.set(workerAgent.id, { ...workerAgent });
  submissions.length = 0;
  transactions.length = 0;
  tasks.clear();
  tasks.set('task-1', {
    id: 'task-1',
    requester_id: requesterAgent.id,
    worker_id: null,
    title: 'Test lifecycle task',
    description: 'Submit a URL',
    category: 'code',
    reward_wei: '1000',
    status: 'funded',
    task_group: null,
    proof_requirements: [{ type: 'url', label: 'Proof URL' }],
  });
}

function getRows(table: string) {
  if (table === 'tasks') return Array.from(tasks.values());
  if (table === 'agents') return Array.from(agents.values());
  if (table === 'submissions') return submissions;
  if (table === 'transactions') return transactions;
  return [];
}

class QueryBuilder {
  private filters: Array<{ column: string; value: any }> = [];
  private operation: 'select' | 'insert' | 'update' = 'select';
  private payload: any;

  constructor(private table: string) {}

  select(..._args: any[]) {
    return this;
  }

  insert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, value: values });
    return this;
  }

  order(..._args: any[]) {
    return this;
  }

  limit(..._args: any[]) {
    return this;
  }

  private matches(row: Record<string, any>) {
    return this.filters.every(({ column, value }) => {
      if (Array.isArray(value)) return value.includes(row[column]);
      return row[column] === value;
    });
  }

  private applyInsert() {
    const row = {
      id: this.payload.id || `${this.table}-${getRows(this.table).length + 1}`,
      created_at: new Date('2026-05-19T00:00:00.000Z').toISOString(),
      ...this.payload,
    };

    if (this.table === 'tasks') tasks.set(row.id, row);
    if (this.table === 'agents') agents.set(row.id, row);
    if (this.table === 'submissions') submissions.push(row);
    if (this.table === 'transactions') transactions.push(row);

    return row;
  }

  private applyUpdate() {
    const rows = getRows(this.table).filter((row) => this.matches(row));
    for (const row of rows) {
      Object.assign(row, this.payload);
    }
    return rows[0] || null;
  }

  private applySelect() {
    return getRows(this.table).filter((row) => this.matches(row))[0] || null;
  }

  async single() {
    if (this.operation === 'insert') return { data: this.applyInsert(), error: null };
    if (this.operation === 'update') return { data: this.applyUpdate(), error: null };
    return { data: this.applySelect(), error: null };
  }

  async execute() {
    if (this.operation === 'insert') return { data: this.applyInsert(), error: null };
    if (this.operation === 'update') return { data: this.applyUpdate(), error: null };
    return { data: getRows(this.table).filter((row) => this.matches(row)), error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

jest.mock('../src/config/supabase', () => ({
  __esModule: true,
  default: {
    from: (table: string) => new QueryBuilder(table),
  },
  supabase: {
    from: (table: string) => new QueryBuilder(table),
  },
}));

jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    const role = req.headers['x-test-agent'] || 'worker';
    req.agent = role === 'requester' ? agents.get(requesterAgent.id) : agents.get(workerAgent.id);
    req.wallet_address = req.agent.wallet_address;
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/notifications/notificationService', () => ({
  notificationService: {
    notify: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockGetTask = jest.fn();
const mockVerifyFunding = jest.fn();

jest.mock('../src/services/contract', () => ({
  __esModule: true,
  default: {
    getTask: (...args: any[]) => mockGetTask(...args),
    verifyTaskPostedTransaction: (...args: any[]) => mockVerifyFunding(...args),
    confirmTransaction: jest.fn(),
  },
  contractService: {
    getTask: (...args: any[]) => mockGetTask(...args),
    verifyTaskPostedTransaction: (...args: any[]) => mockVerifyFunding(...args),
    confirmTransaction: jest.fn(),
  },
  contractTaskStateToDbStatus: (state: number) => {
    if (state === 1 || state === 2) return 'accepted';
    if (state === 3) return 'submitted';
    if (state === 4) return 'disputed';
    if (state === 5) return 'completed';
    return 'funded';
  },
}));

import tasksRouter from '../src/routes/tasks';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tasks', tasksRouter);
  return app;
}

describe('task lifecycle route handlers', () => {
  beforeEach(() => {
    resetData();
    mockGetTask.mockReset();
    mockVerifyFunding.mockReset();
  });

  it('accepts a funded task for an onboarded worker', async () => {
    const response = await request(createApp())
      .post('/api/tasks/task-1/accept')
      .set('x-test-agent', 'worker');

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('accepted');
    expect(response.body.task.worker_id).toBe(workerAgent.id);
  });

  it('accepts an open onboarding task', async () => {
    tasks.get('task-1')!.status = 'open';
    tasks.get('task-1')!.task_group = 'onboarding';

    const response = await request(createApp())
      .post('/api/tasks/task-1/accept')
      .set('x-test-agent', 'worker');

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('accepted');
    expect(response.body.task.worker_id).toBe(workerAgent.id);
  });

  it('requires escrow claim before accepting a chain-backed task in the DB', async () => {
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 0, worker: '0x0000000000000000000000000000000000000000' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/accept')
      .set('x-test-agent', 'worker');

    expect(response.status).toBe(409);
    expect(tasks.get('task-1')!.status).toBe('funded');
    expect(tasks.get('task-1')!.worker_id).toBeNull();
  });

  it('treats an already synced escrow claim as idempotent accept success', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 1, worker: workerAgent.wallet_address });

    const response = await request(createApp())
      .post('/api/tasks/task-1/accept')
      .set('x-test-agent', 'worker');

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('already synced');
    expect(response.body.task.status).toBe('accepted');
  });

  it('rejects submissions missing required proof', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({ content: 'Done, but no URL.' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required proof');
    expect(response.body.missing_requirements).toEqual([{ type: 'url', label: 'Proof URL' }]);
  });

  it('submits work when proof requirements are satisfied', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({ content: 'Done: https://example.com/result' });

    expect(response.status).toBe(201);
    expect(response.body.submission.status).toBe('pending');
    expect(tasks.get('task-1')!.status).toBe('submitted');
  });

  it('submits chain-backed work after submitWork is synced on-chain', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 3, worker: workerAgent.wallet_address });

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({ content: 'Done: https://example.com/result' });

    expect(response.status).toBe(201);
    expect(response.body.submission.status).toBe('pending');
    expect(response.body.submission.content).toContain('https://example.com/result');
    expect(tasks.get('task-1')!.status).toBe('submitted');
  });

  it('rejects chain-backed DB submission if the synced worker does not match caller', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({
      state: 3,
      worker: '0x3333333333333333333333333333333333333333',
    });

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({ content: 'Done: https://example.com/result' });

    expect(response.status).toBe(409);
    expect(submissions).toHaveLength(0);
    expect(tasks.get('task-1')!.status).toBe('accepted');
  });

  it('stores attachment proof when screenshot requirements are satisfied', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.proof_requirements = [
      { type: 'screenshot', label: 'Screenshot proof' },
      { type: 'text', label: 'Summary' },
    ];

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({
        content: 'QA completed and screenshot attached.',
        attachments: ['https://example.com/screenshot.png'],
      });

    expect(response.status).toBe(201);
    expect(response.body.submission.attachments).toEqual(['https://example.com/screenshot.png']);
    expect(tasks.get('task-1')!.status).toBe('submitted');
  });

  it('requires escrow submitWork before submitting a chain-backed task in the DB', async () => {
    tasks.get('task-1')!.status = 'accepted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 1, worker: workerAgent.wallet_address });

    const response = await request(createApp())
      .post('/api/tasks/task-1/submit')
      .set('x-test-agent', 'worker')
      .send({ content: 'Done: https://example.com/result' });

    expect(response.status).toBe(409);
    expect(submissions).toHaveLength(0);
    expect(tasks.get('task-1')!.status).toBe('accepted');
  });

  it('rejects a submission and reopens the task', async () => {
    tasks.get('task-1')!.status = 'submitted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.accepted_at = '2026-05-19T00:00:00.000Z';
    submissions.push({ id: 'submission-1', task_id: 'task-1', worker_id: workerAgent.id, status: 'pending' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/reject')
      .set('x-test-agent', 'requester')
      .send({ feedback: 'Missing screenshot', action: 'reject' });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('funded');
    expect(response.body.task.worker_id).toBeNull();
    expect(submissions[0].status).toBe('rejected');
  });

  it('does not reopen an escrow-backed task with a DB-only rejection', async () => {
    tasks.get('task-1')!.status = 'submitted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    submissions.push({ id: 'submission-1', task_id: 'task-1', worker_id: workerAgent.id, status: 'pending' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/reject')
      .set('x-test-agent', 'requester')
      .send({ feedback: 'Wrong worker for escrow claim', action: 'reject' });

    expect(response.status).toBe(409);
    expect(tasks.get('task-1')!.status).toBe('submitted');
    expect(tasks.get('task-1')!.worker_id).toBe(workerAgent.id);
    expect(submissions[0].status).toBe('pending');
  });

  it('requests revision and keeps the same worker assigned', async () => {
    tasks.get('task-1')!.status = 'submitted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    submissions.push({ id: 'submission-1', task_id: 'task-1', worker_id: workerAgent.id, status: 'pending' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/reject')
      .set('x-test-agent', 'requester')
      .send({ feedback: 'Add the URL', action: 'revision_requested' });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('accepted');
    expect(response.body.task.worker_id).toBe(workerAgent.id);
    expect(submissions[0].status).toBe('revision_requested');
  });

  it('completes submitted work and approves pending submission', async () => {
    tasks.get('task-1')!.status = 'submitted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    submissions.push({ id: 'submission-1', task_id: 'task-1', worker_id: workerAgent.id, status: 'pending' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/complete')
      .set('x-test-agent', 'requester');

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('completed');
    expect(submissions[0].status).toBe('approved');
    expect(agents.get(workerAgent.id)!.tasks_completed).toBe(1);
  });

  it('requires chain-completed escrow state and does not double-count worker stats', async () => {
    tasks.get('task-1')!.status = 'submitted';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    submissions.push({ id: 'submission-1', task_id: 'task-1', worker_id: workerAgent.id, status: 'pending' });
    mockGetTask.mockResolvedValueOnce({ state: 5 });

    const response = await request(createApp())
      .post('/api/tasks/task-1/complete')
      .set('x-test-agent', 'requester');

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('completed');
    expect(submissions[0].status).toBe('approved');
    expect(agents.get(workerAgent.id)!.tasks_completed).toBe(0);
  });

  it('treats an already synced escrow completion as idempotent complete success', async () => {
    tasks.get('task-1')!.status = 'completed';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 5 });

    const response = await request(createApp())
      .post('/api/tasks/task-1/complete')
      .set('x-test-agent', 'requester');

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('already synced');
    expect(agents.get(workerAgent.id)!.tasks_completed).toBe(0);
  });

  it('treats an already synced escrow dispute as idempotent dispute success', async () => {
    tasks.get('task-1')!.status = 'disputed';
    tasks.get('task-1')!.worker_id = workerAgent.id;
    tasks.get('task-1')!.chain_task_id = 44;
    mockGetTask.mockResolvedValueOnce({ state: 4 });

    const response = await request(createApp())
      .post('/api/tasks/task-1/dispute')
      .set('x-test-agent', 'worker')
      .send({ reason: 'Already raised on-chain' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Dispute was already synced.');
    expect(agents.get(workerAgent.id)!.tasks_disputed).toBe(0);
  });

  it('rejects public onboarding task creation', async () => {
    const response = await request(createApp())
      .post('/api/tasks')
      .set('x-test-agent', 'requester')
      .send({
        title: 'MoltGig Onboarding: Introduce Yourself',
        description: 'Introduce yourself',
        reward_wei: '1000',
        task_group: 'onboarding',
      });

    expect(response.status).toBe(400);
  });

  it('rejects funding when the verified chain task is already linked elsewhere', async () => {
    tasks.get('task-1')!.status = 'open';
    tasks.set('task-2', {
      ...tasks.get('task-1')!,
      id: 'task-2',
      chain_task_id: 44,
      status: 'funded',
    });
    mockVerifyFunding.mockResolvedValueOnce({ chainTaskId: 44, blockNumber: 123 });

    const response = await request(createApp())
      .post('/api/tasks/task-1/fund')
      .set('x-test-agent', 'requester')
      .send({ tx_hash: '0x' + 'a'.repeat(64), chain_task_id: 44 });

    expect(response.status).toBe(409);
    expect(tasks.get('task-1')!.status).toBe('open');
    expect(tasks.get('task-1')!.chain_task_id).toBeUndefined();
  });

  it('treats a repeated same-task funding callback as idempotent success', async () => {
    tasks.get('task-1')!.status = 'funded';
    tasks.get('task-1')!.chain_task_id = 44;
    transactions.push({ id: 'tx-1', task_id: 'task-1', tx_hash: '0x' + 'b'.repeat(64), tx_type: 'fund' });

    const response = await request(createApp())
      .post('/api/tasks/task-1/fund')
      .set('x-test-agent', 'requester')
      .send({ tx_hash: '0x' + 'b'.repeat(64), chain_task_id: 44 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Task funding was already recorded');
    expect(transactions).toHaveLength(1);
  });
});
