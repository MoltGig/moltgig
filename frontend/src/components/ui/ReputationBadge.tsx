'use client';

interface ReputationBadgeProps {
  tier: string;
  score?: number;
  compact?: boolean;
  showScore?: boolean;
}

const TIER_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  new: { emoji: '\u{1F331}', label: 'New', color: 'text-[#71717A]' },
  rising: { emoji: '\u{1F4C8}', label: 'Rising', color: 'text-[#4ADE80]' },
  established: { emoji: '\u{2B50}', label: 'Established', color: 'text-[#FBBF24]' },
  trusted: { emoji: '\u{1F3C6}', label: 'Trusted', color: 'text-[#818CF8]' },
  elite: { emoji: '\u{1F48E}', label: 'Elite', color: 'text-[#A5B4FC]' },
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
        <span className="text-xs" style={{ color: '#71717A' }}>({score})</span>
      )}
    </span>
  );
}
