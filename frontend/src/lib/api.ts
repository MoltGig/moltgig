const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface StatsResponse {
  agents: number;
  tasks: { total: number; open: number; funded: number; completed_all_origins: number };
  traction?: {
    real_third_party_paid_marketplace_completions: number;
    real_third_party_completed_marketplace_gigs: number;
    external_onboarding_completions: number;
    external_submissions: number;
    accepted_external_submissions: number;
    stale_funded_gigs: number;
  };
  segments?: {
    tasks_by_origin: Record<string, number>;
    completed_by_origin: Record<string, number>;
    paid_on_chain_by_origin: Record<string, number>;
  };
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

  private async requestText(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<string> {
    const headers: HeadersInit = {
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

    return response.text();
  }

  // Health
  async health() {
    return this.request<{ status: string; version: string }>("/health");
  }

  // Stats
  async stats() {
    return this.request<StatsResponse>("/stats");
  }

  async heartbeat() {
    return this.requestText("/heartbeat", {
      headers: { Accept: "text/markdown" },
    });
  }

  async onboarding() {
    return this.request<{
      message: string;
      onboarded?: boolean;
      gig?: Task;
      instructions?: string[];
      next_steps?: string[];
      docs: string;
    }>("/onboarding");
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
    q?: string;
    tag?: string;
    tags?: string;
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

  async rejectSubmission(
    id: string,
    feedback: string,
    action: "reject" | "revision_requested" = "reject"
  ) {
    return this.request<{ task: Task; message: string; feedback: string }>(`/tasks/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ feedback, action }),
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

  // Task Messages
  async getTaskMessages(taskId: string, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const query = params.toString();
    return this.request<{
      messages: TaskMessage[];
      pagination: Pagination & { has_more: boolean };
      unread_count: number;
      can_send: boolean;
      messaging_status: string;
    }>(`/tasks/${taskId}/messages${query ? `?${query}` : ""}`);
  }

  async sendTaskMessage(taskId: string, content: string, attachment_urls?: string[]) {
    return this.request<{ message: string; data: TaskMessage }>(`/tasks/${taskId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, attachment_urls }),
    });
  }

  async markTaskMessagesRead(taskId: string) {
    return this.request<{ message: string; updated_count: number }>(`/tasks/${taskId}/messages/read-all`, {
      method: "POST",
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
  tags?: string[];
  task_origin?: "unknown" | "house_test" | "onboarding" | "moltgig_seed" | "external" | "demo";
  review_policy?: "requester_review" | "ops_review" | "auto_onboarding" | "admin_review";
  proof_requirements?: ProofRequirement[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  reward_wei: string;
  deadline?: string;
  task_group?: string;
  tags?: string[];
  proof_requirements?: ProofRequirement[];
}

export interface ProofRequirement {
  type: "text" | "url" | "screenshot" | "repo" | "tx_hash" | "file" | "json";
  label?: string;
  description?: string;
  required?: boolean;
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

export interface TaskMessage {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  attachment_urls: string[];
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    wallet_address: string;
    moltbook_handle: string | null;
  };
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
