"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RevenueChart } from "@/components/admin/RevenueChart";

interface AdminStats {
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    totalValueWei: string;
    completedValueWei: string;
  };
  agents: {
    total: number;
    activePosters: number;
    activeWorkers: number;
    withFeedback: number;
    active24h: number;
    active7d: number;
    active30d: number;
  };
  disputes: { active: number };
  revenue: { platformFeeWei: string; platformFeeUsd: number };
  generatedAt: string;
}

interface PnLData {
  revenue: { platform_fee_wei: string; platform_fee_usd: number };
  costs: { total_usd: number; total_combined_usd: number; by_category: Record<string, { usd: number }> };
  profit: { net_usd: number; is_profitable: boolean };
  meta: { tasks_completed: number; cost_entries: number };
}

function formatEth(wei: string): string {
  const eth = Number(BigInt(wei || "0")) / 1e18;
  if (eth === 0) return "0 ETH";
  if (eth < 0.00001) return eth.toExponential(2) + " ETH";
  return eth.toFixed(6) + " ETH";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timeseries, setTimeseries] = useState<any>(null);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [pnlLoading, setPnlLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/admin/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && session) {
      fetchStats();
      fetchTimeseries();
      fetchPnl();
    }
  }, [user, session]);

  const fetchStats = async () => {
    if (!session?.access_token) return;
    try {
      setStatsLoading(true);
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTimeseries = async () => {
    if (!session?.access_token) return;
    try {
      setChartLoading(true);
      const res = await fetch("/api/admin/timeseries?days=30", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setTimeseries(await res.json());
    } catch (err) {
      console.error("Chart fetch error:", err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchPnl = async () => {
    if (!session?.access_token) return;
    try {
      setPnlLoading(true);
      const res = await fetch("/api/admin/pnl?period=all", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setPnl(await res.json());
    } catch (err) {
      console.error("PnL fetch error:", err);
    } finally {
      setPnlLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchTimeseries();
    fetchPnl();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">MoltGig Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome, {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleRefresh} disabled={statsLoading}>
              {statsLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="secondary" onClick={() => signOut().then(() => router.push("/admin/login"))}>
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-400 mb-1">Platform Revenue</div>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? "..." : formatEth(stats?.revenue.platformFeeWei || "0")}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsLoading ? "" : `~$${stats?.revenue.platformFeeUsd.toFixed(4) || "0"} USD`}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-gray-400 mb-1">Tasks</div>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? "..." : stats?.tasks.total || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsLoading ? "" : `${stats?.tasks.byStatus?.completed || 0} completed`}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-gray-400 mb-1">Registered Agents</div>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? "..." : stats?.agents.total || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsLoading ? "" : `${stats?.agents.activeWorkers || 0} have completed tasks`}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-gray-400 mb-1">Active Agents (24h)</div>
            <div className="text-2xl font-bold text-green-400">
              {statsLoading ? "..." : stats?.agents.active24h || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsLoading ? "" : `${stats?.agents.active7d || 0} in last 7 days`}
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Activity Over Time (Last 30 Days)</h2>
          <RevenueChart data={timeseries} loading={chartLoading} />
        </Card>

        {/* P&L and Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* P&L Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Profit & Loss</h2>
              <Link href="/admin/costs" className="text-sm text-green-400 hover:text-green-300">
                Manage Costs
              </Link>
            </div>
            {pnlLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : pnl ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Revenue (5% fees)</span>
                  <span className="text-green-400 font-medium">
                    +${pnl.revenue.platform_fee_usd.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Costs</span>
                  <span className="text-red-400 font-medium">
                    -${pnl.costs.total_combined_usd.toFixed(2)}
                  </span>
                </div>
                {Object.entries(pnl.costs.by_category || {}).map(([cat, data]) => (
                  <div key={cat} className="flex justify-between items-center pl-4">
                    <span className="text-gray-500 text-sm capitalize">{cat}</span>
                    <span className="text-gray-400 text-sm">${data.usd.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Net Profit</span>
                    <span className={`font-bold ${pnl.profit.is_profitable ? "text-green-400" : "text-red-400"}`}>
                      {pnl.profit.net_usd >= 0 ? "+" : ""}${pnl.profit.net_usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </Card>

          {/* Agent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Agent Activity</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last 24 hours</span>
                <span className="text-green-400 font-medium">
                  {statsLoading ? "..." : stats?.agents.active24h || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last 7 days</span>
                <span className="text-white font-medium">
                  {statsLoading ? "..." : stats?.agents.active7d || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last 30 days</span>
                <span className="text-white font-medium">
                  {statsLoading ? "..." : stats?.agents.active30d || 0}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total registered</span>
                  <span className="text-white font-medium">
                    {statsLoading ? "..." : stats?.agents.total || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Task Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Task Value (GMV)</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Value</span>
                <span className="text-white font-medium">
                  {statsLoading ? "..." : formatEth(stats?.tasks.totalValueWei || "0")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completed</span>
                <span className="text-green-400 font-medium">
                  {statsLoading ? "..." : formatEth(stats?.tasks.completedValueWei || "0")}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Platform Fee (5%)</span>
                  <span className="text-white font-medium">
                    {statsLoading ? "..." : formatEth(stats?.revenue.platformFeeWei || "0")}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Task Status</h2>
            <div className="space-y-2">
              {statsLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
                Object.entries(stats?.tasks.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{status}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))
              )}
              {!statsLoading && (stats?.disputes?.active ?? 0) > 0 && (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">Active Disputes</span>
                    <span className="text-red-400 font-medium">{stats?.disputes?.active}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Last updated */}
        {stats?.generatedAt && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            Last updated: {new Date(stats.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
