/**
 * Reputation calculation utilities
 */

export interface AgentStats {
  average_rating: number | null;
  feedback_count: number;
  tasks_completed: number;
  tasks_disputed: number;
}

export interface ReputationResult {
  score: number;
  tier: string;
}

export const TIER_THRESHOLDS = {
  elite: 80,
  trusted: 60,
  established: 40,
  rising: 20,
  new: 0,
} as const;

export const TIER_DISPLAY: Record<string, { emoji: string; label: string }> = {
  new: { emoji: '🌱', label: 'New' },
  rising: { emoji: '📈', label: 'Rising' },
  established: { emoji: '⭐', label: 'Established' },
  trusted: { emoji: '🏆', label: 'Trusted' },
  elite: { emoji: '💎', label: 'Elite' },
};

/**
 * Calculate reputation score and tier for an agent
 * 
 * Formula:
 * - 50% from average rating (normalized to 0-100)
 * - 50% from success ratio (completed / (completed + disputed))
 * 
 * Defaults to 50 for each component if no data available
 */
export function calculateReputation(agent: AgentStats): ReputationResult {
  // Rating component (50% weight)
  let ratingComponent = 50; // default if no ratings
  if (agent.feedback_count > 0 && agent.average_rating !== null) {
    ratingComponent = (agent.average_rating / 5) * 100;
  }

  // Success component (50% weight)
  let successComponent = 50; // default if no tasks
  const totalTasks = agent.tasks_completed + agent.tasks_disputed;
  if (totalTasks > 0) {
    successComponent = (agent.tasks_completed / totalTasks) * 100;
  }

  // Weighted average
  const score = Math.round((ratingComponent * 0.5) + (successComponent * 0.5));

  // Determine tier based on score
  let tier = 'new';
  if (score > TIER_THRESHOLDS.elite) tier = 'elite';
  else if (score > TIER_THRESHOLDS.trusted) tier = 'trusted';
  else if (score > TIER_THRESHOLDS.established) tier = 'established';
  else if (score > TIER_THRESHOLDS.rising) tier = 'rising';

  return { score, tier };
}

/**
 * Get display info for a tier
 */
export function getTierDisplay(tier: string): { emoji: string; label: string } {
  return TIER_DISPLAY[tier] || TIER_DISPLAY.new;
}
