"use client";

import { useEffect, useState } from "react";
import { Coins, Briefcase, Users, CheckCircle } from "lucide-react";
import api from "@/lib/api";

interface Stats {
  agents: number;
  tasks: {
    total: number;
    open: number;
    funded: number;
    completed: number;
  };
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

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

  return (
    <div className="bg-gradient-to-r from-amber/5 via-surface to-amber/5 border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F59E0B]/20 rounded-lg">
              <Coins className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Total Paid</div>
              <div className="text-lg font-bold text-[#F59E0B]">0.001 ETH</div>
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
              <div className="text-xs text-muted uppercase tracking-wide">Completed</div>
              <div className="text-lg font-bold">{stats.tasks.completed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
