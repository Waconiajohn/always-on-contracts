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
      agency_ratings: {
        Row: {
          agency_id: string
          contract_obtained: boolean | null
          created_at: string | null
          id: string
          professionalism_rating: number | null
          rating: number
          response_time_rating: number | null
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          contract_obtained?: boolean | null
          created_at?: string | null
          id?: string
          professionalism_rating?: number | null
          rating: number
          response_time_rating?: number | null
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          contract_obtained?: boolean | null
          created_at?: string | null
          id?: string
          professionalism_rating?: number | null
          rating?: number
          response_time_rating?: number | null
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_ratings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "staffing_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body_content: string
          created_at: string
          id: string
          subject_line: string | null
          template_name: string
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body_content: string
          created_at?: string
          id?: string
          subject_line?: string | null
          template_name: string
          template_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body_content?: string
          created_at?: string
          id?: string
          subject_line?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_opportunities: {
        Row: {
          agency_id: string | null
          ai_analysis: Json | null
          contract_duration_months: number | null
          contract_type: string | null
          created_at: string | null
          duplicate_of: string | null
          expiry_date: string | null
          external_id: string | null
          external_source: string | null
          external_url: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          is_duplicate: boolean | null
          is_external: boolean | null
          is_verified_contract: boolean | null
          job_description: string | null
          job_title: string
          last_synced_at: string | null
          location: string | null
          market_rate_max: number | null
          market_rate_min: number | null
          market_rate_percentile: number | null
          posted_date: string | null
          quality_score: number | null
          raw_data: Json | null
          required_skills: string[] | null
          scraped_salary_data: Json | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          ai_analysis?: Json | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string | null
          duplicate_of?: string | null
          expiry_date?: string | null
          external_id?: string | null
          external_source?: string | null
          external_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_duplicate?: boolean | null
          is_external?: boolean | null
          is_verified_contract?: boolean | null
          job_description?: string | null
          job_title: string
          last_synced_at?: string | null
          location?: string | null
          market_rate_max?: number | null
          market_rate_min?: number | null
          market_rate_percentile?: number | null
          posted_date?: string | null
          quality_score?: number | null
          raw_data?: Json | null
          required_skills?: string[] | null
          scraped_salary_data?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          ai_analysis?: Json | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string | null
          duplicate_of?: string | null
          expiry_date?: string | null
          external_id?: string | null
          external_source?: string | null
          external_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_duplicate?: boolean | null
          is_external?: boolean | null
          is_verified_contract?: boolean | null
          job_description?: string | null
          job_title?: string
          last_synced_at?: string | null
          location?: string | null
          market_rate_max?: number | null
          market_rate_min?: number | null
          market_rate_percentile?: number | null
          posted_date?: string | null
          quality_score?: number | null
          raw_data?: Json | null
          required_skills?: string[] | null
          scraped_salary_data?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_opportunities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "staffing_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_opportunities_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_matches: {
        Row: {
          ai_recommendation: string | null
          applied_date: string | null
          created_at: string | null
          id: string
          match_score: number | null
          matching_skills: string[] | null
          opportunity_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          applied_date?: string | null
          created_at?: string | null
          id?: string
          match_score?: number | null
          matching_skills?: string[] | null
          opportunity_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          ai_recommendation?: string | null
          applied_date?: string | null
          created_at?: string | null
          id?: string
          match_score?: number | null
          matching_skills?: string[] | null
          opportunity_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_tracking: {
        Row: {
          agency_id: string | null
          campaign_id: string | null
          created_at: string | null
          email_sent_count: number | null
          id: string
          last_contact_date: string | null
          last_email_sent_date: string | null
          next_follow_up_date: string | null
          notes: string | null
          outreach_type: string | null
          response_date: string | null
          response_received: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          email_sent_count?: number | null
          id?: string
          last_contact_date?: string | null
          last_email_sent_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          outreach_type?: string | null
          response_date?: string | null
          response_received?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          email_sent_count?: number | null
          id?: string
          last_contact_date?: string | null
          last_email_sent_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          outreach_type?: string | null
          response_date?: string | null
          response_received?: boolean | null
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
          contract_focus_rating: number | null
          contract_permanent_split: string | null
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          specialization: string[] | null
          typical_contract_duration_max: number | null
          typical_contract_duration_min: number | null
          typical_rate_max: number | null
          typical_rate_min: number | null
          website: string | null
        }
        Insert: {
          agency_name: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_focus_rating?: number | null
          contract_permanent_split?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          specialization?: string[] | null
          typical_contract_duration_max?: number | null
          typical_contract_duration_min?: number | null
          typical_rate_max?: number | null
          typical_rate_min?: number | null
          website?: string | null
        }
        Update: {
          agency_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_focus_rating?: number | null
          contract_permanent_split?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          specialization?: string[] | null
          typical_contract_duration_max?: number | null
          typical_contract_duration_min?: number | null
          typical_rate_max?: number | null
          typical_rate_min?: number | null
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
      user_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
