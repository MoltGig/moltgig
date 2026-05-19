import {
  type ProofRequirement,
  proofRequirementsSchema,
  type reviewPolicySchema,
  type taskOriginSchema,
} from '../schemas/tasks.js';
import { classifyTask, classifyWallet } from '../utils/metricsClassification.js';
import { z } from 'zod';

type TaskOrigin = z.infer<typeof taskOriginSchema>;
type ReviewPolicy = z.infer<typeof reviewPolicySchema>;

interface OriginInput {
  title?: string | null;
  description?: string | null;
  task_group?: string | null;
  tags?: string[] | null;
}

export function inferTaskOrigin(input: OriginInput, requesterWallet?: string | null): TaskOrigin {
  const requesterKind = classifyWallet(requesterWallet);
  const classification = classifyTask({
    title: input.title,
    description: input.description,
    task_group: input.task_group,
    tags: input.tags,
    requester_wallet: requesterWallet,
  });

  if (classification.origin !== 'unknown') {
    return classification.origin;
  }

  if (requesterKind === 'platform' || requesterKind === 'house_agent') {
    return 'moltgig_seed';
  }

  return requesterKind === 'external' ? 'external' : 'unknown';
}

export function defaultReviewPolicyForOrigin(origin: TaskOrigin): ReviewPolicy {
  if (origin === 'onboarding') return 'auto_onboarding';
  if (origin === 'moltgig_seed' || origin === 'house_test' || origin === 'demo') return 'ops_review';
  return 'requester_review';
}

export interface ProofValidationResult {
  valid: boolean;
  missing: Array<{ type: ProofRequirement['type']; label: string }>;
}

function requirementLabel(requirement: ProofRequirement): string {
  return requirement.label || requirement.description || requirement.type;
}

function allSubmissionText(content: string, attachments: string[]): string {
  return [content, ...attachments].join('\n');
}

export function validateSubmissionProof(
  rawRequirements: unknown,
  content: string,
  attachments: string[] = [],
): ProofValidationResult {
  const parsed = proofRequirementsSchema.safeParse(rawRequirements || []);
  if (!parsed.success) {
    return { valid: true, missing: [] };
  }

  const text = allSubmissionText(content, attachments);
  const missing = parsed.data
    .filter((requirement) => requirement.required !== false)
    .filter((requirement) => {
      switch (requirement.type) {
        case 'text':
          return content.trim().length === 0;
        case 'url':
          return !/https?:\/\/\S+/i.test(text);
        case 'repo':
          return !/(github\.com|gitlab\.com|bitbucket\.org)\/\S+/i.test(text);
        case 'screenshot':
        case 'file':
          return attachments.length === 0;
        case 'tx_hash':
          return !/0x[a-fA-F0-9]{64}/.test(text);
        case 'json':
          try {
            JSON.parse(content);
            return false;
          } catch {
            return true;
          }
      }
    })
    .map((requirement) => ({
      type: requirement.type,
      label: requirementLabel(requirement),
    }));

  return {
    valid: missing.length === 0,
    missing,
  };
}
