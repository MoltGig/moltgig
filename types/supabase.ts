// Auto-generated Supabase types
// Regenerate with: mcp__supabase__generate_typescript_types
// Last regenerated: 2026-02-04

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
          average_rating: number | null
          bio: string | null
          created_at: string | null
          feedback_count: number | null
          flag_action: string | null
          flag_reason: string | null
          flagged_at: string | null
          id: string
          is_flagged: boolean | null
          last_active: string | null
          moltbook_handle: string | null
          moltbook_id: string | null
          reputation_score: number | null
          reputation_tier: string | null
          skills_declared: string[] | null
          skills_earned: string[] | null
          tasks_completed: number | null
          tasks_disputed: number | null
          tasks_posted: number | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          feedback_count?: number | null
          flag_action?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          id?: string
          is_flagged?: boolean | null
          last_active?: string | null
          moltbook_handle?: string | null
          moltbook_id?: string | null
          reputation_score?: number | null
          reputation_tier?: string | null
          skills_declared?: string[] | null
          skills_earned?: string[] | null
          tasks_completed?: number | null
          tasks_disputed?: number | null
          tasks_posted?: number | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          feedback_count?: number | null
          flag_action?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          id?: string
          is_flagged?: boolean | null
          last_active?: string | null
          moltbook_handle?: string | null
          moltbook_id?: string | null
          reputation_score?: number | null
          reputation_tier?: string | null
          skills_declared?: string[] | null
          skills_earned?: string[] | null
          tasks_completed?: number | null
          tasks_disputed?: number | null
          tasks_posted?: number | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          amount_usd: number | null
          amount_wei: number | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          period_end: string | null
          period_start: string | null
          tx_hash: string | null
        }
        Insert: {
          amount_usd?: number | null
          amount_wei?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          tx_hash?: string | null
        }
        Update: {
          amount_usd?: number | null
          amount_wei?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          tx_hash?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          agent_id: string
          body: string | null
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          read_at: string | null
          title: string
        }
        Insert: {
          agent_id: string
          body?: string | null
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          read_at?: string | null
          title: string
        }
        Update: {
          agent_id?: string
          body?: string | null
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          read_at?: string | null
          title?: string
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
      task_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          task_id?: string
        }
        Relationships: []
      }
      task_messages: {
        Row: {
          attachment_urls: string[] | null
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          task_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          task_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          task_id?: string
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
          dispute_reason: string | null
          dispute_resolution: string | null
          id: string
          requester_id: string | null
          resolved_at: string | null
          reward_wei: number
          status: string | null
          task_group: string | null
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
          dispute_reason?: string | null
          dispute_resolution?: string | null
          id?: string
          requester_id?: string | null
          resolved_at?: string | null
          reward_wei: number
          status?: string | null
          task_group?: string | null
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
          dispute_reason?: string | null
          dispute_resolution?: string | null
          id?: string
          requester_id?: string | null
          resolved_at?: string | null
          reward_wei?: number
          status?: string | null
          task_group?: string | null
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
      webhooks: {
        Row: {
          agent_id: string
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          secret: string
          url: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          secret: string
          url: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          secret?: string
          url?: string
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
          task_group: string | null
          title: string | null
          worker_handle: string | null
          worker_reputation: number | null
          worker_wallet: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_notifications: { Args: never; Returns: undefined }
    }
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
export type TaskFeedback = Tables<'task_feedback'>
export type Cost = Tables<'costs'>
export type Notification = Tables<'notifications'>
export type Webhook = Tables<'webhooks'>
export type TaskMessage = Tables<'task_messages'>
export type TaskListing = Views<'task_listings'>

// Event types for notifications
export type NotificationEventType =
  | 'task.accepted'
  | 'task.submitted'
  | 'task.completed'
  | 'payment.released'
  | 'dispute.raised'
  | 'dispute.resolved'
  | 'task.deadline_warning'
  | 'task.expired'
