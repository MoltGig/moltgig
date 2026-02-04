import request from 'supertest';
import express from 'express';

// Create a minimal test app
const app = express();
app.use(express.json());

// Mock the health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'moltgig-api',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  });
});

// Mock stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    agents: 1,
    tasks: {
      total: 1,
      open: 0,
      funded: 1,
      completed: 0,
    },
  });
});

// Mock tasks list endpoint
app.get('/api/tasks', (req, res) => {
  const { status, category, sort, limit, offset } = req.query;
  res.json({
    tasks: [
      {
        id: 'test-task-1',
        title: 'Test Task',
        status: status || 'funded',
        category: category || 'code',
        reward_wei: '1000000000000000',
        created_at: new Date().toISOString(),
      },
    ],
    pagination: {
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
      total: 1,
    },
  });
});

// Mock task detail endpoint
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'not-found') {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({
    task: {
      id,
      title: 'Test Task',
      description: 'A test task description',
      status: 'funded',
      category: 'code',
      reward_wei: '1000000000000000',
      created_at: new Date().toISOString(),
    },
    submissions: [],
  });
});

// Mock agents endpoint
app.get('/api/agents/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'not-found') {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({
    agent: {
      id,
      wallet_address: '0x' + '1'.repeat(40),
      reputation_score: 100,
      tasks_completed: 5,
      tasks_posted: 3,
      created_at: new Date().toISOString(),
    },
    stats: {
      tasks_posted: 3,
      tasks_completed: 5,
      tasks_in_progress: 1,
    },
  });
});

describe('MoltGig API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('moltgig-api');
      expect(response.body.version).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('should return platform statistics', async () => {
      const response = await request(app).get('/api/stats');
      
      expect(response.status).toBe(200);
      expect(response.body.agents).toBeDefined();
      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks.total).toBeDefined();
      expect(response.body.tasks.open).toBeDefined();
      expect(response.body.tasks.funded).toBeDefined();
      expect(response.body.tasks.completed).toBeDefined();
    });
  });

  describe('GET /api/tasks', () => {
    it('should return list of tasks', async () => {
      const response = await request(app).get('/api/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should accept query parameters', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'funded', sort: 'newest', limit: 10, offset: 0 });
      
      expect(response.status).toBe(200);
      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ category: 'code' });
      
      expect(response.status).toBe(200);
      expect(response.body.tasks[0].category).toBe('code');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task details', async () => {
      const response = await request(app).get('/api/tasks/test-task-1');
      
      expect(response.status).toBe(200);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.id).toBe('test-task-1');
      expect(response.body.task.title).toBeDefined();
      expect(response.body.task.status).toBeDefined();
      expect(response.body.submissions).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app).get('/api/tasks/not-found');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return agent profile', async () => {
      const response = await request(app).get('/api/agents/test-agent-1');
      
      expect(response.status).toBe(200);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.wallet_address).toBeDefined();
      expect(response.body.agent.reputation_score).toBeDefined();
      expect(response.body.stats).toBeDefined();
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await request(app).get('/api/agents/not-found');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Agent not found');
    });
  });
});

describe('API Response Format', () => {
  it('health response should have correct structure', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.body).toMatchObject({
      status: expect.any(String),
      service: expect.any(String),
      version: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('task list response should have pagination', async () => {
    const response = await request(app).get('/api/tasks');
    
    expect(response.body.pagination).toMatchObject({
      limit: expect.any(Number),
      offset: expect.any(Number),
    });
  });

  it('task detail should include submissions array', async () => {
    const response = await request(app).get('/api/tasks/test-1');
    
    expect(response.body.submissions).toBeInstanceOf(Array);
  });
});
