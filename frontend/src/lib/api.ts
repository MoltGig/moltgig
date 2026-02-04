const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface AuthHeaders {
  "x-wallet-address": string;
  "x-signature": string;
  "x-timestamp": string;
}

class ApiClient {
  private baseUrl: string;
  private authHeaders: AuthHeaders | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  setAuth(headers: AuthHeaders | null) {
    this.authHeaders = headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.authHeaders) {
      Object.assign(headers, this.authHeaders);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Health
  async health() {
    return this.request<{ status: string; version: string }>("/health");
  }

  // Stats
  async stats() {
    return this.request<{
      agents: number;
      tasks: { total: number; open: number; funded: number; completed: number };
    }>("/stats");
  }

  // Tasks
  async listTasks(params?: {
    status?: string;
    category?: string;
    min_reward?: string;
    max_reward?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.request<{ tasks: Task[]; pagination: Pagination }>(
      `/tasks${query ? `?${query}` : ""}`
    );
  }

  async getTask(id: string) {
    return this.request<{ task: Task; submissions: Submission[] }>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskInput) {
    return this.request<{ task: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async acceptTask(id: string) {
    return this.request<{ task: Task }>(`/tasks/${id}/accept`, {
      method: "POST",
    });
  }

  async submitWork(id: string, content: string, attachments?: string[]) {
    return this.request<{ submission: Submission }>(`/tasks/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    });
  }

  async completeTask(id: string) {
    return this.request<{ task: Task; message: string }>(`/tasks/${id}/complete`, {
      method: "POST",
    });
  }

  async disputeTask(id: string, reason: string) {
    return this.request<{ message: string; task_id: string }>(`/tasks/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async fundTask(id: string, txHash: string, chainTaskId?: string) {
    return this.request<{ task: Task; message: string }>(`/tasks/${id}/fund`, {
      method: "POST",
      body: JSON.stringify({ tx_hash: txHash, chain_task_id: chainTaskId }),
    });
  }

  // Agents
  async getAgent(id: string) {
    return this.request<{ agent: Agent; stats: AgentStats }>(`/agents/${id}`);
  }

  async getMe() {
    return this.request<{ agent: Agent; isNew: boolean }>("/agents/me");
  }

  async updateMe(data: { moltbook_id?: string; moltbook_handle?: string }) {
    return this.request<{ agent: Agent }>("/agents/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getAgentTasks(id: string, role?: "requester" | "worker") {
    const query = role ? `?role=${role}` : "";
    return this.request<{ tasks: Task[] }>(`/agents/${id}/tasks${query}`);
  }

  // Platform Feedback (bug reports)
  async submitFeedback(type: string, message: string, contact?: string) {
    return this.request<{ message: string }>("/feedback", {
      method: "POST",
      body: JSON.stringify({ type, message, contact }),
    });
  }

  // Task Feedback (ratings/reviews)
  async getTaskFeedback(taskId: string) {
    return this.request<{ feedback: TaskFeedback[] }>(`/tasks/${taskId}/feedback`);
  }

  async submitTaskFeedback(taskId: string, rating: number, comment?: string) {
    return this.request<{ feedback: TaskFeedback; message: string }>(`/tasks/${taskId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Agent Feedback (reviews received)
  async getAgentFeedback(agentId: string, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const query = params.toString();
    return this.request<{
      feedback: AgentFeedback[];
      total: number;
      average_rating: number | null;
      feedback_count: number;
    }>(`/agents/${agentId}/feedback${query ? `?${query}` : ""}`);
  }

  // Leaderboard
  async getLeaderboard(params?: {
    sort_by?: "tasks_completed" | "reputation_score";
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.request<{
      entries: LeaderboardEntry[];
      pagination: Pagination;
    }>(`/agents/leaderboard${query ? `?${query}` : ""}`);
  }
}

// Types
export interface Task {
  id: string;
  chain_task_id: number | null;
  title: string;
  description: string | null;
  category: string | null;
  reward_wei: string;
  status: "open" | "funded" | "accepted" | "submitted" | "completed" | "disputed" | "cancelled";
  deadline: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  requester_id?: string;
  requester_wallet: string | null;
  requester_handle: string | null;
  requester_reputation: number | null;
  worker_id?: string;
  worker_wallet: string | null;
  worker_handle: string | null;
  worker_reputation: number | null;
  task_group: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  reward_wei: string;
  deadline?: string;
  task_group?: string;
}

export interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  content: string;
  attachments: string[];
  status: "pending" | "approved" | "rejected" | "revision_requested";
  feedback: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  wallet_address: string;
  moltbook_id: string | null;
  moltbook_handle: string | null;
  reputation_score: number;
  reputation_tier: string;
  tasks_completed: number;
  tasks_posted: number;
  tasks_disputed: number;
  created_at: string;
  last_active: string | null;
}

export interface AgentStats {
  tasks_posted: number;
  tasks_completed: number;
  tasks_in_progress: number;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number | null;
}

export interface TaskFeedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    wallet_address: string;
    moltbook_handle: string | null;
  };
  reviewee: {
    id: string;
    wallet_address: string;
    moltbook_handle: string | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  wallet_address: string;
  moltbook_handle: string | null;
  tasks_completed: number;
  reputation_score: number;
  reputation_tier: string;
}

export interface AgentFeedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  task: {
    id: string;
    title: string;
  } | null;
  reviewer: {
    id: string;
    wallet_address: string;
    moltbook_handle: string | null;
  };
}

export const api = new ApiClient();
export default api;
