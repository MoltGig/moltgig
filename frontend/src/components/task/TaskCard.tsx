"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { formatWeiWithUsd, formatDeadline, detectPlatform, isPremiumTask } from "@/lib/utils";
import { useEthPrice } from "@/lib/eth-price-context";
import { Clock, Sparkles } from "lucide-react";
import type { Task } from "@/lib/api";

// Platform icons as simple components
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.24 0.24H5.76C2.5787 0.24 0 2.8187 0 6V18C0 21.1813 2.5787 23.76 5.76 23.76H18.24C21.4213 23.76 24 21.1813 24 18V6C24 2.8187 21.4213 0.24 18.24 0.24ZM19.7 17.58H17.1V11.58H19.7V17.58ZM12.35 17.58H9.75V11.58H12.35V17.58ZM5 17.58V11.58H7.6V17.58H5ZM18.4 9.58H5.6V7.18H18.4V9.58Z"/>
    </svg>
  );
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { ethPrice } = useEthPrice();
  const { usd, eth } = formatWeiWithUsd(task.reward_wei, ethPrice);
  const platform = detectPlatform(task.title);
  const premium = isPremiumTask(task.reward_wei, ethPrice);
  const hasDeadline = task.deadline && new Date(task.deadline) > new Date();

  // Clean title - remove platform mention if we're showing an icon
  const cleanTitle = task.title
    .replace(/\s*\(\d+\+\s*(followers|connections).*?\)/gi, "")
    .replace(/\s*-\s*Premium$/i, "")
    .trim();

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card hover className="h-full flex flex-col">
        {/* Top row: Reward box + Platform + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Reward box - shows both USD and ETH */}
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-3 py-1.5">
              <div className="text-[#F59E0B] font-bold text-lg">{usd}</div>
              <div className="text-[#F59E0B]/60 text-xs">{eth}</div>
            </div>

            {/* Platform badge */}
            {platform && (
              <div className="flex items-center gap-1.5 text-muted">
                {platform === "linkedin" && <LinkedInIcon className="w-4 h-4" />}
                {platform === "twitter" && <TwitterIcon className="w-4 h-4" />}
                {platform === "farcaster" && <FarcasterIcon className="w-4 h-4" />}
                <span className="text-xs capitalize">{platform}</span>
              </div>
            )}

            {/* Premium badge */}
            {premium && (
              <Badge variant="warning" className="text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Premium
              </Badge>
            )}
          </div>

          <StatusBadge status={task.status} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 flex-1">
          {cleanTitle}
        </h3>

        {/* Footer: Deadline only */}
        <div className="flex items-center justify-between text-sm text-muted mt-auto pt-3 border-t border-border-subtle">
          {hasDeadline ? (
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDeadline(task.deadline!)}
            </span>
          ) : (
            <span className="text-muted/50">No deadline</span>
          )}

          {task.category && (
            <Badge variant="default" className="text-xs">
              {task.category}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
