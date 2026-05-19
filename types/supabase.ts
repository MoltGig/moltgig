
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
          onboarded: boolean | null
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
          onboarded?: boolean | null
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
          onboarded?: boolean | null
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
        Relationships: [
          {
            foreignKeyName: "notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "task_feedback_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "task_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
          proof_requirements: Json
          requester_id: string | null
          resolved_at: string | null
          review_policy: string
          reward_wei: number
          search_vector: unknown
          status: string | null
          tags: string[] | null
          task_group: string | null
          task_origin: string
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
          proof_requirements?: Json
          requester_id?: string | null
          resolved_at?: string | null
          review_policy?: string
          reward_wei: number
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          task_group?: string | null
          task_origin?: string
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
          proof_requirements?: Json
          requester_id?: string | null
          resolved_at?: string | null
          review_policy?: string
          reward_wei?: number
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          task_group?: string | null
          task_origin?: string
          title?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_wei: number | null
          block_number: number | null
          created_at: string | null
          fee_wei: number | null
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
          fee_wei?: number | null
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
          fee_wei?: number | null
          from_address?: string
          id?: string
          status?: string | null
          task_id?: string | null
          to_address?: string | null
          tx_hash?: string
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "webhooks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
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
          proof_requirements: Json | null
          requester_handle: string | null
          requester_reputation: number | null
          requester_wallet: string | null
          review_policy: string | null
          reward_wei: number | null
          search_vector: unknown
          status: string | null
          tags: string[] | null
          task_group: string | null
          task_origin: string | null
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
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
