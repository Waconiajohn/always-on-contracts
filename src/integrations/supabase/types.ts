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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      outreach_tracking: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          last_contact_date: string | null
          notes: string | null
          outreach_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          outreach_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          outreach_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_tracking_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "staffing_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_employment_status: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_employment_status?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_employment_status?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_history: {
        Row: {
          contract_length_months: number | null
          hourly_rate: number | null
          id: string
          industry: string | null
          location: string | null
          position_title: string
          recorded_date: string | null
        }
        Insert: {
          contract_length_months?: number | null
          hourly_rate?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          position_title: string
          recorded_date?: string | null
        }
        Update: {
          contract_length_months?: number | null
          hourly_rate?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          position_title?: string
          recorded_date?: string | null
        }
        Relationships: []
      }
      resume_analysis: {
        Row: {
          analysis_summary: string | null
          created_at: string | null
          id: string
          industry_expertise: string[] | null
          key_achievements: string[] | null
          management_capabilities: string[] | null
          recommended_positions: string[] | null
          resume_id: string
          skills: string[] | null
          target_hourly_rate_max: number | null
          target_hourly_rate_min: number | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          analysis_summary?: string | null
          created_at?: string | null
          id?: string
          industry_expertise?: string[] | null
          key_achievements?: string[] | null
          management_capabilities?: string[] | null
          recommended_positions?: string[] | null
          resume_id: string
          skills?: string[] | null
          target_hourly_rate_max?: number | null
          target_hourly_rate_min?: number | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          analysis_summary?: string | null
          created_at?: string | null
          id?: string
          industry_expertise?: string[] | null
          key_achievements?: string[] | null
          management_capabilities?: string[] | null
          recommended_positions?: string[] | null
          resume_id?: string
          skills?: string[] | null
          target_hourly_rate_max?: number | null
          target_hourly_rate_min?: number | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_analysis_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          file_name: string
          file_url: string
          id: string
          parsed_content: Json | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          parsed_content?: Json | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          parsed_content?: Json | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staffing_agencies: {
        Row: {
          agency_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          specialization: string[] | null
          website: string | null
        }
        Insert: {
          agency_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Update: {
          agency_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      strategies: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          geographic_markets: string[] | null
          id: string
          positioning_strategy: string | null
          target_industries: string[] | null
          target_positions: string[] | null
          timeline_weeks: number | null
          user_id: string
          value_proposition: string | null
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          geographic_markets?: string[] | null
          id?: string
          positioning_strategy?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          timeline_weeks?: number | null
          user_id: string
          value_proposition?: string | null
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          geographic_markets?: string[] | null
          id?: string
          positioning_strategy?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          timeline_weeks?: number | null
          user_id?: string
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
