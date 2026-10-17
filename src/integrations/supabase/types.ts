export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      hanta_alerts: {
        Row: {
          created_at: string;
          id: string;
          level: Database["public"]["Enums"]["alert_level"];
          region: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["alert_level"];
          region: string;
          title: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["alert_level"];
          region?: string;
          title?: string;
        };
        Relationships: [];
      };
      hanta_cases: {
        Row: {
          age: number | null;
          case_id: string;
          created_at: string;
          id: string;
          lat: number;
          lng: number;
          region: string;
          reported_at: string;
          sex: Database["public"]["Enums"]["case_sex"] | null;
          status: Database["public"]["Enums"]["case_status"];
          syndrome: Database["public"]["Enums"]["case_syndrome"];
        };
        Insert: {
          age?: number | null;
          case_id: string;
          created_at?: string;
          id?: string;
          lat: number;
          lng: number;
          region: string;
          reported_at?: string;
          sex?: Database["public"]["Enums"]["case_sex"] | null;
          status?: Database["public"]["Enums"]["case_status"];
          syndrome?: Database["public"]["Enums"]["case_syndrome"];
        };
        Update: {
          age?: number | null;
          case_id?: string;
          created_at?: string;
          id?: string;
          lat?: number;
          lng?: number;
          region?: string;
          reported_at?: string;
          sex?: Database["public"]["Enums"]["case_sex"] | null;
          status?: Database["public"]["Enums"]["case_status"];
          syndrome?: Database["public"]["Enums"]["case_syndrome"];
        };
        Relationships: [];
      };
      infra_api_uptime: {
        Row: {
          checked_at: string;
          error_message: string | null;
          id: string;
          latency_ms: number | null;
          service: string;
          status: Database["public"]["Enums"]["infra_status"];
        };
        Insert: {
          checked_at?: string;
          error_message?: string | null;
          id?: string;
          latency_ms?: number | null;
          service: string;
          status: Database["public"]["Enums"]["infra_status"];
        };
        Update: {
          checked_at?: string;
          error_message?: string | null;
          id?: string;
          latency_ms?: number | null;
          service?: string;
          status?: Database["public"]["Enums"]["infra_status"];
        };
        Relationships: [];
      };
      infra_config: {
        Row: {
          created_at: string;
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      infra_db_metrics: {
        Row: {
          checked_at: string;
          id: string;
          latency_ms: number;
          pool_max: number;
          pool_used: number;
          source: string;
        };
        Insert: {
          checked_at?: string;
          id?: string;
          latency_ms: number;
          pool_max: number;
          pool_used: number;
          source?: string;
        };
        Update: {
          checked_at?: string;
          id?: string;
          latency_ms?: number;
          pool_max?: number;
          pool_used?: number;
          source?: string;
        };
        Relationships: [];
      };
      infra_ingest_runs: {
        Row: {
          error_message: string | null;
          finished_at: string | null;
          id: string;
          records_ingested: number | null;
          source: string;
          started_at: string;
          status: Database["public"]["Enums"]["ingest_status"];
        };
        Insert: {
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          records_ingested?: number | null;
          source: string;
          started_at?: string;
          status: Database["public"]["Enums"]["ingest_status"];
        };
        Update: {
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          records_ingested?: number | null;
          source?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["ingest_status"];
        };
        Relationships: [];
      };
      rodent_sites: {
        Row: {
          created_at: string;
          id: string;
          lat: number;
          lng: number;
          positivity: number;
          region: string;
          sampled_at: string;
          site_id: string;
          species: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lat: number;
          lng: number;
          positivity?: number;
          region: string;
          sampled_at?: string;
          site_id: string;
          species: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lat?: number;
          lng?: number;
          positivity?: number;
          region?: string;
          sampled_at?: string;
          site_id?: string;
          species?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      alert_level: "critical" | "warning" | "info";
      app_role: "admin" | "epidemiologist" | "viewer";
      case_sex: "M" | "F";
      case_status: "Confirmed" | "Suspected" | "Pending";
      case_syndrome: "HPS" | "HFRS";
      infra_status: "ok" | "warn" | "down";
      ingest_status: "success" | "failed";
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
  public: {
    Enums: {
      alert_level: ["critical", "warning", "info"],
      app_role: ["admin", "epidemiologist", "viewer"],
      case_sex: ["M", "F"],
      case_status: ["Confirmed", "Suspected", "Pending"],
      case_syndrome: ["HPS", "HFRS"],
    },
  },
} as const;
