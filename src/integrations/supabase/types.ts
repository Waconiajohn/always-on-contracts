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
      admin_prompt_overrides: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          original_prompt: string
          override_prompt: string
          prompt_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          original_prompt: string
          override_prompt: string
          prompt_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          original_prompt?: string
          override_prompt?: string
          prompt_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount_cents: number
          created_at: string
          currency: string | null
          id: string
          paid_at: string | null
          referral_id: string
          status: string
          stripe_transfer_id: string | null
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          referral_id: string
          status?: string
          stripe_transfer_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string
          status?: string
          stripe_transfer_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_fraud_flags: {
        Row: {
          affiliate_id: string
          created_at: string
          description: string | null
          flag_type: string
          id: string
          resolved: boolean | null
          severity: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          description?: string | null
          flag_type: string
          id?: string
          resolved?: boolean | null
          severity: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          description?: string | null
          flag_type?: string
          id?: string
          resolved?: boolean | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_fraud_flags_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          converted_at: string | null
          created_at: string
          id: string
          referral_token: string | null
          referred_user_id: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_token?: string | null
          referred_user_id: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_token?: string | null
          referred_user_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          payout_email: string | null
          referral_code: string
          status: string
          total_earnings_cents: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          referral_code: string
          status?: string
          total_earnings_cents?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          referral_code?: string
          status?: string
          total_earnings_cents?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ai_match_feedback: {
        Row: {
          action: string
          created_at: string | null
          feedback_notes: string | null
          id: string
          match_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          feedback_notes?: string | null
          id?: string
          match_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          feedback_notes?: string | null
          id?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_match_feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "opportunity_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_responses: {
        Row: {
          ai_reasoning: string | null
          confidence_score: number | null
          created_at: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          model_used: string | null
          parsed_data: Json | null
          pass_type: string
          prompt_version: string | null
          raw_response: string | null
          session_id: string
          usage: Json | null
        }
        Insert: {
          ai_reasoning?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          parsed_data?: Json | null
          pass_type: string
          prompt_version?: string | null
          raw_response?: string | null
          session_id: string
          usage?: Json | null
        }
        Update: {
          ai_reasoning?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          parsed_data?: Json | null
          pass_type?: string
          prompt_version?: string | null
          raw_response?: string | null
          session_id?: string
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "extraction_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_metrics: {
        Row: {
          cost_usd: number | null
          created_at: string
          error_code: string | null
          execution_time_ms: number | null
          function_name: string | null
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          prompt_tokens_cached: number | null
          provider: string
          request_id: string | null
          retry_count: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          prompt_tokens_cached?: number | null
          provider?: string
          request_id?: string | null
          retry_count?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          prompt_tokens_cached?: number | null
          provider?: string
          request_id?: string | null
          retry_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      application_queue: {
        Row: {
          ai_customization_notes: string | null
          application_status: string | null
          applied_at: string | null
          company_name: string | null
          conversation_data: Json | null
          created_at: string | null
          critical_qualifications: string[] | null
          customized_resume_content: Json | null
          customized_resume_url: string | null
          id: string
          interview_date: string | null
          interview_prep_session_id: string | null
          keyword_analysis: Json | null
          match_score: number
          networking_contacts: Json | null
          networking_initiated: boolean | null
          notes: string | null
          offer_amount: number | null
          offer_bonus: number | null
          offer_equity: string | null
          opportunity_id: string
          project_name: string | null
          reviewed_at: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          ai_customization_notes?: string | null
          application_status?: string | null
          applied_at?: string | null
          company_name?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          critical_qualifications?: string[] | null
          customized_resume_content?: Json | null
          customized_resume_url?: string | null
          id?: string
          interview_date?: string | null
          interview_prep_session_id?: string | null
          keyword_analysis?: Json | null
          match_score: number
          networking_contacts?: Json | null
          networking_initiated?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_bonus?: number | null
          offer_equity?: string | null
          opportunity_id: string
          project_name?: string | null
          reviewed_at?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          ai_customization_notes?: string | null
          application_status?: string | null
          applied_at?: string | null
          company_name?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          critical_qualifications?: string[] | null
          customized_resume_content?: Json | null
          customized_resume_url?: string | null
          id?: string
          interview_date?: string | null
          interview_prep_session_id?: string | null
          keyword_analysis?: Json | null
          match_score?: number
          networking_contacts?: Json | null
          networking_initiated?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_bonus?: number | null
          offer_equity?: string | null
          opportunity_id?: string
          project_name?: string | null
          reviewed_at?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_queue_interview_prep_session_id_fkey"
            columns: ["interview_prep_session_id"]
            isOneToOne: false
            referencedRelation: "interview_prep_sessions"
            referencedColumns: ["id"]
          },
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
          success_modal_shown: boolean | null
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
          success_modal_shown?: boolean | null
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
          success_modal_shown?: boolean | null
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
      career_trends: {
        Row: {
          description: string
          discovered_at: string | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          relevance_score: number | null
          source_url: string | null
          trend_category: string
          trend_title: string
        }
        Insert: {
          description: string
          discovered_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          relevance_score?: number | null
          source_url?: string | null
          trend_category: string
          trend_title: string
        }
        Update: {
          description?: string
          discovered_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          relevance_score?: number | null
          source_url?: string | null
          trend_category?: string
          trend_title?: string
        }
        Relationships: []
      }
      career_vault: {
        Row: {
          auto_populated: boolean | null
          auto_population_confidence: string | null
          benchmark_comparison: Json | null
          benchmark_generated_at: string | null
          benchmark_role_level: string | null
          benchmark_standard: Json | null
          career_direction: string | null
          created_at: string
          current_phase: number | null
          excluded_industries: string[] | null
          extraction_completeness_score: number | null
          extraction_item_count: number | null
          extraction_quality: string | null
          extraction_run_id: string | null
          extraction_status: string | null
          extraction_timestamp: string | null
          focus_set_at: string | null
          gap_analysis: Json | null
          id: string
          industry_research_completed: boolean | null
          initial_analysis: Json | null
          intelligence_builder_completed: boolean | null
          intelligent_qa_completed: boolean | null
          interview_completion_percentage: number | null
          last_extraction_session_id: string | null
          last_gap_analysis_at: string | null
          last_refreshed_at: string | null
          last_updated_at: string
          onboarding_step: string | null
          overall_strength_score: number | null
          resume_raw_text: string | null
          review_completion_percentage: number | null
          target_industries: string[] | null
          target_roles: string[] | null
          total_behavioral_indicators: number | null
          total_executive_presence: number | null
          total_hidden_competencies: number | null
          total_leadership_philosophy: number | null
          total_personality_traits: number | null
          total_power_phrases: number | null
          total_soft_skills: number | null
          total_transferable_skills: number | null
          total_values: number | null
          total_work_style: number | null
          user_id: string
          vault_name: string | null
          vault_strength_after_qa: number | null
          vault_strength_before_qa: number | null
          vault_version: string | null
        }
        Insert: {
          auto_populated?: boolean | null
          auto_population_confidence?: string | null
          benchmark_comparison?: Json | null
          benchmark_generated_at?: string | null
          benchmark_role_level?: string | null
          benchmark_standard?: Json | null
          career_direction?: string | null
          created_at?: string
          current_phase?: number | null
          excluded_industries?: string[] | null
          extraction_completeness_score?: number | null
          extraction_item_count?: number | null
          extraction_quality?: string | null
          extraction_run_id?: string | null
          extraction_status?: string | null
          extraction_timestamp?: string | null
          focus_set_at?: string | null
          gap_analysis?: Json | null
          id?: string
          industry_research_completed?: boolean | null
          initial_analysis?: Json | null
          intelligence_builder_completed?: boolean | null
          intelligent_qa_completed?: boolean | null
          interview_completion_percentage?: number | null
          last_extraction_session_id?: string | null
          last_gap_analysis_at?: string | null
          last_refreshed_at?: string | null
          last_updated_at?: string
          onboarding_step?: string | null
          overall_strength_score?: number | null
          resume_raw_text?: string | null
          review_completion_percentage?: number | null
          target_industries?: string[] | null
          target_roles?: string[] | null
          total_behavioral_indicators?: number | null
          total_executive_presence?: number | null
          total_hidden_competencies?: number | null
          total_leadership_philosophy?: number | null
          total_personality_traits?: number | null
          total_power_phrases?: number | null
          total_soft_skills?: number | null
          total_transferable_skills?: number | null
          total_values?: number | null
          total_work_style?: number | null
          user_id: string
          vault_name?: string | null
          vault_strength_after_qa?: number | null
          vault_strength_before_qa?: number | null
          vault_version?: string | null
        }
        Update: {
          auto_populated?: boolean | null
          auto_population_confidence?: string | null
          benchmark_comparison?: Json | null
          benchmark_generated_at?: string | null
          benchmark_role_level?: string | null
          benchmark_standard?: Json | null
          career_direction?: string | null
          created_at?: string
          current_phase?: number | null
          excluded_industries?: string[] | null
          extraction_completeness_score?: number | null
          extraction_item_count?: number | null
          extraction_quality?: string | null
          extraction_run_id?: string | null
          extraction_status?: string | null
          extraction_timestamp?: string | null
          focus_set_at?: string | null
          gap_analysis?: Json | null
          id?: string
          industry_research_completed?: boolean | null
          initial_analysis?: Json | null
          intelligence_builder_completed?: boolean | null
          intelligent_qa_completed?: boolean | null
          interview_completion_percentage?: number | null
          last_extraction_session_id?: string | null
          last_gap_analysis_at?: string | null
          last_refreshed_at?: string | null
          last_updated_at?: string
          onboarding_step?: string | null
          overall_strength_score?: number | null
          resume_raw_text?: string | null
          review_completion_percentage?: number | null
          target_industries?: string[] | null
          target_roles?: string[] | null
          total_behavioral_indicators?: number | null
          total_executive_presence?: number | null
          total_hidden_competencies?: number | null
          total_leadership_philosophy?: number | null
          total_personality_traits?: number | null
          total_power_phrases?: number | null
          total_soft_skills?: number | null
          total_transferable_skills?: number | null
          total_values?: number | null
          total_work_style?: number | null
          user_id?: string
          vault_name?: string | null
          vault_strength_after_qa?: number | null
          vault_strength_before_qa?: number | null
          vault_version?: string | null
        }
        Relationships: []
      }
      career_vault_industry_research: {
        Row: {
          common_skills: Json | null
          created_at: string
          id: string
          industry_trends: Json | null
          key_metrics: Json | null
          leadership_traits: Json | null
          research_content: string
          research_provider: string
          target_industry: string
          target_role: string
          updated_at: string
          user_id: string
          vault_id: string | null
        }
        Insert: {
          common_skills?: Json | null
          created_at?: string
          id?: string
          industry_trends?: Json | null
          key_metrics?: Json | null
          leadership_traits?: Json | null
          research_content: string
          research_provider?: string
          target_industry: string
          target_role: string
          updated_at?: string
          user_id: string
          vault_id?: string | null
        }
        Update: {
          common_skills?: Json | null
          created_at?: string
          id?: string
          industry_trends?: Json | null
          key_metrics?: Json | null
          leadership_traits?: Json | null
          research_content?: string
          research_provider?: string
          target_industry?: string
          target_role?: string
          updated_at?: string
          user_id?: string
          vault_id?: string | null
        }
        Relationships: []
      }
      career_vault_intelligent_responses: {
        Row: {
          batch_number: number | null
          created_at: string
          id: string
          items_created: number | null
          processed_items: Json | null
          responses: Json
          updated_at: string
          user_id: string
          vault_id: string
        }
        Insert: {
          batch_number?: number | null
          created_at?: string
          id?: string
          items_created?: number | null
          processed_items?: Json | null
          responses?: Json
          updated_at?: string
          user_id: string
          vault_id: string
        }
        Update: {
          batch_number?: number | null
          created_at?: string
          id?: string
          items_created?: number | null
          processed_items?: Json | null
          responses?: Json
          updated_at?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: []
      }
      coaching_sessions: {
        Row: {
          booking_confirmed: boolean | null
          calendly_link: string
          coach_name: string | null
          coach_title: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_platinum_only: boolean | null
          meeting_notes: string | null
          scheduled_date: string | null
          session_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          zoom_link: string | null
        }
        Insert: {
          booking_confirmed?: boolean | null
          calendly_link: string
          coach_name?: string | null
          coach_title?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_platinum_only?: boolean | null
          meeting_notes?: string | null
          scheduled_date?: string | null
          session_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          zoom_link?: string | null
        }
        Update: {
          booking_confirmed?: boolean | null
          calendly_link?: string
          coach_name?: string | null
          coach_title?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_platinum_only?: boolean | null
          meeting_notes?: string | null
          scheduled_date?: string | null
          session_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          zoom_link?: string | null
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
      conversation_context: {
        Row: {
          context_summary: string | null
          conversation_id: string
          created_at: string | null
          current_plan: Json | null
          id: string
          issues_identified: Json[] | null
          issues_resolved: Json[] | null
          last_updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_summary?: string | null
          conversation_id: string
          created_at?: string | null
          current_plan?: Json | null
          id?: string
          issues_identified?: Json[] | null
          issues_resolved?: Json[] | null
          last_updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_summary?: string | null
          conversation_id?: string
          created_at?: string | null
          current_plan?: Json | null
          id?: string
          issues_identified?: Json[] | null
          issues_resolved?: Json[] | null
          last_updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      evidence_matrix_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_complete: boolean | null
          job_id: string | null
          metadata: Json | null
          requirements_json: Json
          selections_json: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          requirements_json?: Json
          selections_json?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          requirements_json?: Json
          selections_json?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_matrix_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "application_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          control_variant: string
          created_at: string
          description: string
          end_date: string | null
          experiment_name: string
          feature_flag: string
          hypothesis: string
          id: string
          minimum_sample_size: number | null
          results_summary: Json | null
          start_date: string | null
          status: string
          success_metrics: Json
          test_variant: string
          updated_at: string
        }
        Insert: {
          control_variant: string
          created_at?: string
          description: string
          end_date?: string | null
          experiment_name: string
          feature_flag: string
          hypothesis: string
          id?: string
          minimum_sample_size?: number | null
          results_summary?: Json | null
          start_date?: string | null
          status?: string
          success_metrics?: Json
          test_variant: string
          updated_at?: string
        }
        Update: {
          control_variant?: string
          created_at?: string
          description?: string
          end_date?: string | null
          experiment_name?: string
          feature_flag?: string
          hypothesis?: string
          id?: string
          minimum_sample_size?: number | null
          results_summary?: Json | null
          start_date?: string | null
          status?: string
          success_metrics?: Json
          test_variant?: string
          updated_at?: string
        }
        Relationships: []
      }
      extraction_checkpoints: {
        Row: {
          checkpoint_data: Json
          checkpoint_name: string | null
          created_at: string
          id: string
          phase: string | null
          session_id: string
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          checkpoint_data: Json
          checkpoint_name?: string | null
          created_at?: string
          id?: string
          phase?: string | null
          session_id: string
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          checkpoint_data?: Json
          checkpoint_name?: string | null
          created_at?: string
          id?: string
          phase?: string | null
          session_id?: string
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_checkpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "extraction_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_errors: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          phase: string | null
          session_id: string | null
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          phase?: string | null
          session_id?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          phase?: string | null
          session_id?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: []
      }
      extraction_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "extraction_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_progress: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          items_extracted: number | null
          message: string
          percentage: number
          phase: string
          updated_at: string | null
          vault_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          items_extracted?: number | null
          message: string
          percentage: number
          phase: string
          updated_at?: string | null
          vault_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          items_extracted?: number | null
          message?: string
          percentage?: number
          phase?: string
          updated_at?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_progress_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: true
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_sessions: {
        Row: {
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          extraction_version: string
          id: string
          metadata: Json | null
          started_at: string
          status: string
          user_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          extraction_version?: string
          id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          user_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          extraction_version?: string
          id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_sessions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_validations: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          issues: Json | null
          passed: boolean
          recommendations: Json | null
          session_id: string
          validation_type: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          issues?: Json | null
          passed: boolean
          recommendations?: Json | null
          session_id: string
          validation_type: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          issues?: Json | null
          passed?: boolean
          recommendations?: Json | null
          session_id?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_validations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "extraction_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_vault_usage: {
        Row: {
          context: Json | null
          created_at: string | null
          feature_name: string
          feature_record_id: string
          id: string
          user_id: string
          vault_item_id: string
          vault_item_type: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          feature_name: string
          feature_record_id: string
          id?: string
          user_id: string
          vault_item_id: string
          vault_item_type: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          feature_name?: string
          feature_record_id?: string
          id?: string
          user_id?: string
          vault_item_id?: string
          vault_item_type?: string
        }
        Relationships: []
      }
      interview_communications: {
        Row: {
          body_content: string
          communication_type: string
          created_at: string | null
          id: string
          job_project_id: string
          metadata: Json | null
          recipient_email: string | null
          recipient_name: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject_line: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_content: string
          communication_type: string
          created_at?: string | null
          id?: string
          job_project_id: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_content?: string
          communication_type?: string
          created_at?: string | null
          id?: string
          job_project_id?: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_communications_job_project_id_fkey"
            columns: ["job_project_id"]
            isOneToOne: false
            referencedRelation: "job_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_communications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_prep_sessions: {
        Row: {
          created_at: string
          id: string
          interview_date: string | null
          interview_stage: string
          job_project_id: string
          notes: string | null
          prep_materials: Json | null
          questions_prepared: Json | null
          star_stories_used: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_stage: string
          job_project_id: string
          notes?: string | null
          prep_materials?: Json | null
          questions_prepared?: Json | null
          star_stories_used?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_stage?: string
          job_project_id?: string
          notes?: string | null
          prep_materials?: Json | null
          questions_prepared?: Json | null
          star_stories_used?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_prep_sessions_job_project_id_fkey"
            columns: ["job_project_id"]
            isOneToOne: false
            referencedRelation: "job_projects"
            referencedColumns: ["id"]
          },
        ]
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
          search_origin: string | null
          search_session_id: string | null
          source: string
          updated_at: string | null
          vault_derived: boolean | null
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
          search_origin?: string | null
          search_session_id?: string | null
          source: string
          updated_at?: string | null
          vault_derived?: boolean | null
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
          search_origin?: string | null
          search_session_id?: string | null
          source?: string
          updated_at?: string | null
          vault_derived?: boolean | null
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
          follow_up_sent: boolean | null
          id: string
          interview_date: string | null
          interview_prep_data: Json | null
          interview_stage: string | null
          interviewer_email: string | null
          interviewer_name: string | null
          job_description: string | null
          job_listing_id: string | null
          job_source: string | null
          job_title: string | null
          metadata: Json | null
          networking_campaign_id: string | null
          next_follow_up_date: string | null
          notes: string | null
          offer_amount: number | null
          offer_bonus: number | null
          offer_equity: number | null
          offer_received_date: string | null
          opportunity_id: string | null
          project_name: string
          resume_version_id: string | null
          salary_negotiation_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          external_job_url?: string | null
          follow_up_sent?: boolean | null
          id?: string
          interview_date?: string | null
          interview_prep_data?: Json | null
          interview_stage?: string | null
          interviewer_email?: string | null
          interviewer_name?: string | null
          job_description?: string | null
          job_listing_id?: string | null
          job_source?: string | null
          job_title?: string | null
          metadata?: Json | null
          networking_campaign_id?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          offer_amount?: number | null
          offer_bonus?: number | null
          offer_equity?: number | null
          offer_received_date?: string | null
          opportunity_id?: string | null
          project_name: string
          resume_version_id?: string | null
          salary_negotiation_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          external_job_url?: string | null
          follow_up_sent?: boolean | null
          id?: string
          interview_date?: string | null
          interview_prep_data?: Json | null
          interview_stage?: string | null
          interviewer_email?: string | null
          interviewer_name?: string | null
          job_description?: string | null
          job_listing_id?: string | null
          job_source?: string | null
          job_title?: string | null
          metadata?: Json | null
          networking_campaign_id?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          offer_amount?: number | null
          offer_bonus?: number | null
          offer_equity?: number | null
          offer_received_date?: string | null
          opportunity_id?: string | null
          project_name?: string
          resume_version_id?: string | null
          salary_negotiation_id?: string | null
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
            foreignKeyName: "job_projects_networking_campaign_id_fkey"
            columns: ["networking_campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "job_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_projects_salary_negotiation_id_fkey"
            columns: ["salary_negotiation_id"]
            isOneToOne: false
            referencedRelation: "salary_negotiations"
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
          metadata: Json | null
          results_count: number | null
          search_origin: string | null
          search_query: string
          status: string | null
          user_id: string
          vault_title_used: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          metadata?: Json | null
          results_count?: number | null
          search_origin?: string | null
          search_query: string
          status?: string | null
          user_id: string
          vault_title_used?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          metadata?: Json | null
          results_count?: number | null
          search_origin?: string | null
          search_query?: string
          status?: string | null
          user_id?: string
          vault_title_used?: string | null
        }
        Relationships: []
      }
      linkedin_posts: {
        Row: {
          analysis_data: Json | null
          content: string
          created_at: string | null
          engagement_metrics: Json | null
          engagement_score: number | null
          focus_statement: string | null
          hashtags: string[] | null
          id: string
          part_number: number | null
          post_type: string | null
          posted_to_groups: string[] | null
          scheduled_for: string | null
          series_id: string | null
          status: string | null
          title: string | null
          tone: string | null
          total_parts: number | null
          updated_at: string | null
          user_id: string
          vault_sources: string[] | null
        }
        Insert: {
          analysis_data?: Json | null
          content: string
          created_at?: string | null
          engagement_metrics?: Json | null
          engagement_score?: number | null
          focus_statement?: string | null
          hashtags?: string[] | null
          id?: string
          part_number?: number | null
          post_type?: string | null
          posted_to_groups?: string[] | null
          scheduled_for?: string | null
          series_id?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          total_parts?: number | null
          updated_at?: string | null
          user_id: string
          vault_sources?: string[] | null
        }
        Update: {
          analysis_data?: Json | null
          content?: string
          created_at?: string | null
          engagement_metrics?: Json | null
          engagement_score?: number | null
          focus_statement?: string | null
          hashtags?: string[] | null
          id?: string
          part_number?: number | null
          post_type?: string | null
          posted_to_groups?: string[] | null
          scheduled_for?: string | null
          series_id?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          total_parts?: number | null
          updated_at?: string | null
          user_id?: string
          vault_sources?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "linkedin_series"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_profile_sections: {
        Row: {
          content: string
          generated_at: string
          id: string
          is_active: boolean | null
          optimization_score: number | null
          section_type: string
          user_id: string
          vault_items_used: Json | null
        }
        Insert: {
          content: string
          generated_at?: string
          id?: string
          is_active?: boolean | null
          optimization_score?: number | null
          section_type: string
          user_id: string
          vault_items_used?: Json | null
        }
        Update: {
          content?: string
          generated_at?: string
          id?: string
          is_active?: boolean | null
          optimization_score?: number | null
          section_type?: string
          user_id?: string
          vault_items_used?: Json | null
        }
        Relationships: []
      }
      linkedin_profiles: {
        Row: {
          about: string | null
          created_at: string | null
          featured_skills: string[] | null
          headline: string | null
          id: string
          last_optimized_at: string | null
          optimization_score: number | null
          optimized_content: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          about?: string | null
          created_at?: string | null
          featured_skills?: string[] | null
          headline?: string | null
          id?: string
          last_optimized_at?: string | null
          optimization_score?: number | null
          optimized_content?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          about?: string | null
          created_at?: string | null
          featured_skills?: string[] | null
          headline?: string | null
          id?: string
          last_optimized_at?: string | null
          optimization_score?: number | null
          optimized_content?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      linkedin_series: {
        Row: {
          created_at: string
          experience_years: number | null
          id: string
          industry: string | null
          outline_data: Json | null
          series_length: number
          series_title: string
          series_topic: string
          target_audience: string | null
          updated_at: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          created_at?: string
          experience_years?: number | null
          id?: string
          industry?: string | null
          outline_data?: Json | null
          series_length: number
          series_title: string
          series_topic: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          created_at?: string
          experience_years?: number | null
          id?: string
          industry?: string | null
          outline_data?: Json | null
          series_length?: number
          series_title?: string
          series_topic?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      linkedin_usage_telemetry: {
        Row: {
          action_type: string
          content_type: string
          content_variant: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          content_type: string
          content_variant?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          content_type?: string
          content_variant?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      networking_contacts: {
        Row: {
          contact_company: string | null
          contact_email: string | null
          contact_linkedin: string | null
          contact_name: string
          contact_title: string | null
          created_at: string | null
          id: string
          last_contact_date: string | null
          next_follow_up_date: string | null
          notes: string | null
          relationship_strength: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_company?: string | null
          contact_email?: string | null
          contact_linkedin?: string | null
          contact_name: string
          contact_title?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          relationship_strength?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_company?: string | null
          contact_email?: string | null
          contact_linkedin?: string | null
          contact_name?: string
          contact_title?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          relationship_strength?: string | null
          tags?: string[] | null
          updated_at?: string | null
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
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
      processing_logs: {
        Row: {
          ai_tokens_used: number | null
          confidence_level: string | null
          created_at: string
          error_message: string | null
          error_type: string | null
          extracted_text_length: number | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          processing_time_ms: number | null
          queue_id: string | null
          success: boolean
          user_id: string
          validation_score: number | null
          was_cached: boolean | null
        }
        Insert: {
          ai_tokens_used?: number | null
          confidence_level?: string | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          extracted_text_length?: number | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          queue_id?: string | null
          success: boolean
          user_id: string
          validation_score?: number | null
          was_cached?: boolean | null
        }
        Update: {
          ai_tokens_used?: number | null
          confidence_level?: string | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          extracted_text_length?: number | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          queue_id?: string | null
          success?: boolean
          user_id?: string
          validation_score?: number | null
          was_cached?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "resume_processing_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_metrics: {
        Row: {
          analysis_confidence: string | null
          analysis_time_ms: number | null
          cache_hit_count: number | null
          created_at: string | null
          error_message: string | null
          error_type: string | null
          extracted_text_length: number | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          parse_time_ms: number | null
          queue_id: string | null
          success: boolean
          total_time_ms: number
          user_id: string | null
          validation_confidence: number | null
          validation_time_ms: number | null
          was_cached: boolean | null
        }
        Insert: {
          analysis_confidence?: string | null
          analysis_time_ms?: number | null
          cache_hit_count?: number | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          extracted_text_length?: number | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          parse_time_ms?: number | null
          queue_id?: string | null
          success: boolean
          total_time_ms: number
          user_id?: string | null
          validation_confidence?: number | null
          validation_time_ms?: number | null
          was_cached?: boolean | null
        }
        Update: {
          analysis_confidence?: string | null
          analysis_time_ms?: number | null
          cache_hit_count?: number | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          extracted_text_length?: number | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          parse_time_ms?: number | null
          queue_id?: string | null
          success?: boolean
          total_time_ms?: number
          user_id?: string | null
          validation_confidence?: number | null
          validation_time_ms?: number | null
          was_cached?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_metrics_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "resume_processing_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          automation_activated_at: string | null
          automation_enabled: boolean | null
          automation_mode: string | null
          base_resume: string | null
          career_goals: string | null
          completeness_score: number | null
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
          last_activity_at: string | null
          linkedin_profile_complete: boolean | null
          match_threshold_auto_apply: number | null
          match_threshold_queue: number | null
          max_daily_applications: number | null
          phone: string | null
          preferred_location: string | null
          resume_template_preference: string | null
          role_preferences: Json | null
          salary_expectations_max: number | null
          salary_expectations_min: number | null
          strategy_customized: boolean | null
          subscription_tier: string | null
          target_industries: string[] | null
          target_positions: string[] | null
          target_roles: string[] | null
          target_salary: string | null
          updated_at: string | null
          user_id: string
          vault_completion_celebration_seen: boolean | null
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
          completeness_score?: number | null
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
          last_activity_at?: string | null
          linkedin_profile_complete?: boolean | null
          match_threshold_auto_apply?: number | null
          match_threshold_queue?: number | null
          max_daily_applications?: number | null
          phone?: string | null
          preferred_location?: string | null
          resume_template_preference?: string | null
          role_preferences?: Json | null
          salary_expectations_max?: number | null
          salary_expectations_min?: number | null
          strategy_customized?: boolean | null
          subscription_tier?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          target_roles?: string[] | null
          target_salary?: string | null
          updated_at?: string | null
          user_id: string
          vault_completion_celebration_seen?: boolean | null
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
          completeness_score?: number | null
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
          last_activity_at?: string | null
          linkedin_profile_complete?: boolean | null
          match_threshold_auto_apply?: number | null
          match_threshold_queue?: number | null
          max_daily_applications?: number | null
          phone?: string | null
          preferred_location?: string | null
          resume_template_preference?: string | null
          role_preferences?: Json | null
          salary_expectations_max?: number | null
          salary_expectations_min?: number | null
          strategy_customized?: boolean | null
          subscription_tier?: string | null
          target_industries?: string[] | null
          target_positions?: string[] | null
          target_roles?: string[] | null
          target_salary?: string | null
          updated_at?: string | null
          user_id?: string
          vault_completion_celebration_seen?: boolean | null
          why_me_narratives?: Json | null
          work_style_preferences?: Json | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_resume_template_preference_fkey"
            columns: ["resume_template_preference"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      prompt_test_results: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          prompt_id: string
          success: boolean | null
          test_input: Json
          test_output: string | null
          tested_by: string | null
          tokens_used: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          prompt_id: string
          success?: boolean | null
          test_input: Json
          test_output?: string | null
          tested_by?: string | null
          tokens_used?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          prompt_id?: string
          success?: boolean | null
          test_input?: Json
          test_output?: string | null
          tested_by?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      prompt_version_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          performance_metrics: Json | null
          prompt_content: string
          prompt_id: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          performance_metrics?: Json | null
          prompt_content: string
          prompt_id: string
          version_number: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          performance_metrics?: Json | null
          prompt_content?: string
          prompt_id?: string
          version_number?: number
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
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_end: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      research_findings: {
        Row: {
          credibility_score: number | null
          discovered_at: string
          finding_type: string
          full_content: string | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          published_date: string | null
          relevance_tags: string[] | null
          source_url: string
          summary: string
          title: string
        }
        Insert: {
          credibility_score?: number | null
          discovered_at?: string
          finding_type: string
          full_content?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          published_date?: string | null
          relevance_tags?: string[] | null
          source_url: string
          summary: string
          title: string
        }
        Update: {
          credibility_score?: number | null
          discovered_at?: string
          finding_type?: string
          full_content?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          published_date?: string | null
          relevance_tags?: string[] | null
          source_url?: string
          summary?: string
          title?: string
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
          resume_id: string | null
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
          resume_id?: string | null
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
          resume_id?: string | null
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
      resume_cache: {
        Row: {
          analysis_result: Json | null
          content_hash: string
          created_at: string
          expires_at: string
          extracted_text: string
          file_type: string
          hit_count: number | null
          id: string
          last_accessed: string
        }
        Insert: {
          analysis_result?: Json | null
          content_hash: string
          created_at?: string
          expires_at?: string
          extracted_text: string
          file_type: string
          hit_count?: number | null
          id?: string
          last_accessed?: string
        }
        Update: {
          analysis_result?: Json | null
          content_hash?: string
          created_at?: string
          expires_at?: string
          extracted_text?: string
          file_type?: string
          hit_count?: number | null
          id?: string
          last_accessed?: string
        }
        Relationships: []
      }
      resume_generation_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      resume_processing_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          error_type: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          progress: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          progress?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          progress?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_requirement_mappings: {
        Row: {
          ats_keywords: string[] | null
          created_at: string | null
          custom_edit: string | null
          enhanced_bullet: string | null
          enhancement_reasoning: string | null
          evidence_quality_score: string | null
          gap_suggestions: string[] | null
          id: string
          job_analysis_id: string | null
          match_confidence: number | null
          match_reasons: string[] | null
          match_score: number | null
          milestone_id: string | null
          original_bullet: string | null
          original_company: string | null
          original_date_range: string | null
          original_job_title: string | null
          quality_feedback: string | null
          requirement_category: string | null
          requirement_priority: number | null
          requirement_text: string
          resume_version_id: string | null
          suggested_additions: string[] | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string
          user_selection: string | null
        }
        Insert: {
          ats_keywords?: string[] | null
          created_at?: string | null
          custom_edit?: string | null
          enhanced_bullet?: string | null
          enhancement_reasoning?: string | null
          evidence_quality_score?: string | null
          gap_suggestions?: string[] | null
          id?: string
          job_analysis_id?: string | null
          match_confidence?: number | null
          match_reasons?: string[] | null
          match_score?: number | null
          milestone_id?: string | null
          original_bullet?: string | null
          original_company?: string | null
          original_date_range?: string | null
          original_job_title?: string | null
          quality_feedback?: string | null
          requirement_category?: string | null
          requirement_priority?: number | null
          requirement_text: string
          resume_version_id?: string | null
          suggested_additions?: string[] | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
          user_selection?: string | null
        }
        Update: {
          ats_keywords?: string[] | null
          created_at?: string | null
          custom_edit?: string | null
          enhanced_bullet?: string | null
          enhancement_reasoning?: string | null
          evidence_quality_score?: string | null
          gap_suggestions?: string[] | null
          id?: string
          job_analysis_id?: string | null
          match_confidence?: number | null
          match_reasons?: string[] | null
          match_score?: number | null
          milestone_id?: string | null
          original_bullet?: string | null
          original_company?: string | null
          original_date_range?: string | null
          original_job_title?: string | null
          quality_feedback?: string | null
          requirement_category?: string | null
          requirement_priority?: number | null
          requirement_text?: string
          resume_version_id?: string | null
          suggested_additions?: string[] | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
          user_selection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_requirement_mappings_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "vault_resume_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_requirement_mappings_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_templates: {
        Row: {
          created_at: string
          css_styles: string | null
          description: string | null
          features: Json | null
          html_structure: string | null
          id: string
          is_active: boolean | null
          template_name: string
          template_type: string
        }
        Insert: {
          created_at?: string
          css_styles?: string | null
          description?: string | null
          features?: Json | null
          html_structure?: string | null
          id?: string
          is_active?: boolean | null
          template_name: string
          template_type: string
        }
        Update: {
          created_at?: string
          css_styles?: string | null
          description?: string | null
          features?: Json | null
          html_structure?: string | null
          id?: string
          is_active?: boolean | null
          template_name?: string
          template_type?: string
        }
        Relationships: []
      }
      resume_verification_results: {
        Row: {
          auto_remediation_attempted: boolean | null
          created_at: string
          discrepancies_found: number | null
          id: string
          remediation_notes: string | null
          remediation_status: string | null
          results: Json
          session_id: string | null
          updated_at: string
          user_id: string
          vault_id: string
          verification_status: string
        }
        Insert: {
          auto_remediation_attempted?: boolean | null
          created_at?: string
          discrepancies_found?: number | null
          id?: string
          remediation_notes?: string | null
          remediation_status?: string | null
          results: Json
          session_id?: string | null
          updated_at?: string
          user_id: string
          vault_id: string
          verification_status: string
        }
        Update: {
          auto_remediation_attempted?: boolean | null
          created_at?: string
          discrepancies_found?: number | null
          id?: string
          remediation_notes?: string | null
          remediation_status?: string | null
          results?: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string
          vault_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_verification_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "extraction_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_verification_results_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          content: Json
          created_at: string
          customizations: Json | null
          html_content: string | null
          id: string
          job_project_id: string | null
          match_score: number | null
          template_id: string | null
          updated_at: string
          user_id: string
          version_name: string
        }
        Insert: {
          content?: Json
          created_at?: string
          customizations?: Json | null
          html_content?: string | null
          id?: string
          job_project_id?: string | null
          match_score?: number | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          version_name: string
        }
        Update: {
          content?: Json
          created_at?: string
          customizations?: Json | null
          html_content?: string | null
          id?: string
          job_project_id?: string | null
          match_score?: number | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_job_project_id_fkey"
            columns: ["job_project_id"]
            isOneToOne: false
            referencedRelation: "job_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ats_analysis: Json | null
          ats_score: number | null
          file_name: string
          file_url: string
          id: string
          last_ats_analysis_at: string | null
          parsed_content: Json | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          ats_analysis?: Json | null
          ats_score?: number | null
          file_name: string
          file_url: string
          id?: string
          last_ats_analysis_at?: string | null
          parsed_content?: Json | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          ats_analysis?: Json | null
          ats_score?: number | null
          file_name?: string
          file_url?: string
          id?: string
          last_ats_analysis_at?: string | null
          parsed_content?: Json | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      retirement_access_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          redeemed_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      salary_market_data: {
        Row: {
          data_sources: Json | null
          expires_at: string
          id: string
          industry: string | null
          job_title: string
          location: string
          market_data: Json
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          researched_at: string
          skill_premiums: Json | null
          years_experience: number | null
        }
        Insert: {
          data_sources?: Json | null
          expires_at?: string
          id?: string
          industry?: string | null
          job_title: string
          location: string
          market_data?: Json
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          researched_at?: string
          skill_premiums?: Json | null
          years_experience?: number | null
        }
        Update: {
          data_sources?: Json | null
          expires_at?: string
          id?: string
          industry?: string | null
          job_title?: string
          location?: string
          market_data?: Json
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          researched_at?: string
          skill_premiums?: Json | null
          years_experience?: number | null
        }
        Relationships: []
      }
      salary_negotiations: {
        Row: {
          competitive_analysis: Json | null
          competitive_score: number | null
          created_at: string
          final_offer_details: Json | null
          id: string
          job_project_id: string | null
          market_data_id: string | null
          negotiation_script: string | null
          offer_details: Json
          outcome: string | null
          report_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitive_analysis?: Json | null
          competitive_score?: number | null
          created_at?: string
          final_offer_details?: Json | null
          id?: string
          job_project_id?: string | null
          market_data_id?: string | null
          negotiation_script?: string | null
          offer_details?: Json
          outcome?: string | null
          report_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitive_analysis?: Json | null
          competitive_score?: number | null
          created_at?: string
          final_offer_details?: Json | null
          id?: string
          job_project_id?: string | null
          market_data_id?: string | null
          negotiation_script?: string | null
          offer_details?: Json
          outcome?: string | null
          report_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_negotiations_job_project_id_fkey"
            columns: ["job_project_id"]
            isOneToOne: false
            referencedRelation: "job_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_negotiations_market_data_id_fkey"
            columns: ["market_data_id"]
            isOneToOne: false
            referencedRelation: "salary_market_data"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_boolean_searches: {
        Row: {
          boolean_string: string
          created_at: string
          filters: Json | null
          id: string
          last_used_at: string | null
          location: string | null
          name: string
          search_query: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          boolean_string: string
          created_at?: string
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          location?: string | null
          name: string
          search_query?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          boolean_string?: string
          created_at?: string
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          location?: string | null
          name?: string
          search_query?: string | null
          use_count?: number | null
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
      subscription_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          reason: string
          status: string
          stripe_refund_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason: string
          status: string
          stripe_refund_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string
          status?: string
          stripe_refund_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_data_snapshots: {
        Row: {
          created_at: string | null
          data_id: string | null
          data_type: string
          id: string
          test_run_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_id?: string | null
          data_type: string
          id?: string
          test_run_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_id?: string | null
          data_type?: string
          id?: string
          test_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_data_snapshots_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          category: string
          console_logs: Json | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          screenshot_url: string | null
          status: string
          test_id: string
          test_name: string
          test_run_id: string
        }
        Insert: {
          category: string
          console_logs?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          screenshot_url?: string | null
          status: string
          test_id: string
          test_name: string
          test_run_id: string
        }
        Update: {
          category?: string
          console_logs?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          screenshot_url?: string | null
          status?: string
          test_id?: string
          test_name?: string
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          environment: string | null
          failed_tests: number
          id: string
          metadata: Json | null
          passed_tests: number
          skipped_tests: number
          started_at: string
          test_suite_name: string | null
          total_tests: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number
          id?: string
          metadata?: Json | null
          passed_tests?: number
          skipped_tests?: number
          started_at?: string
          test_suite_name?: string | null
          total_tests?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number
          id?: string
          metadata?: Json | null
          passed_tests?: number
          skipped_tests?: number
          started_at?: string
          test_suite_name?: string | null
          total_tests?: number
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          created_at: string | null
          email_frequency: string | null
          enabled: boolean | null
          id: string
          last_match_run: string | null
          max_salary: number | null
          min_salary: number | null
          preferred_locations: string[] | null
          remote_preference: string | null
          target_industries: string[] | null
          target_roles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_frequency?: string | null
          enabled?: boolean | null
          id?: string
          last_match_run?: string | null
          max_salary?: number | null
          min_salary?: number | null
          preferred_locations?: string[] | null
          remote_preference?: string | null
          target_industries?: string[] | null
          target_roles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_frequency?: string | null
          enabled?: boolean | null
          id?: string
          last_match_run?: string | null
          max_salary?: number | null
          min_salary?: number | null
          preferred_locations?: string[] | null
          remote_preference?: string | null
          target_industries?: string[] | null
          target_roles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_experiments: {
        Row: {
          created_at: string
          experiment_id: string
          feedback_rating: number | null
          feedback_text: string | null
          id: string
          opted_in_at: string
          opted_out_at: string | null
          outcome_data: Json | null
          user_id: string
          variant: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          opted_in_at?: string
          opted_out_at?: string | null
          outcome_data?: Json | null
          user_id: string
          variant: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          opted_in_at?: string
          opted_out_at?: string | null
          outcome_data?: Json | null
          user_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experiments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_progress: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          last_activity_at: string | null
          metadata: Json | null
          milestone_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          milestone_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          milestone_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_emails: {
        Row: {
          created_at: string
          id: string
          sent_at: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sent_at?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sent_at?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quotas: {
        Row: {
          created_at: string
          daily_request_limit: number
          id: string
          monthly_cost_limit_usd: number | null
          monthly_cost_spent_usd: number | null
          monthly_request_count: number
          monthly_request_limit: number
          reset_date: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_request_limit?: number
          id?: string
          monthly_cost_limit_usd?: number | null
          monthly_cost_spent_usd?: number | null
          monthly_request_count?: number
          monthly_request_limit?: number
          reset_date?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_request_limit?: number
          id?: string
          monthly_cost_limit_usd?: number | null
          monthly_cost_spent_usd?: number | null
          monthly_request_count?: number
          monthly_request_limit?: number
          reset_date?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
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
      vault_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
          vault_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
          vault_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_activity_log_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_ai_coaching_history: {
        Row: {
          coaching_type: string | null
          created_at: string | null
          fact_drift_details: Json | null
          fact_drift_detected: boolean | null
          final_text: string | null
          id: string
          item_id: string | null
          item_type: string | null
          original_text: string
          position_id: string | null
          suggested_text: string
          user_action: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          coaching_type?: string | null
          created_at?: string | null
          fact_drift_details?: Json | null
          fact_drift_detected?: boolean | null
          final_text?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          original_text: string
          position_id?: string | null
          suggested_text: string
          user_action?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          coaching_type?: string | null
          created_at?: string | null
          fact_drift_details?: Json | null
          fact_drift_detected?: boolean | null
          final_text?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          original_text?: string
          position_id?: string | null
          suggested_text?: string
          user_action?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_ai_coaching_history_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_ai_coaching_history_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_behavioral_indicators: {
        Row: {
          ai_confidence: number | null
          confidence_score: number | null
          context: string | null
          created_at: string | null
          id: string
          indicator_type: string
          inferred_from: string | null
          interview_behavioral_anchor: string | null
          last_updated_at: string | null
          linkedin_case_study_potential: string | null
          needs_user_review: boolean | null
          outcome_pattern: string | null
          quality_tier: string | null
          specific_behavior: string
          success_pattern_analysis: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          id?: string
          indicator_type: string
          inferred_from?: string | null
          interview_behavioral_anchor?: string | null
          last_updated_at?: string | null
          linkedin_case_study_potential?: string | null
          needs_user_review?: boolean | null
          outcome_pattern?: string | null
          quality_tier?: string | null
          specific_behavior: string
          success_pattern_analysis?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          id?: string
          indicator_type?: string
          inferred_from?: string | null
          interview_behavioral_anchor?: string | null
          last_updated_at?: string | null
          linkedin_case_study_potential?: string | null
          needs_user_review?: boolean | null
          outcome_pattern?: string | null
          quality_tier?: string | null
          specific_behavior?: string
          success_pattern_analysis?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_behavioral_indicators_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_benchmark_comparison: {
        Row: {
          benchmark_data: Json
          comparison_confidence: number | null
          confirmed_data: Json
          created_at: string
          evidence_summary: Json
          gaps_requiring_questions: Json
          id: string
          industry: string
          job_title: string
          likely_data: Json
          seniority_level: string | null
          updated_at: string
          user_id: string
          vault_id: string
        }
        Insert: {
          benchmark_data?: Json
          comparison_confidence?: number | null
          confirmed_data?: Json
          created_at?: string
          evidence_summary?: Json
          gaps_requiring_questions?: Json
          id?: string
          industry: string
          job_title: string
          likely_data?: Json
          seniority_level?: string | null
          updated_at?: string
          user_id: string
          vault_id: string
        }
        Update: {
          benchmark_data?: Json
          comparison_confidence?: number | null
          confirmed_data?: Json
          created_at?: string
          evidence_summary?: Json
          gaps_requiring_questions?: Json
          id?: string
          industry?: string
          job_title?: string
          likely_data?: Json
          seniority_level?: string | null
          updated_at?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_benchmark_comparison_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: true
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_career_context: {
        Row: {
          ai_reasoning: string | null
          budget_amount: number | null
          budget_details: string | null
          budget_sizes_managed: number[] | null
          career_archetype: string | null
          certifications: string[] | null
          company_sizes: string[] | null
          created_at: string | null
          education_field: string | null
          education_level: string | null
          executive_details: string | null
          has_budget_ownership: boolean
          has_executive_exposure: boolean
          has_management_experience: boolean
          id: string
          identified_gaps: Json | null
          impact_scale: string | null
          inferred_seniority: string
          leadership_depth: number | null
          management_details: string | null
          next_likely_role: string | null
          primary_responsibilities: string[] | null
          seniority_confidence: number
          strategic_depth: number | null
          team_sizes_managed: number[] | null
          technical_depth: number | null
          updated_at: string | null
          user_id: string | null
          vault_id: string | null
          years_of_experience: number
        }
        Insert: {
          ai_reasoning?: string | null
          budget_amount?: number | null
          budget_details?: string | null
          budget_sizes_managed?: number[] | null
          career_archetype?: string | null
          certifications?: string[] | null
          company_sizes?: string[] | null
          created_at?: string | null
          education_field?: string | null
          education_level?: string | null
          executive_details?: string | null
          has_budget_ownership: boolean
          has_executive_exposure: boolean
          has_management_experience: boolean
          id?: string
          identified_gaps?: Json | null
          impact_scale?: string | null
          inferred_seniority: string
          leadership_depth?: number | null
          management_details?: string | null
          next_likely_role?: string | null
          primary_responsibilities?: string[] | null
          seniority_confidence: number
          strategic_depth?: number | null
          team_sizes_managed?: number[] | null
          technical_depth?: number | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
          years_of_experience: number
        }
        Update: {
          ai_reasoning?: string | null
          budget_amount?: number | null
          budget_details?: string | null
          budget_sizes_managed?: number[] | null
          career_archetype?: string | null
          certifications?: string[] | null
          company_sizes?: string[] | null
          created_at?: string | null
          education_field?: string | null
          education_level?: string | null
          executive_details?: string | null
          has_budget_ownership?: boolean
          has_executive_exposure?: boolean
          has_management_experience?: boolean
          id?: string
          identified_gaps?: Json | null
          impact_scale?: string | null
          inferred_seniority?: string
          leadership_depth?: number | null
          management_details?: string | null
          next_likely_role?: string | null
          primary_responsibilities?: string[] | null
          seniority_confidence?: number
          strategic_depth?: number | null
          team_sizes_managed?: number[] | null
          technical_depth?: number | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_career_context_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: true
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_competitive_advantages: {
        Row: {
          advantage_category: string | null
          advantage_statement: string
          ai_confidence: number | null
          created_at: string | null
          differentiator_strength: string | null
          id: string
          interview_positioning: string | null
          linkedin_hook_potential: string | null
          market_rarity: string | null
          objection_handler: string | null
          proof_points: string[] | null
          quality_tier: string | null
          quantified_impact: string | null
          updated_at: string | null
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          advantage_category?: string | null
          advantage_statement: string
          ai_confidence?: number | null
          created_at?: string | null
          differentiator_strength?: string | null
          id?: string
          interview_positioning?: string | null
          linkedin_hook_potential?: string | null
          market_rarity?: string | null
          objection_handler?: string | null
          proof_points?: string[] | null
          quality_tier?: string | null
          quantified_impact?: string | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          advantage_category?: string | null
          advantage_statement?: string
          ai_confidence?: number | null
          created_at?: string | null
          differentiator_strength?: string | null
          id?: string
          interview_positioning?: string | null
          linkedin_hook_potential?: string | null
          market_rarity?: string | null
          objection_handler?: string | null
          proof_points?: string[] | null
          quality_tier?: string | null
          quantified_impact?: string | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_competitive_advantages_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_confirmed_skills: {
        Row: {
          created_at: string | null
          custom_notes: string | null
          id: string
          proficiency: string | null
          skill_name: string
          source: string
          sub_attributes: Json | null
          updated_at: string | null
          user_id: string
          want_to_develop: boolean | null
        }
        Insert: {
          created_at?: string | null
          custom_notes?: string | null
          id?: string
          proficiency?: string | null
          skill_name: string
          source: string
          sub_attributes?: Json | null
          updated_at?: string | null
          user_id: string
          want_to_develop?: boolean | null
        }
        Update: {
          created_at?: string | null
          custom_notes?: string | null
          id?: string
          proficiency?: string | null
          skill_name?: string
          source?: string
          sub_attributes?: Json | null
          updated_at?: string | null
          user_id?: string
          want_to_develop?: boolean | null
        }
        Relationships: []
      }
      vault_education: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          degree_name: string | null
          degree_type: string
          description: string | null
          end_date: string | null
          extraction_source: string | null
          field_of_study: string | null
          gpa: number | null
          graduation_year: number | null
          honors: string | null
          id: string
          institution_name: string
          is_in_progress: boolean | null
          quality_tier: string | null
          relevant_coursework: string[] | null
          start_date: string | null
          thesis_title: string | null
          updated_at: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          degree_name?: string | null
          degree_type: string
          description?: string | null
          end_date?: string | null
          extraction_source?: string | null
          field_of_study?: string | null
          gpa?: number | null
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution_name: string
          is_in_progress?: boolean | null
          quality_tier?: string | null
          relevant_coursework?: string[] | null
          start_date?: string | null
          thesis_title?: string | null
          updated_at?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          degree_name?: string | null
          degree_type?: string
          description?: string | null
          end_date?: string | null
          extraction_source?: string | null
          field_of_study?: string | null
          gpa?: number | null
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution_name?: string
          is_in_progress?: boolean | null
          quality_tier?: string | null
          relevant_coursework?: string[] | null
          start_date?: string | null
          thesis_title?: string | null
          updated_at?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: []
      }
      vault_executive_presence: {
        Row: {
          ai_confidence: number | null
          brand_alignment: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          inferred_from: string | null
          interview_response_hook: string | null
          last_updated_at: string | null
          linkedin_credibility_boost: string | null
          needs_user_review: boolean | null
          perceived_impact: string | null
          presence_indicator: string
          quality_tier: string | null
          role_fit_assessment: string | null
          situational_example: string
          user_id: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          brand_alignment?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inferred_from?: string | null
          interview_response_hook?: string | null
          last_updated_at?: string | null
          linkedin_credibility_boost?: string | null
          needs_user_review?: boolean | null
          perceived_impact?: string | null
          presence_indicator: string
          quality_tier?: string | null
          role_fit_assessment?: string | null
          situational_example: string
          user_id: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          brand_alignment?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inferred_from?: string | null
          interview_response_hook?: string | null
          last_updated_at?: string | null
          linkedin_credibility_boost?: string | null
          needs_user_review?: boolean | null
          perceived_impact?: string | null
          presence_indicator?: string
          quality_tier?: string | null
          role_fit_assessment?: string | null
          situational_example?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_executive_presence_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_fix_audit: {
        Row: {
          fixed_at: string | null
          had_analysis: boolean | null
          id: string
          new_onboarding_step: string | null
          old_onboarding_step: string | null
          resume_text_length: number | null
          user_id: string
          vault_id: string
        }
        Insert: {
          fixed_at?: string | null
          had_analysis?: boolean | null
          id?: string
          new_onboarding_step?: string | null
          old_onboarding_step?: string | null
          resume_text_length?: number | null
          user_id: string
          vault_id: string
        }
        Update: {
          fixed_at?: string | null
          had_analysis?: boolean | null
          id?: string
          new_onboarding_step?: string | null
          old_onboarding_step?: string | null
          resume_text_length?: number | null
          user_id?: string
          vault_id?: string
        }
        Relationships: []
      }
      vault_gap_analysis: {
        Row: {
          analysis_type: string | null
          competitive_insights: Json | null
          confidence_score: number | null
          created_at: string | null
          gap_description: string
          gap_type: string
          id: string
          identified_gaps: Json | null
          opportunities: Json | null
          percentile_ranking: number | null
          recommendations: Json | null
          recommended_actions: string[] | null
          severity: string | null
          strengths: Json | null
          target_role: string | null
          updated_at: string | null
          user_id: string
          vault_evidence: string[] | null
          vault_id: string
          vault_strength_at_analysis: number | null
        }
        Insert: {
          analysis_type?: string | null
          competitive_insights?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          gap_description: string
          gap_type: string
          id?: string
          identified_gaps?: Json | null
          opportunities?: Json | null
          percentile_ranking?: number | null
          recommendations?: Json | null
          recommended_actions?: string[] | null
          severity?: string | null
          strengths?: Json | null
          target_role?: string | null
          updated_at?: string | null
          user_id: string
          vault_evidence?: string[] | null
          vault_id: string
          vault_strength_at_analysis?: number | null
        }
        Update: {
          analysis_type?: string | null
          competitive_insights?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          gap_description?: string
          gap_type?: string
          id?: string
          identified_gaps?: Json | null
          opportunities?: Json | null
          percentile_ranking?: number | null
          recommendations?: Json | null
          recommended_actions?: string[] | null
          severity?: string | null
          strengths?: Json | null
          target_role?: string | null
          updated_at?: string | null
          user_id?: string
          vault_evidence?: string[] | null
          vault_id?: string
          vault_strength_at_analysis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_gap_analysis_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_gap_progress: {
        Row: {
          created_at: string | null
          gap_description: string | null
          gap_id: string
          gap_type: string | null
          id: string
          questions_answered: number | null
          questions_generated: Json | null
          resolved_at: string | null
          status: string | null
          total_questions: number | null
          updated_at: string | null
          vault_id: string
        }
        Insert: {
          created_at?: string | null
          gap_description?: string | null
          gap_id: string
          gap_type?: string | null
          id?: string
          questions_answered?: number | null
          questions_generated?: Json | null
          resolved_at?: string | null
          status?: string | null
          total_questions?: number | null
          updated_at?: string | null
          vault_id: string
        }
        Update: {
          created_at?: string | null
          gap_description?: string | null
          gap_id?: string
          gap_type?: string | null
          id?: string
          questions_answered?: number | null
          questions_generated?: Json | null
          resolved_at?: string | null
          status?: string | null
          total_questions?: number | null
          updated_at?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_gap_progress_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_hidden_competencies: {
        Row: {
          ai_confidence: number | null
          certification_equivalent: string | null
          competency_area: string
          confidence_score: number | null
          created_at: string
          enhancement_notes: string | null
          extraction_version: string | null
          id: string
          inferred_capability: string
          inferred_from: string | null
          last_updated_at: string | null
          needs_user_review: boolean | null
          quality_tier: string | null
          review_priority: number | null
          section_source: string | null
          supporting_evidence: string[]
          user_id: string
          vault_id: string
          work_position_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          certification_equivalent?: string | null
          competency_area: string
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          extraction_version?: string | null
          id?: string
          inferred_capability: string
          inferred_from?: string | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          supporting_evidence?: string[]
          user_id: string
          vault_id: string
          work_position_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          certification_equivalent?: string | null
          competency_area?: string
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          extraction_version?: string | null
          id?: string
          inferred_capability?: string
          inferred_from?: string | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          supporting_evidence?: string[]
          user_id?: string
          vault_id?: string
          work_position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_hidden_competencies_work_position_id_fkey"
            columns: ["work_position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_chest_hidden_competencies_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_interview_responses: {
        Row: {
          completeness_score: number | null
          created_at: string
          enhancement_priority: string | null
          extracted_insights: Json | null
          follow_up_questions: Json | null
          id: string
          intelligence_value: number | null
          is_draft: boolean | null
          milestone_id: string | null
          needs_enhancement: boolean | null
          phase: string
          quality_score: number | null
          question: string
          response: string
          saved_at: string | null
          specificity_score: number | null
          updated_at: string | null
          user_id: string
          validation_feedback: Json | null
          vault_id: string
          version: number | null
        }
        Insert: {
          completeness_score?: number | null
          created_at?: string
          enhancement_priority?: string | null
          extracted_insights?: Json | null
          follow_up_questions?: Json | null
          id?: string
          intelligence_value?: number | null
          is_draft?: boolean | null
          milestone_id?: string | null
          needs_enhancement?: boolean | null
          phase: string
          quality_score?: number | null
          question: string
          response: string
          saved_at?: string | null
          specificity_score?: number | null
          updated_at?: string | null
          user_id: string
          validation_feedback?: Json | null
          vault_id: string
          version?: number | null
        }
        Update: {
          completeness_score?: number | null
          created_at?: string
          enhancement_priority?: string | null
          extracted_insights?: Json | null
          follow_up_questions?: Json | null
          id?: string
          intelligence_value?: number | null
          is_draft?: boolean | null
          milestone_id?: string | null
          needs_enhancement?: boolean | null
          phase?: string
          quality_score?: number | null
          question?: string
          response?: string
          saved_at?: string | null
          specificity_score?: number | null
          updated_at?: string | null
          user_id?: string
          validation_feedback?: Json | null
          vault_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_interview_responses_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "vault_resume_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_chest_interview_responses_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_leadership_philosophy: {
        Row: {
          ai_confidence: number | null
          alignment_with_industry_norms: string | null
          behavioral_interview_examples: string[] | null
          confidence_score: number | null
          core_principles: string[] | null
          created_at: string | null
          id: string
          inferred_from: string | null
          last_updated_at: string | null
          leadership_style: string | null
          linkedin_angle: string | null
          needs_user_review: boolean | null
          philosophy_statement: string
          quality_tier: string | null
          real_world_application: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          alignment_with_industry_norms?: string | null
          behavioral_interview_examples?: string[] | null
          confidence_score?: number | null
          core_principles?: string[] | null
          created_at?: string | null
          id?: string
          inferred_from?: string | null
          last_updated_at?: string | null
          leadership_style?: string | null
          linkedin_angle?: string | null
          needs_user_review?: boolean | null
          philosophy_statement: string
          quality_tier?: string | null
          real_world_application?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          alignment_with_industry_norms?: string | null
          behavioral_interview_examples?: string[] | null
          confidence_score?: number | null
          core_principles?: string[] | null
          created_at?: string | null
          id?: string
          inferred_from?: string | null
          last_updated_at?: string | null
          leadership_style?: string | null
          linkedin_angle?: string | null
          needs_user_review?: boolean | null
          philosophy_statement?: string
          quality_tier?: string | null
          real_world_application?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_leadership_philosophy_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_market_research: {
        Row: {
          common_requirements: Json | null
          created_at: string | null
          id: string
          researched_at: string | null
          sample_jobs: Json | null
          skill_frequency: Json | null
          target_industry: string | null
          target_role: string
          updated_at: string | null
          vault_id: string
        }
        Insert: {
          common_requirements?: Json | null
          created_at?: string | null
          id?: string
          researched_at?: string | null
          sample_jobs?: Json | null
          skill_frequency?: Json | null
          target_industry?: string | null
          target_role: string
          updated_at?: string | null
          vault_id: string
        }
        Update: {
          common_requirements?: Json | null
          created_at?: string | null
          id?: string
          researched_at?: string | null
          sample_jobs?: Json | null
          skill_frequency?: Json | null
          target_industry?: string | null
          target_role?: string
          updated_at?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_market_research_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_personality_traits: {
        Row: {
          ai_confidence: number | null
          behavioral_evidence: string
          confidence_score: number | null
          created_at: string | null
          culture_fit_indicators: string[] | null
          id: string
          inferred_from: string | null
          interview_red_flags: string | null
          last_updated_at: string | null
          linkedin_authenticity_note: string | null
          needs_user_review: boolean | null
          quality_tier: string | null
          strength_or_growth: string | null
          trait_name: string
          user_id: string
          vault_id: string
          work_context: string | null
        }
        Insert: {
          ai_confidence?: number | null
          behavioral_evidence: string
          confidence_score?: number | null
          created_at?: string | null
          culture_fit_indicators?: string[] | null
          id?: string
          inferred_from?: string | null
          interview_red_flags?: string | null
          last_updated_at?: string | null
          linkedin_authenticity_note?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          strength_or_growth?: string | null
          trait_name: string
          user_id: string
          vault_id: string
          work_context?: string | null
        }
        Update: {
          ai_confidence?: number | null
          behavioral_evidence?: string
          confidence_score?: number | null
          created_at?: string | null
          culture_fit_indicators?: string[] | null
          id?: string
          inferred_from?: string | null
          interview_red_flags?: string | null
          last_updated_at?: string | null
          linkedin_authenticity_note?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          strength_or_growth?: string | null
          trait_name?: string
          user_id?: string
          vault_id?: string
          work_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_personality_traits_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_power_phrases: {
        Row: {
          adaptation_notes: string | null
          adaptation_tier: string | null
          adapted_from_id: string | null
          ai_confidence: number | null
          category: string
          confidence_score: number | null
          created_at: string
          enhancement_notes: string | null
          extraction_version: string | null
          id: string
          impact_metrics: Json | null
          industry_context: Json | null
          inferred_from: string | null
          keywords: string[] | null
          last_updated_at: string | null
          needs_user_review: boolean | null
          original_text: string | null
          power_phrase: string
          quality_tier: string | null
          review_priority: number | null
          section_source: string | null
          source: string | null
          target_keywords: string[] | null
          user_id: string
          vault_id: string
          work_position_id: string | null
        }
        Insert: {
          adaptation_notes?: string | null
          adaptation_tier?: string | null
          adapted_from_id?: string | null
          ai_confidence?: number | null
          category: string
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          extraction_version?: string | null
          id?: string
          impact_metrics?: Json | null
          industry_context?: Json | null
          inferred_from?: string | null
          keywords?: string[] | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          original_text?: string | null
          power_phrase: string
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          source?: string | null
          target_keywords?: string[] | null
          user_id: string
          vault_id: string
          work_position_id?: string | null
        }
        Update: {
          adaptation_notes?: string | null
          adaptation_tier?: string | null
          adapted_from_id?: string | null
          ai_confidence?: number | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          extraction_version?: string | null
          id?: string
          impact_metrics?: Json | null
          industry_context?: Json | null
          inferred_from?: string | null
          keywords?: string[] | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          original_text?: string | null
          power_phrase?: string
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          source?: string | null
          target_keywords?: string[] | null
          user_id?: string
          vault_id?: string
          work_position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_power_phrases_adapted_from_id_fkey"
            columns: ["adapted_from_id"]
            isOneToOne: false
            referencedRelation: "vault_power_phrases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_power_phrases_work_position_id_fkey"
            columns: ["work_position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_chest_power_phrases_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_professional_network: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          credibility_signal_strength: string | null
          end_date: string | null
          id: string
          impact: string | null
          interview_leverage_point: string | null
          linkedin_profile_placement: string | null
          network_type: string | null
          networking_intel: string | null
          organization_name: string
          quality_tier: string | null
          role_title: string | null
          selection_criteria: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          credibility_signal_strength?: string | null
          end_date?: string | null
          id?: string
          impact?: string | null
          interview_leverage_point?: string | null
          linkedin_profile_placement?: string | null
          network_type?: string | null
          networking_intel?: string | null
          organization_name: string
          quality_tier?: string | null
          role_title?: string | null
          selection_criteria?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          credibility_signal_strength?: string | null
          end_date?: string | null
          id?: string
          impact?: string | null
          interview_leverage_point?: string | null
          linkedin_profile_placement?: string | null
          network_type?: string | null
          networking_intel?: string | null
          organization_name?: string
          quality_tier?: string | null
          role_title?: string | null
          selection_criteria?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_professional_network_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_professional_resources: {
        Row: {
          ai_confidence: number | null
          certifications_funded: Json | null
          conferences_attended: Json | null
          consultant_experience: Json | null
          created_at: string | null
          enterprise_systems: Json | null
          external_coaches: Json | null
          id: string
          last_updated_at: string | null
          professional_memberships: Json | null
          proficiency_levels: Json | null
          quality_tier: string | null
          trade_shows: Json | null
          training_programs: Json | null
          updated_at: string | null
          user_verified: boolean | null
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          certifications_funded?: Json | null
          conferences_attended?: Json | null
          consultant_experience?: Json | null
          created_at?: string | null
          enterprise_systems?: Json | null
          external_coaches?: Json | null
          id?: string
          last_updated_at?: string | null
          professional_memberships?: Json | null
          proficiency_levels?: Json | null
          quality_tier?: string | null
          trade_shows?: Json | null
          training_programs?: Json | null
          updated_at?: string | null
          user_verified?: boolean | null
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          certifications_funded?: Json | null
          conferences_attended?: Json | null
          consultant_experience?: Json | null
          created_at?: string | null
          enterprise_systems?: Json | null
          external_coaches?: Json | null
          id?: string
          last_updated_at?: string | null
          professional_memberships?: Json | null
          proficiency_levels?: Json | null
          quality_tier?: string | null
          trade_shows?: Json | null
          training_programs?: Json | null
          updated_at?: string | null
          user_verified?: boolean | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_professional_resources_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_research: {
        Row: {
          citations: Json | null
          created_at: string
          id: string
          query_params: Json
          related_questions: Json | null
          research_result: string
          research_type: string
          researched_at: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          id?: string
          query_params: Json
          related_questions?: Json | null
          research_result: string
          research_type: string
          researched_at: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          created_at?: string
          id?: string
          query_params?: Json
          related_questions?: Json | null
          research_result?: string
          research_type?: string
          researched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_resume_milestones: {
        Row: {
          company_name: string | null
          completion_percentage: number | null
          confidence_score: number | null
          context: string | null
          created_at: string | null
          date_display_preference: string | null
          description: string | null
          end_date: string | null
          extracted_from_resume: boolean | null
          extraction_source: string | null
          hidden_from_resume: boolean | null
          hide_dates: boolean | null
          id: string
          intelligence_extracted: number | null
          job_title: string | null
          key_achievements: string[] | null
          metric_type: string | null
          metric_value: string | null
          milestone_title: string | null
          milestone_type: string
          privacy_notes: string | null
          quality_tier: string | null
          questions_answered: number | null
          questions_asked: number | null
          start_date: string | null
          updated_at: string | null
          user_id: string
          vault_id: string
          work_position_id: string
        }
        Insert: {
          company_name?: string | null
          completion_percentage?: number | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          date_display_preference?: string | null
          description?: string | null
          end_date?: string | null
          extracted_from_resume?: boolean | null
          extraction_source?: string | null
          hidden_from_resume?: boolean | null
          hide_dates?: boolean | null
          id?: string
          intelligence_extracted?: number | null
          job_title?: string | null
          key_achievements?: string[] | null
          metric_type?: string | null
          metric_value?: string | null
          milestone_title?: string | null
          milestone_type: string
          privacy_notes?: string | null
          quality_tier?: string | null
          questions_answered?: number | null
          questions_asked?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
          vault_id: string
          work_position_id: string
        }
        Update: {
          company_name?: string | null
          completion_percentage?: number | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          date_display_preference?: string | null
          description?: string | null
          end_date?: string | null
          extracted_from_resume?: boolean | null
          extraction_source?: string | null
          hidden_from_resume?: boolean | null
          hide_dates?: boolean | null
          id?: string
          intelligence_extracted?: number | null
          job_title?: string | null
          key_achievements?: string[] | null
          metric_type?: string | null
          metric_value?: string | null
          milestone_title?: string | null
          milestone_type?: string
          privacy_notes?: string | null
          quality_tier?: string | null
          questions_answered?: number | null
          questions_asked?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
          vault_id?: string
          work_position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_resume_milestones_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_resume_milestones_work_position_id_fkey"
            columns: ["work_position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_skill_positions: {
        Row: {
          context_notes: string | null
          created_at: string | null
          id: string
          position_id: string
          proficiency_level: string | null
          skill_id: string
          updated_at: string | null
          years_used: number | null
        }
        Insert: {
          context_notes?: string | null
          created_at?: string | null
          id?: string
          position_id: string
          proficiency_level?: string | null
          skill_id: string
          updated_at?: string | null
          years_used?: number | null
        }
        Update: {
          context_notes?: string | null
          created_at?: string | null
          id?: string
          position_id?: string
          proficiency_level?: string | null
          skill_id?: string
          updated_at?: string | null
          years_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_skill_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_skill_positions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "vault_transferable_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_skill_taxonomy: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          market_frequency: number | null
          skill_category: string | null
          skill_name: string
          source: string
          sub_attributes: Json | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_frequency?: number | null
          skill_category?: string | null
          skill_name: string
          source: string
          sub_attributes?: Json | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_frequency?: number | null
          skill_category?: string | null
          skill_name?: string
          source?: string
          sub_attributes?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      vault_soft_skills: {
        Row: {
          ai_confidence: number | null
          confidence_score: number | null
          created_at: string | null
          examples: string
          extraction_version: string | null
          id: string
          impact: string | null
          industry_relevance: Json | null
          inferred_from: string | null
          interview_question_map: string[] | null
          last_updated_at: string | null
          linkedin_post_type: string | null
          needs_user_review: boolean | null
          proficiency_level: string | null
          quality_tier: string | null
          review_priority: number | null
          section_source: string | null
          skill_name: string
          user_id: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          examples: string
          extraction_version?: string | null
          id?: string
          impact?: string | null
          industry_relevance?: Json | null
          inferred_from?: string | null
          interview_question_map?: string[] | null
          last_updated_at?: string | null
          linkedin_post_type?: string | null
          needs_user_review?: boolean | null
          proficiency_level?: string | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          skill_name: string
          user_id: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          examples?: string
          extraction_version?: string | null
          id?: string
          impact?: string | null
          industry_relevance?: Json | null
          inferred_from?: string | null
          interview_question_map?: string[] | null
          last_updated_at?: string | null
          linkedin_post_type?: string | null
          needs_user_review?: boolean | null
          proficiency_level?: string | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          skill_name?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_soft_skills_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_thought_leadership: {
        Row: {
          ai_confidence: number | null
          content_type: string | null
          created_at: string | null
          date_published: string | null
          demonstrates_competency: string[] | null
          engagement_rate: number | null
          id: string
          interview_talking_point: string | null
          linkedin_reference_value: string | null
          platform: string | null
          quality_tier: string | null
          repurpose_potential: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string | null
          vault_id: string | null
          views: number | null
        }
        Insert: {
          ai_confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          date_published?: string | null
          demonstrates_competency?: string[] | null
          engagement_rate?: number | null
          id?: string
          interview_talking_point?: string | null
          linkedin_reference_value?: string | null
          platform?: string | null
          quality_tier?: string | null
          repurpose_potential?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          vault_id?: string | null
          views?: number | null
        }
        Update: {
          ai_confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          date_published?: string | null
          demonstrates_competency?: string[] | null
          engagement_rate?: number | null
          id?: string
          interview_talking_point?: string | null
          linkedin_reference_value?: string | null
          platform?: string | null
          quality_tier?: string | null
          repurpose_potential?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          vault_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_thought_leadership_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_transferable_skills: {
        Row: {
          ai_confidence: number | null
          confidence_score: number | null
          created_at: string
          enhancement_notes: string | null
          equivalent_skills: string[]
          evidence: string
          extraction_version: string | null
          id: string
          industry_context: Json | null
          inferred_from: string | null
          item_subtype: string | null
          last_updated_at: string | null
          needs_user_review: boolean | null
          quality_tier: string | null
          review_priority: number | null
          section_source: string | null
          stated_skill: string
          user_id: string
          vault_id: string
          work_position_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          equivalent_skills?: string[]
          evidence: string
          extraction_version?: string | null
          id?: string
          industry_context?: Json | null
          inferred_from?: string | null
          item_subtype?: string | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          stated_skill: string
          user_id: string
          vault_id: string
          work_position_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string
          enhancement_notes?: string | null
          equivalent_skills?: string[]
          evidence?: string
          extraction_version?: string | null
          id?: string
          industry_context?: Json | null
          inferred_from?: string | null
          item_subtype?: string | null
          last_updated_at?: string | null
          needs_user_review?: boolean | null
          quality_tier?: string | null
          review_priority?: number | null
          section_source?: string | null
          stated_skill?: string
          user_id?: string
          vault_id?: string
          work_position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_transferable_skills_work_position_id_fkey"
            columns: ["work_position_id"]
            isOneToOne: false
            referencedRelation: "vault_work_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_chest_transferable_skills_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_values_motivations: {
        Row: {
          ai_confidence: number | null
          career_decisions_influenced: string | null
          company_culture_alignment: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          importance_level: string | null
          inferred_from: string | null
          interview_motivation_question_prep: string | null
          last_updated_at: string | null
          linkedin_authentic_voice_guide: string | null
          manifestation: string
          needs_user_review: boolean | null
          quality_tier: string | null
          user_id: string
          value_name: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          career_decisions_influenced?: string | null
          company_culture_alignment?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          importance_level?: string | null
          inferred_from?: string | null
          interview_motivation_question_prep?: string | null
          last_updated_at?: string | null
          linkedin_authentic_voice_guide?: string | null
          manifestation: string
          needs_user_review?: boolean | null
          quality_tier?: string | null
          user_id: string
          value_name: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          career_decisions_influenced?: string | null
          company_culture_alignment?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          importance_level?: string | null
          inferred_from?: string | null
          interview_motivation_question_prep?: string | null
          last_updated_at?: string | null
          linkedin_authentic_voice_guide?: string | null
          manifestation?: string
          needs_user_review?: boolean | null
          quality_tier?: string | null
          user_id?: string
          value_name?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_values_motivations_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_verifications: {
        Row: {
          citations: Json | null
          created_at: string
          id: string
          original_content: Json
          user_id: string
          verification_result: string
          verification_type: string
          verified_at: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          id?: string
          original_content: Json
          user_id: string
          verification_result: string
          verification_type: string
          verified_at: string
        }
        Update: {
          citations?: Json | null
          created_at?: string
          id?: string
          original_content?: Json
          user_id?: string
          verification_result?: string
          verification_type?: string
          verified_at?: string
        }
        Relationships: []
      }
      vault_work_positions: {
        Row: {
          company_name: string
          company_size: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          employment_type: string | null
          end_date: string | null
          extraction_source: string | null
          id: string
          industry: string | null
          is_current: boolean | null
          job_title: string
          location: string | null
          quality_tier: string | null
          reporting_structure: string | null
          start_date: string
          updated_at: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          extraction_source?: string | null
          id?: string
          industry?: string | null
          is_current?: boolean | null
          job_title: string
          location?: string | null
          quality_tier?: string | null
          reporting_structure?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          extraction_source?: string | null
          id?: string
          industry?: string | null
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          quality_tier?: string | null
          reporting_structure?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: []
      }
      vault_work_style: {
        Row: {
          ai_confidence: number | null
          confidence_score: number | null
          created_at: string | null
          examples: string | null
          id: string
          ideal_environment: string | null
          inferred_from: string | null
          interview_scenario_match: string | null
          last_updated_at: string | null
          linkedin_work_philosophy_hook: string | null
          needs_user_review: boolean | null
          preference_area: string
          preference_description: string
          quality_tier: string | null
          team_compatibility_analysis: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          examples?: string | null
          id?: string
          ideal_environment?: string | null
          inferred_from?: string | null
          interview_scenario_match?: string | null
          last_updated_at?: string | null
          linkedin_work_philosophy_hook?: string | null
          needs_user_review?: boolean | null
          preference_area: string
          preference_description: string
          quality_tier?: string | null
          team_compatibility_analysis?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          ai_confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          examples?: string | null
          id?: string
          ideal_environment?: string | null
          inferred_from?: string | null
          interview_scenario_match?: string | null
          last_updated_at?: string | null
          linkedin_work_philosophy_hook?: string | null
          needs_user_review?: boolean | null
          preference_area?: string
          preference_description?: string
          quality_tier?: string | null
          team_compatibility_analysis?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_work_style_war_chest_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "career_vault"
            referencedColumns: ["id"]
          },
        ]
      }
      webinar_registrations: {
        Row: {
          attended: boolean | null
          feedback_rating: number | null
          feedback_text: string | null
          id: string
          registered_at: string | null
          user_id: string | null
          webinar_id: string | null
        }
        Insert: {
          attended?: boolean | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          registered_at?: string | null
          user_id?: string | null
          webinar_id?: string | null
        }
        Update: {
          attended?: boolean | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          registered_at?: string | null
          user_id?: string | null
          webinar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webinar_registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          calendly_link: string | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_name: string | null
          instructor_title: string | null
          is_platinum_only: boolean | null
          max_attendees: number | null
          recording_url: string | null
          scheduled_date: string
          status: string | null
          thumbnail_url: string | null
          title: string
          topics: string[] | null
          updated_at: string | null
          zoom_link: string | null
        }
        Insert: {
          calendly_link?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          instructor_title?: string | null
          is_platinum_only?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          scheduled_date: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Update: {
          calendly_link?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          instructor_title?: string | null
          is_platinum_only?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          scheduled_date?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_health_metrics: {
        Row: {
          active_functions: number | null
          active_users: number | null
          avg_latency_ms: number | null
          error_rate_percent: number | null
          errors_last_hour: number | null
          total_cost_last_hour: number | null
          total_requests_last_hour: number | null
        }
        Relationships: []
      }
      function_performance_metrics: {
        Row: {
          avg_latency_ms: number | null
          avg_retries: number | null
          day: string | null
          error_count: number | null
          error_rate_percent: number | null
          function_name: string | null
          p50_latency_ms: number | null
          p95_latency_ms: number | null
          p99_latency_ms: number | null
          request_count: number | null
          total_cost_usd: number | null
        }
        Relationships: []
      }
      user_ai_costs_monthly: {
        Row: {
          avg_execution_time_ms: number | null
          error_count: number | null
          month: string | null
          request_count: number | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_quota_status: {
        Row: {
          budget_exceeded: boolean | null
          cost_usage_percent: number | null
          daily_cost_spent_usd: number | null
          daily_request_count: number | null
          daily_request_limit: number | null
          days_until_reset: number | null
          is_over_limit: boolean | null
          monthly_cost_budget_usd: number | null
          monthly_cost_spent_usd: number | null
          monthly_request_count: number | null
          monthly_request_limit: number | null
          percent_used: number | null
          reset_date: string | null
          tier: string | null
          user_id: string | null
        }
        Insert: {
          budget_exceeded?: never
          cost_usage_percent?: never
          daily_cost_spent_usd?: never
          daily_request_count?: never
          daily_request_limit?: number | null
          days_until_reset?: never
          is_over_limit?: never
          monthly_cost_budget_usd?: number | null
          monthly_cost_spent_usd?: number | null
          monthly_request_count?: number | null
          monthly_request_limit?: number | null
          percent_used?: never
          reset_date?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          budget_exceeded?: never
          cost_usage_percent?: never
          daily_cost_spent_usd?: never
          daily_request_count?: never
          daily_request_limit?: number | null
          days_until_reset?: never
          is_over_limit?: never
          monthly_cost_budget_usd?: number | null
          monthly_cost_spent_usd?: number | null
          monthly_request_count?: number | null
          monthly_request_limit?: number | null
          percent_used?: never
          reset_date?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_password_strength: { Args: { password: string }; Returns: boolean }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      generate_api_key: { Args: never; Returns: string }
      get_items_needing_review: {
        Args: { p_user_id: string }
        Returns: {
          content: string
          created_at: string
          evidence: string
          id: string
          quality_tier: string
          type: string
          vault_id: string
        }[]
      }
      get_vault_statistics: { Args: { p_vault_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_quotas: { Args: never; Returns: undefined }
      search_vault_items: {
        Args: {
          p_category?: string
          p_limit?: number
          p_quality_tier?: string
          p_search_query: string
          p_vault_id: string
        }
        Returns: {
          confidence_score: number
          content: string
          item_id: string
          item_type: string
          match_rank: number
          quality_tier: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "affiliate" | "admin" | "retirement_client"
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
    Enums: {
      app_role: ["user", "affiliate", "admin", "retirement_client"],
    },
  },
} as const
