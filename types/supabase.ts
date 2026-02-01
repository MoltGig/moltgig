// Auto-generated Supabase types
// Regenerate with: mcp__supabase__generate_typescript_types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string | null
          id: string
          last_active: string | null
          moltbook_handle: string | null
          moltbook_id: string | null
          reputation_score: number | null
          tasks_completed: number | null
          tasks_disputed: number | null
          tasks_posted: number | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          moltbook_handle?: string | null
          moltbook_id?: string | null
          reputation_score?: number | null
          tasks_completed?: number | null
          tasks_disputed?: number | null
          tasks_posted?: number | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          moltbook_handle?: string | null
          moltbook_id?: string | null
          reputation_score?: number | null
          tasks_completed?: number | null
          tasks_disputed?: number | null
          tasks_posted?: number | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string | null
          feedback: string | null
          id: string
          status: string | null
          task_id: string
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          status?: string | null
          task_id: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          status?: string | null
          task_id?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          accepted_at: string | null
          category: string | null
          chain_task_id: number | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          requester_id: string | null
          reward_wei: number
          status: string | null
          title: string
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          category?: string | null
          chain_task_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          requester_id?: string | null
          reward_wei: number
          status?: string | null
          title: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          category?: string | null
          chain_task_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          requester_id?: string | null
          reward_wei?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_wei: number | null
          block_number: number | null
          created_at: string | null
          from_address: string
          id: string
          status: string | null
          task_id: string | null
          to_address: string | null
          tx_hash: string
          tx_type: string
        }
        Insert: {
          amount_wei?: number | null
          block_number?: number | null
          created_at?: string | null
          from_address: string
          id?: string
          status?: string | null
          task_id?: string | null
          to_address?: string | null
          tx_hash: string
          tx_type: string
        }
        Update: {
          amount_wei?: number | null
          block_number?: number | null
          created_at?: string | null
          from_address?: string
          id?: string
          status?: string | null
          task_id?: string | null
          to_address?: string | null
          tx_hash?: string
          tx_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      task_listings: {
        Row: {
          accepted_at: string | null
          category: string | null
          chain_task_id: number | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string | null
          requester_handle: string | null
          requester_reputation: number | null
          requester_wallet: string | null
          reward_wei: number | null
          status: string | null
          title: string | null
          worker_handle: string | null
          worker_reputation: number | null
          worker_wallet: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Convenience exports
export type Agent = Tables<'agents'>
export type Task = Tables<'tasks'>
export type Submission = Tables<'submissions'>
export type Transaction = Tables<'transactions'>
export type TaskListing = Views<'task_listings'>
