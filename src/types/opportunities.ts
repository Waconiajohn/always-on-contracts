export interface OpportunityMatch {
  id: string;
  match_score: number | null;
  ai_recommendation: string | null;
  status: string | null;
  source: string;
  created_at: string | null;
  matching_skills: string[] | null;
  opportunity_id: string;
  applied_date: string | null;
  user_id: string;
  job_opportunities: {
    id: string;
    job_title: string;
    agency_id: string | null;
    location: string | null;
    contract_type: string | null;
    job_description: string | null;
    required_skills: string[] | null;
    external_url: string | null;
    posted_date: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    contract_duration_months: number | null;
    contract_confidence_score: number | null;
    quality_score: number | null;
  };
}

export type JobType = 'full-time' | 'contract';
