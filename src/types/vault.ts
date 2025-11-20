/**
 * Type-safe Career Vault data structures
 * Replaces all any[] types with proper interfaces
 * These types match the actual Supabase schema
 */

export interface VaultItem {
  id: string;
  content: string;
  category?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

// Database schema types that match actual tables
export interface PowerPhrase {
  id: string;
  vault_id: string;
  power_phrase?: string;
  phrase?: string;
  keywords?: string[] | null;
  category?: string;
  confidence_score?: number | null;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string;
  ai_confidence?: number | null;
  impact_metrics?: any;
  inferred_from?: string | null;
  // V3 Hybrid Enhancement Fields
  section_source?: string | null;
  extraction_version?: string | null;
  review_priority?: number | null;
  industry_context?: any;
  enhancement_notes?: string | null;
  resume_section?: string | null;
  usage_context?: string[] | null;
  [key: string]: any; // Allow additional properties
}

export interface TransferableSkill {
  id: string;
  vault_id: string;
  stated_skill?: string;
  skill?: string;
  evidence?: string;
  category?: string;
  confidence_score?: number | null;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string;
  // V3 Hybrid Enhancement Fields
  section_source?: string | null;
  extraction_version?: string | null;
  review_priority?: number | null;
  industry_context?: any;
  enhancement_notes?: string | null;
  resume_section?: string | null;
  usage_context?: string[] | null;
  [key: string]: any;
}

export interface HiddenCompetency {
  id: string;
  vault_id: string;
  competency_area?: string;
  competency_type?: string;
  inferred_capability?: string;
  supporting_evidence?: string | string[];
  evidence?: string[];
  confidence_score?: number | null;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string;
  // V3 Hybrid Enhancement Fields
  section_source?: string | null;
  extraction_version?: string | null;
  review_priority?: number | null;
  industry_context?: any;
  enhancement_notes?: string | null;
  resume_section?: string | null;
  usage_context?: string[] | null;
  [key: string]: any;
}

export interface SoftSkill {
  id: string;
  vault_id: string;
  skill_name?: string;
  examples?: string | string[];
  skill_level?: string;
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  // V3 Hybrid Enhancement Fields
  section_source?: string | null;
  extraction_version?: string | null;
  review_priority?: number | null;
  industry_context?: any;
  enhancement_notes?: string | null;
  resume_section?: string | null;
  usage_context?: string[] | null;
  [key: string]: any;
}

export interface LeadershipPhilosophy {
  id: string;
  vault_id: string;
  philosophy_statement?: string;
  leadership_style?: string | null;
  philosophy_type?: string;
  key_principles?: string[];
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface ExecutivePresence {
  id: string;
  vault_id: string;
  presence_indicator?: string;
  situational_example?: string;
  trait_category?: string;
  behavioral_examples?: string[];
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface PersonalityTrait {
  id: string;
  vault_id: string;
  trait_name?: string;
  behavioral_evidence?: string;
  trait_type?: string;
  manifestations?: string[];
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface WorkStyle {
  id: string;
  vault_id: string;
  preference_area?: string;
  preference_description?: string;
  style_category?: string;
  preferences?: string[];
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface CoreValue {
  id: string;
  vault_id: string;
  value_name?: string;
  manifestation?: string;
  value_category?: string;
  importance_level?: string | null;
  quality_tier?: string | null;
  inferred_from?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface BehavioralIndicator {
  id: string;
  vault_id: string;
  indicator_type?: string;
  specific_behavior?: string;
  observable_behaviors?: string[];
  context?: string | null;
  quality_tier?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at: string | null;
  [key: string]: any;
}

export interface VaultData {
  powerPhrases: PowerPhrase[];
  transferableSkills: TransferableSkill[];
  hiddenCompetencies: HiddenCompetency[];
  softSkills: SoftSkill[];
  leadershipPhilosophy: LeadershipPhilosophy[];
  executivePresence: ExecutivePresence[];
  personalityTraits: PersonalityTrait[];
  workStyle: WorkStyle[];
  values: CoreValue[];
  behavioralIndicators: BehavioralIndicator[];
  workPositions: WorkPosition[];
  education: Education[];
  milestones: ResumeMilestone[];
}

export interface VaultMatch {
  id: string;
  item: VaultItem;
  relevance_score: number;
  match_reason?: string;
  category: string;
}

export interface VaultMatchWithQuality extends VaultMatch {
  quality_score: number;
  quality_details?: {
    specificity: number;
    impact: number;
    relevance: number;
  };
}

// Critical structural data types matching database schema
export interface WorkPosition {
  id: string;
  vault_id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
  responsibilities?: string[] | null;
  achievements?: string[] | null;
  technologies_used?: string[] | null;
  team_size?: number | null;
  confidence_score?: number | null;
  quality_tier?: string | null;
  extraction_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface Education {
  id: string;
  vault_id: string;
  user_id: string;
  institution_name: string;
  degree_type?: string;
  degree_name?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  graduation_year?: number | null;
  is_in_progress?: boolean | null;
  gpa?: number | null;
  honors?: string | null;
  relevant_coursework?: string[] | null;
  thesis_title?: string | null;
  description?: string | null;
  confidence_score?: number | null;
  quality_tier?: string | null;
  extraction_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface ResumeMilestone {
  id: string;
  vault_id?: string;
  user_id?: string;
  milestone_title?: string | null;
  title?: string | null;
  organization?: string;
  company_name?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  description?: string | null;
  achievements?: string[] | null;
  skills_used?: string[] | null;
  metrics?: MilestoneMetric[] | null;
  metric_type?: string | null;
  metric_value?: string | null;
  context?: string | null;
  confidence_score?: number | null;
  quality_tier?: string | null;
  extraction_source?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export interface MilestoneMetric {
  metric: string;
  value: string | number;
  context?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'number';
  required?: boolean;
  options?: QuestionOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface QuestionResponse {
  question_id: string;
  answer: string | string[] | number;
  metadata?: Record<string, unknown>;
}

export interface BatchQuestions {
  batch_id: string;
  questions: Question[];
  title?: string;
  description?: string;
}

// Utility type guards
export const isVaultItem = (item: unknown): item is VaultItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'content' in item
  );
};

export const isVaultMatch = (item: unknown): item is VaultMatch => {
  return (
    isVaultItem(item) &&
    'relevance_score' in item &&
    'category' in item
  );
};
