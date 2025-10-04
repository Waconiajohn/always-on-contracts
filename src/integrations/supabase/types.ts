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
      agent_sessions: {
        Row: {
          coach_personality: string
          configuration: Json
          context_data: string | null
          context_digest: string | null
          created_at: string | null
          current_phase: string | null
          expires_at: string
          id: string
          intensity_level: string
          job_run_id: string | null
          last_accessed: string | null
          metadata: Json | null
          session_state: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_personality: string
          configuration?: Json
          context_data?: string | null
          context_digest?: string | null
          created_at?: string | null
          current_phase?: string | null
          expires_at?: string
          id?: string
          intensity_level: string
          job_run_id?: string | null
          last_accessed?: string | null
          metadata?: Json | null
          session_state?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_personality?: string
          configuration?: Json
          context_data?: string | null
          context_digest?: string | null
          created_at?: string | null
          current_phase?: string | null
          expires_at?: string
          id?: string
          intensity_level?: string
          job_run_id?: string | null
          last_accessed?: string | null
          metadata?: Json | null
          session_state?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_job_run_id_fkey"
            columns: ["job_run_id"]
            isOneToOne: false
            referencedRelation: "application_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      application_queue: {
        Row: {
          ai_customization_notes: string | null
          applied_at: string | null
          conversation_data: Json | null
          created_at: string | null
          critical_qualifications: string[] | null
          customized_resume_content: Json | null
          customized_resume_url: string | null
          id: string
          keyword_analysis: Json | null
          match_score: number
          opportunity_id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_customization_notes?: string | null
          applied_at?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          critical_qualifications?: string[] | null
          customized_resume_content?: Json | null
          customized_resume_url?: string | null
          id?: string
          keyword_analysis?: Json | null
          match_score: number
          opportunity_id: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_customization_notes?: string | null
          applied_at?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          critical_qualifications?: string[] | null
          customized_resume_content?: Json | null
          customized_resume_url?: string | null
          id?: string
          keyword_analysis?: Json | null
          match_score?: number
          opportunity_id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_queue_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      application_tracking: {
        Row: {
          apify_run_id: string | null
          application_method: string | null
          cover_letter_text: string | null
          created_at: string | null
          customized_resume_url: string | null
          error_message: string | null
          id: string
          opportunity_id: string
          response_data: Json | null
          response_received_at: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apify_run_id?: string | null
          application_method?: string | null
          cover_letter_text?: string | null
          created_at?: string | null
          customized_resume_url?: string | null
          error_message?: string | null
          id?: string
          opportunity_id: string
          response_data?: Json | null
          response_received_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apify_run_id?: string | null
          application_method?: string | null
          cover_letter_text?: string | null
          created_at?: string | null
          customized_resume_url?: string | null
          error_message?: string | null
          id?: string
          opportunity_id?: string
          response_data?: Json | null
          response_received_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_tracking_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          ats_score: number | null
          competitiveness_score: number | null
          content: string
          created_at: string | null
          id: string
          job_run_id: string | null
          kind: string
          metadata: Json | null
          quality_score: number | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          ats_score?: number | null
          competitiveness_score?: number | null
          content: string
          created_at?: string | null
          id?: string
          job_run_id?: string | null
          kind: string
          metadata?: Json | null
          quality_score?: number | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          ats_score?: number | null
          competitiveness_score?: number | null
          content?: string
          created_at?: string | null
          id?: string
          job_run_id?: string | null
          kind?: string
          metadata?: Json | null
          quality_score?: number | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_job_run_id_fkey"
            columns: ["job_run_id"]
            isOneToOne: false
            referencedRelation: "application_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      career_war_chest: {
        Row: {
          created_at: string
          id: string
          initial_analysis: Json | null
          interview_completion_percentage: number | null
          last_updated_at: string
          overall_strength_score: number | null
          resume_raw_text: string | null
          total_hidden_competencies: number | null
          total_power_phrases: number | null
          total_transferable_skills: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_analysis?: Json | null
          interview_completion_percentage?: number | null
          last_updated_at?: string
          overall_strength_score?: number | null
          resume_raw_text?: string | null
          total_hidden_competencies?: number | null
          total_power_phrases?: number | null
          total_transferable_skills?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_analysis?: Json | null
          interview_completion_percentage?: number | null
          last_updated_at?: string
          overall_strength_score?: number | null
          resume_raw_text?: string | null
          total_hidden_competencies?: number | null
          total_power_phrases?: number | null
          total_transferable_skills?: number | null
          user_id?: string
        }
        Relationships: []
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
      job_alerts: {
        Row: {
          alert_name: string
          created_at: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          search_criteria: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_name: string
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          search_criteria: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_name?: string
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          search_criteria?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: string
          opportunity_id: string
          suggested_correction: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: string
          opportunity_id: string
          suggested_correction?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          opportunity_id?: string
          suggested_correction?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_feedback_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          ai_analysis: Json | null
          apply_url: string | null
          benefits: string[] | null
          company_logo_url: string | null
          company_name: string
          company_url: string | null
          created_at: string | null
          employment_type: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          job_description: string | null
          job_title: string
          location: string | null
          match_score: number | null
          posted_date: string | null
          raw_data: Json | null
          remote_type: string | null
          requirements: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          search_session_id: string | null
          source: string
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          apply_url?: string | null
          benefits?: string[] | null
          company_logo_url?: string | null
          company_name: string
          company_url?: string | null
          created_at?: string | null
          employment_type?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          job_description?: string | null
          job_title: string
          location?: string | null
          match_score?: number | null
          posted_date?: string | null
          raw_data?: Json | null
          remote_type?: string | null
          requirements?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          search_session_id?: string | null
          source: string
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          apply_url?: string | null
          benefits?: string[] | null
          company_logo_url?: string | null
          company_name?: string
          company_url?: string | null
          created_at?: string | null
          employment_type?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          job_description?: string | null
          job_title?: string
          location?: string | null
          match_score?: number | null
          posted_date?: string | null
          raw_data?: Json | null
          remote_type?: string | null
          requirements?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          search_session_id?: string | null
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_search_session_id_fkey"
            columns: ["search_session_id"]
            isOneToOne: false
            referencedRelation: "job_search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_opportunities: {
        Row: {
          agency_id: string | null
          ai_analysis: Json | null
          ai_verified_at: string | null
          contract_confidence_score: number | null
          contract_duration_months: number | null
          contract_type: string | null
          created_at: string | null
          duplicate_of: string | null
          expiry_date: string | null
          external_id: string | null
          external_source: string | null
          external_url: string | null
          extracted_duration_months: number | null
          extracted_rate_max: number | null
          extracted_rate_min: number | null
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
          quality_score_details: Json | null
          raw_data: Json | null
          required_skills: string[] | null
          scraped_salary_data: Json | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_feedback: Json | null
        }
        Insert: {
          agency_id?: string | null
          ai_analysis?: Json | null
          ai_verified_at?: string | null
          contract_confidence_score?: number | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string | null
          duplicate_of?: string | null
          expiry_date?: string | null
          external_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_duration_months?: number | null
          extracted_rate_max?: number | null
          extracted_rate_min?: number | null
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
          quality_score_details?: Json | null
          raw_data?: Json | null
          required_skills?: string[] | null
          scraped_salary_data?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_feedback?: Json | null
        }
        Update: {
          agency_id?: string | null
          ai_analysis?: Json | null
          ai_verified_at?: string | null
          contract_confidence_score?: number | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string | null
          duplicate_of?: string | null
          expiry_date?: string | null
          external_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_duration_months?: number | null
          extracted_rate_max?: number | null
          extracted_rate_min?: number | null
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
          quality_score_details?: Json | null
          raw_data?: Json | null
          required_skills?: string[] | null
          scraped_salary_data?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_feedback?: Json | null
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
      job_projects: {
        Row: {
          company_name: string | null
          created_at: string
          external_job_url: string | null
          id: string
          interview_prep_data: Json | null
          job_description: string | null
          job_listing_id: string | null
          job_source: string | null
          job_title: string | null
          metadata: Json | null
          notes: string | null
          opportunity_id: string | null
          project_name: string
          resume_version_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          external_job_url?: string | null
          id?: string
          interview_prep_data?: Json | null
          job_description?: string | null
          job_listing_id?: string | null
          job_source?: string | null
          job_title?: string | null
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          project_name: string
          resume_version_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          external_job_url?: string | null
          id?: string
          interview_prep_data?: Json | null
          job_description?: string | null
          job_listing_id?: string | null
          job_source?: string | null
          job_title?: string | null
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          project_name?: string
          resume_version_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_projects_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      job_search_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          filters: Json | null
          id: string
          results_count: number | null
          search_query: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
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
          agency_id: string
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
          agency_id: string
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
          agency_id?: string
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
      persona_conversations: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          persona_id: string
          sender: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          persona_id: string
          sender: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          persona_id?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      persona_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          memory_type: string
          persona_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          memory_type: string
          persona_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          persona_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          automation_activated_at: string | null
          automation_enabled: boolean | null
          automation_mode: string | null
          base_resume: string | null
          career_goals: string | null
          core_skills: string[] | null
          created_at: string | null
          current_employment_status: string | null
          current_title: string | null
          custom_target_rate_max: number | null
          custom_target_rate_min: number | null
          email: string | null
          full_name: string | null
          id: string
          industry_preferences: Json | null
          key_achievements: string[] | null
          match_threshold_auto_apply: number | null
          match_threshold_queue: number | null
          max_daily_applications: number | null
          phone: string | null
          preferred_location: string | null
          role_preferences: Json | null
          strategy_customized: boolean | null
          subscription_tier: string | null
          target_industries: string[] | null
          target_positions: string[] | null
          target_salary: string | null
          updated_at: string | null
          user_id: string
          why_me_narratives: Json | null
          work_style_preferences: Json | null
          years_experience: number | null
        }
        Insert: {
          automation_activated_at?: string | null
          automation_enabled?: boolean | null
          automation_mode?: string | null
          base_resume?: string | null
          career_goals?: string | null
          core_skills?: string[] | null
          created_at?: string | null
          current_employment_status?: string | null
          current_title?: string | null
          custom_target_rate_max?: number | null
          custom_target_rate_min?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry_preferences?: Json | null
          key_achievements?: string[] | null
          match_threshold_auto_apply?: number | null
          match_threshold_queue?: number | null
          max_daily_applications?: number | null
          phone?: string | null
          preferred_location?: string | null
          role_preferences?: Json | null
          strategy_customized?: boolean | null
          subscription_tier?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          target_salary?: string | null
          updated_at?: string | null
          user_id: string
          why_me_narratives?: Json | null
          work_style_preferences?: Json | null
          years_experience?: number | null
        }
        Update: {
          automation_activated_at?: string | null
          automation_enabled?: boolean | null
          automation_mode?: string | null
          base_resume?: string | null
          career_goals?: string | null
          core_skills?: string[] | null
          created_at?: string | null
          current_employment_status?: string | null
          current_title?: string | null
          custom_target_rate_max?: number | null
          custom_target_rate_min?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry_preferences?: Json | null
          key_achievements?: string[] | null
          match_threshold_auto_apply?: number | null
          match_threshold_queue?: number | null
          max_daily_applications?: number | null
          phone?: string | null
          preferred_location?: string | null
          role_preferences?: Json | null
          strategy_customized?: boolean | null
          subscription_tier?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          target_salary?: string | null
          updated_at?: string | null
          user_id?: string
          why_me_narratives?: Json | null
          work_style_preferences?: Json | null
          years_experience?: number | null
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
      star_stories: {
        Row: {
          action: string
          created_at: string | null
          id: string
          industry: string | null
          metrics: Json | null
          result: string
          situation: string
          skills: Json | null
          task: string
          timeframe: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          industry?: string | null
          metrics?: Json | null
          result: string
          situation: string
          skills?: Json | null
          task: string
          timeframe?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          industry?: string | null
          metrics?: Json | null
          result?: string
          situation?: string
          skills?: Json | null
          task?: string
          timeframe?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
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
      user_saved_jobs: {
        Row: {
          applied_at: string | null
          id: string
          job_listing_id: string
          notes: string | null
          saved_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_listing_id: string
          notes?: string | null
          saved_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_listing_id?: string
          notes?: string | null
          saved_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_jobs_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_search_profiles: {
        Row: {
          company_size_preferences: string[] | null
          created_at: string | null
          excluded_companies: string[] | null
          excluded_keywords: string[] | null
          hybrid_acceptable: boolean | null
          id: string
          is_active: boolean | null
          location_radius_miles: number | null
          max_contract_months: number | null
          max_hourly_rate: number | null
          min_contract_months: number | null
          min_hourly_rate: number | null
          minimum_match_score: number | null
          onsite_acceptable: boolean | null
          preferred_locations: string[] | null
          preferred_skills: string[] | null
          profile_name: string
          remote_only: boolean | null
          required_skills: string[] | null
          skill_weights: Json | null
          target_industries: string[] | null
          target_positions: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_size_preferences?: string[] | null
          created_at?: string | null
          excluded_companies?: string[] | null
          excluded_keywords?: string[] | null
          hybrid_acceptable?: boolean | null
          id?: string
          is_active?: boolean | null
          location_radius_miles?: number | null
          max_contract_months?: number | null
          max_hourly_rate?: number | null
          min_contract_months?: number | null
          min_hourly_rate?: number | null
          minimum_match_score?: number | null
          onsite_acceptable?: boolean | null
          preferred_locations?: string[] | null
          preferred_skills?: string[] | null
          profile_name: string
          remote_only?: boolean | null
          required_skills?: string[] | null
          skill_weights?: Json | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_size_preferences?: string[] | null
          created_at?: string | null
          excluded_companies?: string[] | null
          excluded_keywords?: string[] | null
          hybrid_acceptable?: boolean | null
          id?: string
          is_active?: boolean | null
          location_radius_miles?: number | null
          max_contract_months?: number | null
          max_hourly_rate?: number | null
          min_contract_months?: number | null
          min_hourly_rate?: number | null
          minimum_match_score?: number | null
          onsite_acceptable?: boolean | null
          preferred_locations?: string[] | null
          preferred_skills?: string[] | null
          profile_name?: string
          remote_only?: boolean | null
          required_skills?: string[] | null
          skill_weights?: Json | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      war_chest_hidden_competencies: {
        Row: {
          certification_equivalent: string | null
          competency_area: string
          confidence_score: number | null
          created_at: string
          id: string
          inferred_capability: string
          supporting_evidence: string[]
          user_id: string
          war_chest_id: string
        }
        Insert: {
          certification_equivalent?: string | null
          competency_area: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          inferred_capability: string
          supporting_evidence?: string[]
          user_id: string
          war_chest_id: string
        }
        Update: {
          certification_equivalent?: string | null
          competency_area?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          inferred_capability?: string
          supporting_evidence?: string[]
          user_id?: string
          war_chest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_hidden_competencies_war_chest_id_fkey"
            columns: ["war_chest_id"]
            isOneToOne: false
            referencedRelation: "career_war_chest"
            referencedColumns: ["id"]
          },
        ]
      }
      war_chest_interview_responses: {
        Row: {
          created_at: string
          extracted_insights: Json | null
          follow_up_questions: Json | null
          id: string
          phase: string
          question: string
          response: string
          user_id: string
          war_chest_id: string
        }
        Insert: {
          created_at?: string
          extracted_insights?: Json | null
          follow_up_questions?: Json | null
          id?: string
          phase: string
          question: string
          response: string
          user_id: string
          war_chest_id: string
        }
        Update: {
          created_at?: string
          extracted_insights?: Json | null
          follow_up_questions?: Json | null
          id?: string
          phase?: string
          question?: string
          response?: string
          user_id?: string
          war_chest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_interview_responses_war_chest_id_fkey"
            columns: ["war_chest_id"]
            isOneToOne: false
            referencedRelation: "career_war_chest"
            referencedColumns: ["id"]
          },
        ]
      }
      war_chest_power_phrases: {
        Row: {
          category: string
          confidence_score: number | null
          created_at: string
          id: string
          impact_metrics: Json | null
          keywords: string[] | null
          original_text: string | null
          power_phrase: string
          source: string | null
          user_id: string
          war_chest_id: string
        }
        Insert: {
          category: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          impact_metrics?: Json | null
          keywords?: string[] | null
          original_text?: string | null
          power_phrase: string
          source?: string | null
          user_id: string
          war_chest_id: string
        }
        Update: {
          category?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          impact_metrics?: Json | null
          keywords?: string[] | null
          original_text?: string | null
          power_phrase?: string
          source?: string | null
          user_id?: string
          war_chest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_power_phrases_war_chest_id_fkey"
            columns: ["war_chest_id"]
            isOneToOne: false
            referencedRelation: "career_war_chest"
            referencedColumns: ["id"]
          },
        ]
      }
      war_chest_transferable_skills: {
        Row: {
          confidence_score: number | null
          created_at: string
          equivalent_skills: string[]
          evidence: string
          id: string
          stated_skill: string
          user_id: string
          war_chest_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          equivalent_skills?: string[]
          evidence: string
          id?: string
          stated_skill: string
          user_id: string
          war_chest_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          equivalent_skills?: string[]
          evidence?: string
          id?: string
          stated_skill?: string
          user_id?: string
          war_chest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_transferable_skills_war_chest_id_fkey"
            columns: ["war_chest_id"]
            isOneToOne: false
            referencedRelation: "career_war_chest"
            referencedColumns: ["id"]
          },
        ]
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
