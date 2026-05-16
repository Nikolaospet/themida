export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          scan_id: string | null;
          stripe_payment_intent: string | null;
          type: Database["public"]["Enums"]["credit_tx_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          scan_id?: string | null;
          stripe_payment_intent?: string | null;
          type: Database["public"]["Enums"]["credit_tx_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          scan_id?: string | null;
          stripe_payment_intent?: string | null;
          type?: Database["public"]["Enums"]["credit_tx_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      github_installations: {
        Row: {
          account_id: number;
          account_login: string;
          account_type: string;
          created_at: string;
          id: string;
          installation_id: number;
          suspended_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: number;
          account_login: string;
          account_type: string;
          created_at?: string;
          id?: string;
          installation_id: number;
          suspended_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: number;
          account_login?: string;
          account_type?: string;
          created_at?: string;
          id?: string;
          installation_id?: number;
          suspended_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "github_installations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      issues: {
        Row: {
          code_snippet: string | null;
          confidence: Database["public"]["Enums"]["confidence"];
          created_at: string;
          explanation: string;
          false_positive: boolean;
          file_path: string;
          fix_code: string | null;
          fix_description: string | null;
          fix_time_estimate: string | null;
          framework: string;
          id: string;
          legal_reference: string | null;
          legal_risk: string | null;
          line_number: number | null;
          rule_id: string;
          scan_id: string;
          severity: Database["public"]["Enums"]["severity"];
          title: string;
          user_id: string;
        };
        Insert: {
          code_snippet?: string | null;
          confidence?: Database["public"]["Enums"]["confidence"];
          created_at?: string;
          explanation: string;
          false_positive?: boolean;
          file_path: string;
          fix_code?: string | null;
          fix_description?: string | null;
          fix_time_estimate?: string | null;
          framework: string;
          id?: string;
          legal_reference?: string | null;
          legal_risk?: string | null;
          line_number?: number | null;
          rule_id: string;
          scan_id: string;
          severity: Database["public"]["Enums"]["severity"];
          title: string;
          user_id: string;
        };
        Update: {
          code_snippet?: string | null;
          confidence?: Database["public"]["Enums"]["confidence"];
          created_at?: string;
          explanation?: string;
          false_positive?: boolean;
          file_path?: string;
          fix_code?: string | null;
          fix_description?: string | null;
          fix_time_estimate?: string | null;
          framework?: string;
          id?: string;
          legal_reference?: string | null;
          legal_risk?: string | null;
          line_number?: number | null;
          rule_id?: string;
          scan_id?: string;
          severity?: Database["public"]["Enums"]["severity"];
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issues_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      llm_api_calls: {
        Row: {
          cached_tokens: number;
          cost_cents: number;
          created_at: string;
          duration_ms: number | null;
          id: string;
          input_tokens: number;
          model: string;
          output_tokens: number;
          pass: string;
          provider: string;
          request_id: string | null;
          scan_id: string | null;
          user_id: string | null;
        };
        Insert: {
          cached_tokens?: number;
          cost_cents: number;
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          input_tokens: number;
          model: string;
          output_tokens: number;
          pass: string;
          provider: string;
          request_id?: string | null;
          scan_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          cached_tokens?: number;
          cost_cents?: number;
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          input_tokens?: number;
          model?: string;
          output_tokens?: number;
          pass?: string;
          provider?: string;
          request_id?: string | null;
          scan_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "llm_api_calls_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "llm_api_calls_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          credits: number;
          credits_reset_at: string | null;
          email: string;
          full_name: string | null;
          github_token_encrypted: string | null;
          id: string;
          plan: Database["public"]["Enums"]["user_plan"];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: number;
          credits_reset_at?: string | null;
          email: string;
          full_name?: string | null;
          github_token_encrypted?: string | null;
          id: string;
          plan?: Database["public"]["Enums"]["user_plan"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: number;
          credits_reset_at?: string | null;
          email?: string;
          full_name?: string | null;
          github_token_encrypted?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["user_plan"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      repo_file_cache: {
        Row: {
          blob_sha: string;
          cached_at: string;
          content_compressed: string;
          content_size: number;
          file_path: string;
          id: string;
          repo_id: string;
        };
        Insert: {
          blob_sha: string;
          cached_at?: string;
          content_compressed: string;
          content_size: number;
          file_path: string;
          id?: string;
          repo_id: string;
        };
        Update: {
          blob_sha?: string;
          cached_at?: string;
          content_compressed?: string;
          content_size?: number;
          file_path?: string;
          id?: string;
          repo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repo_file_cache_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repos";
            referencedColumns: ["id"];
          },
        ];
      };
      repos: {
        Row: {
          created_at: string;
          default_branch: string;
          full_name: string;
          github_repo_id: number;
          id: string;
          installation_id: number | null;
          last_scanned_at: string | null;
          name: string;
          owner: string;
          private: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          default_branch?: string;
          full_name: string;
          github_repo_id: number;
          id?: string;
          installation_id?: number | null;
          last_scanned_at?: string | null;
          name: string;
          owner: string;
          private?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          default_branch?: string;
          full_name?: string;
          github_repo_id?: number;
          id?: string;
          installation_id?: number | null;
          last_scanned_at?: string | null;
          name?: string;
          owner?: string;
          private?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repos_installation_id_fkey";
            columns: ["installation_id"];
            isOneToOne: false;
            referencedRelation: "github_installations";
            referencedColumns: ["installation_id"];
          },
          {
            foreignKeyName: "repos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_rate_state: {
        Row: {
          scans_in_window: number;
          user_id: string;
          window_start: string;
        };
        Insert: {
          scans_in_window?: number;
          user_id: string;
          window_start?: string;
        };
        Update: {
          scans_in_window?: number;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_rate_state_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      scans: {
        Row: {
          completed_at: string | null;
          compliance_score: number | null;
          created_at: string;
          credits_used: number;
          critical_count: number;
          error_message: string | null;
          estimated_fix_time: string | null;
          files_scanned: number;
          files_total: number;
          frameworks: string[];
          high_count: number;
          id: string;
          low_count: number;
          medium_count: number;
          progress: Json;
          repo_id: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["scan_status"];
          total_issues: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          compliance_score?: number | null;
          created_at?: string;
          credits_used?: number;
          critical_count?: number;
          error_message?: string | null;
          estimated_fix_time?: string | null;
          files_scanned?: number;
          files_total?: number;
          frameworks: string[];
          high_count?: number;
          id?: string;
          low_count?: number;
          medium_count?: number;
          progress?: Json;
          repo_id: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["scan_status"];
          total_issues?: number;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          compliance_score?: number | null;
          created_at?: string;
          credits_used?: number;
          critical_count?: number;
          error_message?: string | null;
          estimated_fix_time?: string | null;
          files_scanned?: number;
          files_total?: number;
          frameworks?: string[];
          high_count?: number;
          id?: string;
          low_count?: number;
          medium_count?: number;
          progress?: Json;
          repo_id?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["scan_status"];
          total_issues?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scans_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_daily_scan_slot: {
        Args: { p_cap: number; p_user_id: string };
        Returns: Json;
      };
      sum_llm_cost_last_24h: { Args: never; Returns: number };
    };
    Enums: {
      confidence: "HIGH" | "MEDIUM" | "LOW";
      credit_tx_type: "signup_bonus" | "scan" | "purchase" | "monthly_reset" | "refund";
      scan_status: "pending" | "running" | "completed" | "failed";
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      user_plan: "free" | "starter" | "builder" | "growth" | "agency";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      confidence: ["HIGH", "MEDIUM", "LOW"],
      credit_tx_type: ["signup_bonus", "scan", "purchase", "monthly_reset", "refund"],
      scan_status: ["pending", "running", "completed", "failed"],
      severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      user_plan: ["free", "starter", "builder", "growth", "agency"],
    },
  },
} as const;
