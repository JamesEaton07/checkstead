// Generated via `npx supabase gen types typescript --linked`, mirroring the
// live schema (supabase/migrations/*.sql). Regenerate after every migration:
//   npx supabase gen types typescript --linked > src/lib/types/database.ts
// then re-append the convenience aliases below the "Convenience aliases" mark.

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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          tenant_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checkin_type: string
          created_at: string
          id: string
          property_id: string
          status: string
          submitted_at: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          checkin_type: string
          created_at?: string
          id?: string
          property_id: string
          status?: string
          submitted_at?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          checkin_type?: string
          created_at?: string
          id?: string
          property_id?: string
          status?: string
          submitted_at?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_rate_limits: {
        Row: {
          attempt_count: number
          email: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          email: string
          window_start?: string
        }
        Update: {
          attempt_count?: number
          email?: string
          window_start?: string
        }
        Relationships: []
      }
      landlords: {
        Row: {
          created_at: string
          days_late_threshold: number
          email: string
          id: string
          notify_email: boolean
          notify_sms: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_late_threshold?: number
          email: string
          id: string
          notify_email?: boolean
          notify_sms?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_late_threshold?: number
          email?: string
          id?: string
          notify_email?: boolean
          notify_sms?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          property_id: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          property_id: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          property_id?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: string
          landlord_id: string
          unit_info: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          landlord_id: string
          unit_info?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          landlord_id?: string
          unit_info?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      reliability_records: {
        Row: {
          checkins_completed: number
          created_at: string
          days_late_avg: number | null
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          checkins_completed?: number
          created_at?: string
          days_late_avg?: number | null
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          checkins_completed?: number
          created_at?: string
          days_late_avg?: number | null
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reliability_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: true
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          lease_status: string
          name: string
          property_id: string
          tenant_access_enabled: boolean
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          lease_status?: string
          name: string
          property_id: string
          tenant_access_enabled?: boolean
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          lease_status?: string
          name?: string
          property_id?: string
          tenant_access_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_access: {
        Args: { p_token: string }
        Returns: {
          active: boolean
          lease_status: string
          property_address: string
          property_id: string
          property_unit_info: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      request_tenant_access: {
        Args: { p_token: string }
        Returns: {
          allowed: boolean
          landlord_email: string
          landlord_notify_email: boolean
          landlord_notify_sms: boolean
          property_address: string
          tenant_name: string
        }[]
      }
      try_consume_email_send: {
        Args: {
          p_email: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// ---------------------------------------------------------------------------
// Convenience aliases
// ---------------------------------------------------------------------------
// The generator only produces `string` for text columns backed by a CHECK
// constraint (not a native Postgres enum), so we narrow those to literal
// unions here for app code. Keep these in sync with the CHECK constraints in
// supabase/migrations/*.sql.

export type LeaseStatus = "active" | "past"
export type CheckinType = "baseline" | "regular" | "move-out"
export type CheckinStatus = "pending" | "submitted" | "overdue"
export type MaintenanceStatus = "open" | "in_progress" | "resolved"
export type SubscriptionTier = "free" | "paid"

export type Landlord = Tables<"landlords">
export type Property = Tables<"properties">
export type Tenant = Omit<Tables<"tenants">, "lease_status"> & {
  lease_status: LeaseStatus
}
export type Checkin = Omit<Tables<"checkins">, "checkin_type" | "status"> & {
  checkin_type: CheckinType
  status: CheckinStatus
}
export type ReliabilityRecord = Tables<"reliability_records">
export type MaintenanceRequest = Omit<Tables<"maintenance_requests">, "status"> & {
  status: MaintenanceStatus
}
export type AccessGrant = Tables<"access_grants">
export type Subscription = Omit<Tables<"subscriptions">, "tier"> & {
  tier: SubscriptionTier
}

export type TenantAccess = Omit<
  Database["public"]["Functions"]["get_tenant_access"]["Returns"][number],
  "lease_status"
> & {
  lease_status: LeaseStatus
}

export type TenantAccessRequest =
  Database["public"]["Functions"]["request_tenant_access"]["Returns"][number]
