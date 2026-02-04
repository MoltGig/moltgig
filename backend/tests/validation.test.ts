import { z } from 'zod';

// Validation schemas (copied from routes/tasks.ts for testing)
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  category: z.string().max(50).optional(),
  reward_wei: z.string().regex(/^\d+$/, 'Must be a valid wei amount'),
  deadline: z.string().datetime().optional(),
});

const listTasksSchema = z.object({
  status: z.enum(['open', 'funded', 'accepted', 'submitted', 'completed', 'disputed', 'cancelled']).optional(),
  category: z.string().optional(),
  min_reward: z.string().optional(),
  max_reward: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['newest', 'oldest', 'reward_high', 'reward_low', 'deadline']).default('newest'),
});

describe('Task Creation Validation', () => {
  describe('title field', () => {
    it('should accept valid title', () => {
      const result = createTaskSchema.safeParse({
        title: 'Valid Task Title',
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 characters', () => {
      const result = createTaskSchema.safeParse({
        title: 'a'.repeat(201),
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reward_wei field', () => {
    it('should accept valid wei amount', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept small wei amount', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '100',
      });
      expect(result.success).toBe(true);
    });

    it('should accept large wei amount', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '100000000000000000000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric wei', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: 'not-a-number',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative wei', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '-100',
      });
      expect(result.success).toBe(false);
    });

    it('should reject decimal wei', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '1.5',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('should accept with description', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        description: 'A detailed description',
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A detailed description');
      }
    });

    it('should accept with category', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        category: 'code',
        reward_wei: '1000000000000000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid deadline', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '1000000000000000',
        deadline: '2026-02-15T12:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid deadline format', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test',
        reward_wei: '1000000000000000',
        deadline: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Task List Query Validation', () => {
  describe('status filter', () => {
    it('should accept valid status values', () => {
      const statuses = ['open', 'funded', 'accepted', 'submitted', 'completed', 'disputed', 'cancelled'];
      statuses.forEach(status => {
        const result = listTasksSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = listTasksSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('pagination', () => {
    it('should use default limit of 20', () => {
      const result = listTasksSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept custom limit', () => {
      const result = listTasksSchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit over 100', () => {
      const result = listTasksSchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    it('should reject limit under 1', () => {
      const result = listTasksSchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('should use default offset of 0', () => {
      const result = listTasksSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });
  });

  describe('sort options', () => {
    it('should accept valid sort options', () => {
      const sorts = ['newest', 'oldest', 'reward_high', 'reward_low', 'deadline'];
      sorts.forEach(sort => {
        const result = listTasksSchema.safeParse({ sort });
        expect(result.success).toBe(true);
      });
    });

    it('should use default sort of newest', () => {
      const result = listTasksSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe('newest');
      }
    });

    it('should reject invalid sort option', () => {
      const result = listTasksSchema.safeParse({ sort: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
