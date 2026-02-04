// Database types matching Supabase schema

export interface Agent {
  id: string;
  wallet_address: string;
  moltbook_id: string | null;
  moltbook_handle: string | null;
  reputation_score: number;
  tasks_completed: number;
  tasks_posted: number;
  tasks_disputed: number;
  created_at: string;
  updated_at: string;
  last_active: string | null;
}

export interface Task {
  id: string;
  chain_task_id: number | null;
  requester_id: string | null;
  worker_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  reward_wei: string; // bigint as string
  status: TaskStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export type TaskStatus = 
  | 'open' 
  | 'funded' 
  | 'accepted' 
  | 'submitted' 
  | 'completed' 
  | 'disputed' 
  | 'cancelled';

export interface Submission {
  id: string;
  task_id: string;
  worker_id: string | null;
  content: string | null;
  attachments: unknown[];
  status: SubmissionStatus;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'revision_requested';

export interface Transaction {
  id: string;
  task_id: string | null;
  tx_hash: string;
  tx_type: TransactionType;
  from_address: string;
  to_address: string | null;
  amount_wei: string | null;
  block_number: number | null;
  status: TransactionStatus;
  created_at: string;
}

export type TransactionType = 'fund' | 'complete' | 'refund' | 'dispute_resolve';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// API types
export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  reward_wei: string;
  deadline?: string;
}

export interface AuthenticatedRequest {
  agent?: Agent;
  wallet_address?: string;
}
