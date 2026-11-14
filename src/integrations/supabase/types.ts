export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      disease_nowcast_signals: {
        Row: {
          climate_suitability_score: number;
          composite_outbreak_risk: number;
          created_at: string;
          disease_slug: string;
          forecast_cases_14d: number;
          forecast_cases_7d: number;
          lag_correlation_r: number;
          optimal_lead_days: number;
          pharma_basket_zscore: number;
          region: string;
          signal_date: string;
          wiki_attention_zscore: number;
        };
        Insert: {
          climate_suitability_score?: number;
          composite_outbreak_risk?: number;
          created_at?: string;
          disease_slug: string;
          forecast_cases_14d?: number;
          forecast_cases_7d?: number;
          lag_correlation_r?: number;
          optimal_lead_days?: number;
          pharma_basket_zscore?: number;
          region: string;
          signal_date: string;
          wiki_attention_zscore?: number;
        };
        Update: {
          climate_suitability_score?: number;
          composite_outbreak_risk?: number;
          created_at?: string;
          disease_slug?: string;
          forecast_cases_14d?: number;
          forecast_cases_7d?: number;
          lag_correlation_r?: number;
          optimal_lead_days?: number;
          pharma_basket_zscore?: number;
          region?: string;
          signal_date?: string;
          wiki_attention_zscore?: number;
        };
        Relationships: [];
      };
      disease_ticker_mappings: {
        Row: {
          disease_slug: string;
          lead_role: string;
          rationale: string;
          ticker: string;
          weight: number;
        };
        Insert: {
          disease_slug: string;
          lead_role: string;
          rationale: string;
          ticker: string;
          weight: number;
        };
        Update: {
          disease_slug?: string;
          lead_role?: string;
          rationale?: string;
          ticker?: string;
          weight?: number;
        };
        Relationships: [];
      };
      diseases: {
        Row: {
          category: string;
          created_at: string;
          icd11_code: string;
          incubation_days_max: number;
          name: string;
          proximity_radius_km: number;
          sentinel_type: string;
          slug: string;
          symptoms: string[];
          syndromes: string[];
        };
        Insert: {
          category: string;
          created_at?: string;
          icd11_code: string;
          incubation_days_max?: number;
          name: string;
          proximity_radius_km?: number;
          sentinel_type: string;
          slug: string;
          symptoms: string[];
          syndromes: string[];
        };
        Update: {
          category?: string;
          created_at?: string;
          icd11_code?: string;
          incubation_days_max?: number;
          name?: string;
          proximity_radius_km?: number;
          sentinel_type?: string;
          slug?: string;
          symptoms?: string[];
          syndromes?: string[];
        };
        Relationships: [];
      };
      hanta_alerts: {
        Row: {
          created_at: string;
          disease_slug: string;
          id: string;
          level: Database["public"]["Enums"]["alert_level"];
          region: string;
          signal_source: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          disease_slug?: string;
          id?: string;
          level?: Database["public"]["Enums"]["alert_level"];
          region: string;
          signal_source?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          disease_slug?: string;
          id?: string;
          level?: Database["public"]["Enums"]["alert_level"];
          region?: string;
          signal_source?: string;
          title?: string;
        };
        Relationships: [];
      };
      hanta_cases_public: {
        Row: {
          case_id: string;
          created_at: string;
          disease_slug: string;
          id: string;
          lat: number | null;
          lng: number | null;
          region: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          syndrome: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      hanta_cases: {
        Row: {
          age: number | null;
          case_id: string;
          created_at: string;
          disease_slug: string;
          exposure: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          region: string;
          reported_at: string;
          sex: Database["public"]["Enums"]["case_sex"] | null;
          status: Database["public"]["Enums"]["case_status"];
          syndrome: string;
          symptoms: string[];
        };
        Insert: {
          age?: number | null;
          case_id: string;
          created_at?: string;
          disease_slug?: string;
          exposure?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          region: string;
          reported_at?: string;
          sex?: Database["public"]["Enums"]["case_sex"] | null;
          status?: Database["public"]["Enums"]["case_status"];
          syndrome?: string;
          symptoms?: string[];
        };
        Update: {
          age?: number | null;
          case_id?: string;
          created_at?: string;
          disease_slug?: string;
          exposure?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          region?: string;
          reported_at?: string;
          sex?: Database["public"]["Enums"]["case_sex"] | null;
          status?: Database["public"]["Enums"]["case_status"];
          syndrome?: string;
          symptoms?: string[];
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
      market_daily_bars: {
        Row: {
          abnormal_return_1d: number;
          car_7d: number;
          close_price: number;
          created_at: string;
          return_1d: number;
          ticker: string;
          trade_date: string;
          volume: number;
          volume_zscore: number;
        };
        Insert: {
          abnormal_return_1d?: number;
          car_7d?: number;
          close_price: number;
          created_at?: string;
          return_1d?: number;
          ticker: string;
          trade_date: string;
          volume: number;
          volume_zscore?: number;
        };
        Update: {
          abnormal_return_1d?: number;
          car_7d?: number;
          close_price?: number;
          created_at?: string;
          return_1d?: number;
          ticker?: string;
          trade_date?: string;
          volume?: number;
          volume_zscore?: number;
        };
        Relationships: [];
      };
      pharma_tickers: {
        Row: {
          company_name: string;
          created_at: string;
          exchange: string;
          is_pure_play: boolean;
          sector_role: string;
          ticker: string;
        };
        Insert: {
          company_name: string;
          created_at?: string;
          exchange: string;
          is_pure_play?: boolean;
          sector_role: string;
          ticker: string;
        };
        Update: {
          company_name?: string;
          created_at?: string;
          exchange?: string;
          is_pure_play?: boolean;
          sector_role?: string;
          ticker?: string;
        };
        Relationships: [];
      };
      rodent_sites: {
        Row: {
          created_at: string;
          disease_slug: string;
          id: string;
          lat: number;
          lng: number;
          positivity: number;
          region: string;
          sampled_at: string;
          sentinel_type: string;
          site_id: string;
          species: string;
        };
        Insert: {
          created_at?: string;
          disease_slug?: string;
          id?: string;
          lat: number;
          lng: number;
          positivity?: number;
          region: string;
          sampled_at?: string;
          sentinel_type?: string;
          site_id: string;
          species: string;
        };
        Update: {
          created_at?: string;
          disease_slug?: string;
          id?: string;
          lat?: number;
          lng?: number;
          positivity?: number;
          region?: string;
          sampled_at?: string;
          sentinel_type?: string;
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      infra_status: ["ok", "warn", "down"],
      ingest_status: ["success", "failed"],
    },
  },
} as const;
