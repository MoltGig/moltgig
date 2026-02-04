"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

interface Cost {
  id: string;
  category: string;
  description: string | null;
  amount_wei: string | null;
  amount_usd: string | null;
  tx_hash: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "server", label: "Server/Hosting" },
  { value: "domain", label: "Domain" },
  { value: "gas", label: "Gas Fees" },
  { value: "api", label: "API Services" },
  { value: "other", label: "Other" },
];

export default function CostsPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAdminAuth();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("server");
  const [description, setDescription] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountWei, setAmountWei] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && session) {
      fetchCosts();
    }
  }, [user, session]);

  const fetchCosts = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/costs", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch costs");
      const data = await res.json();
      setCosts(data.costs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load costs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/costs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          description: description || null,
          amount_usd: amountUsd ? parseFloat(amountUsd) : null,
          amount_wei: amountWei || null,
          period_start: periodStart || null,
          period_end: periodEnd || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add cost");
      }

      // Reset form
      setDescription("");
      setAmountUsd("");
      setAmountWei("");
      setPeriodStart("");
      setPeriodEnd("");

      // Refresh list
      fetchCosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add cost");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    if (!confirm("Delete this cost entry?")) return;

    try {
      const res = await fetch(`/api/admin/costs?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");
      fetchCosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cost");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  const totalUsd = costs.reduce((sum, c) => sum + parseFloat(c.amount_usd || "0"), 0);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Cost Management</h1>
            <p className="text-gray-400 mt-1">Track platform expenses</p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Add Cost Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Cost</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <Input
                placeholder="e.g., Hetzner CX23 - February 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Period Start (optional)</label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Period End (optional)</label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {category === "gas" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (Wei) - for gas costs</label>
                <Input
                  placeholder="0"
                  value={amountWei}
                  onChange={(e) => setAmountWei(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" disabled={submitting || (!amountUsd && !amountWei)}>
              {submitting ? "Adding..." : "Add Cost"}
            </Button>
          </form>
        </Card>

        {/* Costs List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cost History</h2>
            <div className="text-sm text-gray-400">
              Total: <span className="text-white font-medium">${totalUsd.toFixed(2)}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : costs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No costs recorded yet</div>
          ) : (
            <div className="space-y-3">
              {costs.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300 capitalize">
                        {cost.category}
                      </span>
                      <span className="text-white">{cost.description || "No description"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(cost.created_at).toLocaleDateString()}
                      {cost.period_start && " | Period: " + cost.period_start}
                      {cost.period_end && " to " + cost.period_end}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">
                      {cost.amount_usd ? `$${parseFloat(cost.amount_usd).toFixed(2)}` : ""}
                      {cost.amount_wei ? ` ${(Number(cost.amount_wei) / 1e18).toFixed(6)} ETH` : ""}
                    </span>
                    <button
                      onClick={() => handleDelete(cost.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
