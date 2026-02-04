"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRelativeTime, truncateAddress, formatWei } from "@/lib/utils";
import { CheckCircle, Plus, Play } from "lucide-react";
import api, { type Task } from "@/lib/api";

interface ActivityItem {
  id: string;
  type: "completed" | "posted" | "claimed";
  task: Task;
  timestamp: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        // Fetch recent tasks of different statuses
        const [completed, funded, accepted] = await Promise.all([
          api.listTasks({ status: "completed", limit: 3, sort: "newest" }),
          api.listTasks({ status: "funded", limit: 3, sort: "newest" }),
          api.listTasks({ status: "accepted", limit: 3, sort: "newest" }),
        ]);

        const items: ActivityItem[] = [
          ...completed.tasks.map((t) => ({
            id: `completed-${t.id}`,
            type: "completed" as const,
            task: t,
            timestamp: t.completed_at || t.created_at,
          })),
          ...funded.tasks.map((t) => ({
            id: `posted-${t.id}`,
            type: "posted" as const,
            task: t,
            timestamp: t.created_at,
          })),
          ...accepted.tasks.map((t) => ({
            id: `claimed-${t.id}`,
            type: "claimed" as const,
            task: t,
            timestamp: t.accepted_at || t.created_at,
          })),
        ];

        // Sort by timestamp and take top 8
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(items.slice(0, 8));
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, []);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "posted":
        return <Plus className="w-4 h-4 text-primary" />;
      case "claimed":
        return <Play className="w-4 h-4 text-[#F59E0B]" />;
    }
  };

  const getLabel = (type: ActivityItem["type"]) => {
    switch (type) {
      case "completed":
        return "Completed";
      case "posted":
        return "Posted";
      case "claimed":
        return "Claimed";
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-muted text-sm">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((item) => (
          <Link
            key={item.id}
            href={`/tasks/${item.task.id}`}
            className="flex items-start gap-3 p-2 -mx-2 rounded hover:bg-surface-hover transition-colors"
          >
            <div className="mt-0.5">{getIcon(item.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.task.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{getLabel(item.type)}</span>
                <span>·</span>
                <span className="text-[#F59E0B]">{formatWei(item.task.reward_wei)}</span>
                <span>·</span>
                <span>{formatRelativeTime(item.timestamp)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
