"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface TimeseriesData {
  daily: Array<{
    date: string;
    tasks_created: number;
    tasks_completed: number;
    value_created_wei: string;
    value_completed_wei: string;
  }>;
  revenue: Array<{
    date: string;
    revenue_wei: string;
    tasks_completed: number;
  }>;
}

interface RevenueChartProps {
  data: TimeseriesData | null;
  loading: boolean;
}

function formatEthShort(wei: string): string {
  const eth = Number(BigInt(wei || "0")) / 1e18;
  if (eth === 0) return "0";
  if (eth < 0.000001) return eth.toExponential(1);
  return eth.toFixed(6);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const [view, setView] = useState<"revenue" | "tasks">("tasks");

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="text-gray-500">Loading chart data...</span>
      </div>
    );
  }

  if (!data || data.daily.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
        <span className="text-gray-500">No data available yet</span>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.daily.map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    tasksCreated: d.tasks_created,
    tasksCompleted: d.tasks_completed,
    valueCreated: Number(BigInt(d.value_created_wei)) / 1e18,
    valueCompleted: Number(BigInt(d.value_completed_wei)) / 1e18,
    revenue: Number(BigInt(d.value_completed_wei) * BigInt(5) / BigInt(100)) / 1e18,
  }));

  // Filter to only show days with activity for cleaner view
  const activeData = chartData.filter(d => d.tasksCreated > 0 || d.tasksCompleted > 0);
  const displayData = activeData.length > 0 ? activeData : chartData.slice(-7);

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("tasks")}
          className={`px-3 py-1 text-sm rounded ${
            view === "tasks"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setView("revenue")}
          className={`px-3 py-1 text-sm rounded ${
            view === "revenue"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Value (ETH)
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {view === "tasks" ? (
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F9FAFB" }}
              />
              <Bar 
                dataKey="tasksCreated" 
                name="Created" 
                fill="#6B7280" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="tasksCompleted" 
                name="Completed" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F9FAFB" }}
                formatter={(value) => [typeof value === "number" ? value.toFixed(6) + " ETH" : String(value), ""]}
              />
              <Line
                type="monotone"
                dataKey="valueCreated"
                name="Value Created"
                stroke="#6B7280"
                strokeWidth={2}
                dot={{ fill: "#6B7280", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="valueCompleted"
                name="Value Completed"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
