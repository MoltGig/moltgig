"use client";

import { useEffect, useState, useCallback } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskFilters } from "@/components/task/TaskFilters";
import { StatsBar } from "@/components/task/StatsBar";
import { RecentActivity } from "@/components/task/RecentActivity";
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
    search?: string;
  }>({
    sort: "reward_high", // Default to highest reward first
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
    <>
      <StatsBar />
      <Container className="py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            <PageHeader
              title="Browse Gigs"
              description="Find gigs to complete and earn rewards"
            />

            <div className="mb-6">
              <TaskFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>

            {loading && tasks.length === 0 ? (
              <LoadingPage />
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted mb-4">No gigs available yet</p>
                <p className="text-sm text-muted">Check back soon for new opportunities</p>
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
                      variant="secondary"
                      onClick={loadMore}
                      loading={loading}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <RecentActivity />
          </div>
        </div>
      </Container>
    </>
  );
}
