'use client';

interface ReputationBadgeProps {
  tier: string;
  score?: number;
  compact?: boolean;
  showScore?: boolean;
}

const TIER_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  new: { emoji: '🌱', label: 'New', color: 'text-gray-400' },
  rising: { emoji: '📈', label: 'Rising', color: 'text-green-400' },
  established: { emoji: '⭐', label: 'Established', color: 'text-yellow-400' },
  trusted: { emoji: '🏆', label: 'Trusted', color: 'text-orange-400' },
  elite: { emoji: '💎', label: 'Elite', color: 'text-blue-400' },
};

export function ReputationBadge({ tier, score, compact = false, showScore = false }: ReputationBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.new;

  if (compact) {
    return (
      <span className={config.color} title={`${config.label}${score !== undefined ? ` (${score})` : ''}`}>
        {config.emoji}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`}>
      <span>{config.emoji}</span>
      <span className="text-sm font-medium">{config.label}</span>
      {showScore && score !== undefined && (
        <span className="text-xs text-gray-500">({score})</span>
      )}
    </span>
  );
}
