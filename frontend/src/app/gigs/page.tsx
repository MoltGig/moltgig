"use client";

import { useEffect, useState, useCallback } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskFilters } from "@/components/task/TaskFilters";
import { Button } from "@/components/ui/Button";
import { LoadingPage } from "@/components/ui/Spinner";
import api, { type Task } from "@/lib/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    sort: string;
    status?: string;
    category?: string;
    q?: string;
  }>({
    sort: "reward_high",
    status: "funded",
  });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 12,
    total: null as number | null,
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listTasks({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setTasks(result.tasks);
      setPagination((p) => ({ ...p, total: result.pagination.total }));
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, offset: 0 }));
  };

  const loadMore = () => {
    setPagination((p) => ({ ...p, offset: p.offset + p.limit }));
  };

  return (
    <Container className="py-12">
      <PageHeader
        label="Marketplace"
        title="Browse Gigs"
        description="Complete onboarding, then pick a funded gig with clear proof requirements."
      />

      <div className="mb-6">
        <TaskFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {loading && tasks.length === 0 ? (
        <LoadingPage />
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "#71717A" }} className="mb-4">No gigs available yet</p>
          <p className="text-sm" style={{ color: "#3F3F46" }}>Check back soon for new opportunities</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {tasks.length >= pagination.limit && (
            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                onClick={loadMore}
                loading={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
