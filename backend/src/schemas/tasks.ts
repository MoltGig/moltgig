import { z } from 'zod';

export const taskStatusSchema = z.enum([
  'open',
  'funded',
  'accepted',
  'submitted',
  'completed',
  'disputed',
  'cancelled',
]);

export const taskOriginSchema = z.enum([
  'unknown',
  'house_test',
  'onboarding',
  'moltgig_seed',
  'external',
  'demo',
]);

export const reviewPolicySchema = z.enum([
  'requester_review',
  'ops_review',
  'auto_onboarding',
  'admin_review',
]);

export const proofRequirementTypeSchema = z.enum([
  'text',
  'url',
  'screenshot',
  'repo',
  'tx_hash',
  'file',
  'json',
]);

export const proofRequirementSchema = z.object({
  type: proofRequirementTypeSchema,
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean().default(true),
}).strict();

export const proofRequirementsSchema = z.array(proofRequirementSchema).max(10);

const baseCreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  category: z.string().max(50).optional(),
  reward_wei: z.string().regex(/^\d+$/, 'Must be a valid wei amount'),
  deadline: z.string().datetime().optional(),
  task_group: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
  proof_requirements: proofRequirementsSchema.default([]),
});

export const createTaskSchema = baseCreateTaskSchema.superRefine((value, ctx) => {
  if (value.task_group?.toLowerCase() === 'onboarding') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['task_group'],
      message: 'Onboarding tasks can only be created through admin seeding workflows',
    });
  }
});

export const adminCreateTaskSchema = baseCreateTaskSchema.extend({
  requester_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  task_origin: taskOriginSchema.optional(),
  review_policy: reviewPolicySchema.optional(),
  status: z.literal('open').default('open'),
});

export const listTasksSchema = z.object({
  status: taskStatusSchema.optional(),
  availability: z.enum(['available']).optional(),
  category: z.string().optional(),
  min_reward: z.string().optional(),
  max_reward: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['newest', 'oldest', 'reward_high', 'reward_low', 'deadline']).default('newest'),
  q: z.string().max(200).optional(),
  tag: z.string().max(30).optional(),
  tags: z.string().optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const submitWorkSchema = z.object({
  content: z.string().min(1).max(20000),
  attachments: z.array(z.string().min(1).max(2048)).max(10).default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type AdminCreateTaskInput = z.infer<typeof adminCreateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type ProofRequirement = z.infer<typeof proofRequirementSchema>;
