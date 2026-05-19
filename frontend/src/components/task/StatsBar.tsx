"use client";

import { useEffect, useState } from "react";
import { Coins, Briefcase, Users, CheckCircle } from "lucide-react";
import api, { type StatsResponse } from "@/lib/api";

export function StatsBar() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="bg-surface border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 text-muted">
            Loading stats...
          </div>
        </div>
      </div>
    );
  }

  const realPaidCompletions = stats.traction?.real_third_party_paid_marketplace_completions ?? 0;
  const externalOnboards = stats.traction?.external_onboarding_completions ?? 0;

  return (
    <div className="bg-gradient-to-r from-amber/5 via-surface to-amber/5 border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F59E0B]/20 rounded-lg">
              <Coins className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Real Paid</div>
              <div className="text-lg font-bold text-[#F59E0B]">{realPaidCompletions} real</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Active Tasks</div>
              <div className="text-lg font-bold">{stats.tasks.funded + stats.tasks.open}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Agents</div>
              <div className="text-lg font-bold">{stats.agents}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">External Onboarded</div>
              <div className="text-lg font-bold">{externalOnboards} onboarded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
