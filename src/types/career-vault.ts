// =====================================================
// CAREER VAULT TYPE DEFINITIONS - Career Vault 2.0
// =====================================================
// Comprehensive TypeScript interfaces for Career Vault
// data structures, replacing 'any' types throughout.
// =====================================================

// ==================== DATABASE TYPES ====================

export type QualityTier = 
  | 'draft'          // Needs enhancement
  | 'needs_review'   // Has enhancements, needs verification
  | 'verified'       // User-verified
  | 'gold'           // Exceptional quality
  | 'silver'         // Good quality
  | 'bronze'         // Acceptable quality
  | 'assumed';       // AI-generated, unverified

export type ResumeSection = 
  | 'work_experience'
  | 'education'
  | 'certifications'
  | 'summary'
  | 'skills'
  | 'volunteer'
  | 'publications'
  | 'awards';

export type OnboardingStep =
  | 'not_started'
  | 'resume_uploaded'
  | 'analysis_complete'
  | 'targets_set'
  | 'research_complete'
  | 'auto_population_complete'
  | 'review_complete'
  | 'onboarding_complete';

export type CareerDirection = 'stay' | 'pivot' | 'explore';

export interface CareerVault {
  id: string;
  user_id: string;
  resume_raw_text: string | null;
  resume_file_path: string | null;
  initial_analysis: InitialAnalysis | null;
  career_direction: CareerDirection | null;
  target_roles: string[] | null;
  target_industries: string[] | null;
  industry_research: IndustryResearch | null;
  onboarding_step: OnboardingStep;
  vault_version: string;
  vault_strength_before_qa: number | null;
  vault_strength_after_qa: number | null;
  last_gap_analysis_at: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== ANALYSIS TYPES ====================

export interface InitialAnalysis {
  summary: string;
  currentRole: string;
  yearsOfExperience: number;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'executive';
  topAchievements: string[];
  keySkills: string[];
  industries: string[];
  careerTrajectory: string;
  suggestedPaths?: CareerPath[];
}

export interface CareerPath {
  title: string;
  matchScore: number;
  reasoning: string;
  requiredSkills: string[];
  averageSalaryRange: string;
  growthOutlook: string;
}

export interface IndustryResearch {
  targetRole: string;
  targetIndustry: string;
  marketDemand: string;
  salaryRange: string;
  requiredSkills: string[];
  competitiveAdvantages: string[];
  trends: string[];
  topCompanies: string[];
  sources: string[];
  researchedAt: string;
}

// ==================== VAULT ITEM TYPES ====================

export interface VaultItemBase {
  id: string;
  vault_id: string;
  user_id?: string;
  quality_tier: QualityTier;
  confidence_score?: number;
  effectiveness_score?: number;
  source_context?: string | null;
  usage_count?: number;
  last_updated_at?: string;
  created_at: string;
  updated_at?: string;
  inferred_from?: string;
  needs_user_review?: boolean;
  // V3 Hybrid Enhancement Fields
  section_source?: string;
  extraction_version?: string;
  review_priority?: number; // 0-100
  industry_context?: {
    industry?: string;
    role?: string;
    seniority?: string;
    benchmarks?: Record<string, any>;
    demandLevel?: 'low' | 'medium' | 'high';
  };
  enhancement_notes?: string;
  resume_section?: ResumeSection;
  usage_context?: string[];
}

export interface PowerPhrase extends VaultItemBase {
  power_phrase: string;
  phrase?: string; // Alias
  category: string;
  impact_area?: string;
  original_text?: string;
  impact_metrics?: Record<string, number | string>;
  keywords?: string[];
  source?: string;
}

export interface TransferableSkill extends VaultItemBase {
  stated_skill: string;
  skill?: string; // Alias
  skill_category?: string;
  category?: string;
  proficiency_level?: string;
  years_experience?: number | null;
  evidence?: string;
  equivalent_skills?: string[]; // Cross-functional skill mappings
}

export interface HiddenCompetency extends VaultItemBase {
  competency?: string;
  competency_area?: string;
  competency_type?: string;
  inferred_capability?: string;
  competency_category?: string;
  evidence?: string;
  supporting_evidence?: string | string[];
}

export interface SoftSkill extends VaultItemBase {
  soft_skill?: string;
  skill_name?: string;
  skill_type?: string;
  behavioral_evidence?: string;
  examples?: string | string[];
  skill_level?: string;
}

export interface LeadershipPhilosophy extends VaultItemBase {
  philosophy_statement: string;
  leadership_style: string;
  key_principles: string[];
}

export interface ExecutivePresence extends VaultItemBase {
  presence_indicator: string;
  presence_category: string;
  demonstrated_context: string;
}

export interface PersonalityTrait extends VaultItemBase {
  trait: string;
  trait_category: string;
  supporting_evidence: string;
}

export interface WorkStyle extends VaultItemBase {
  work_style_characteristic: string;
  style_category: string;
  manifestation: string;
}

export interface ValuesMotivations extends VaultItemBase {
  value_statement: string;
  value_category: string;
  evidence_context: string;
}

export interface BehavioralIndicator extends VaultItemBase {
  behavior: string;
  behavior_category: string;
  observed_context: string;
}

// ==================== GAP ANALYSIS TYPES ====================

export type AnalysisType = 'gap_analysis' | 'completion_benchmark' | 'custom';

export interface GapAnalysis {
  id: string;
  vault_id: string;
  analysis_type: AnalysisType;
  identified_gaps: Gap[];
  competitive_insights: CompetitiveInsights | null;
  recommendations: Recommendation[];
  percentile_ranking: number | null;
  vault_strength_at_analysis: number | null;
  strengths: Strength[] | null;
  opportunities: Opportunity[] | null;
  created_at: string;
}

export interface Gap {
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  howToFill: string;
  estimatedTimeToFill?: string;
}

export interface CompetitiveInsights {
  vsTopPerformers: string;
  marketPosition: string;
  differentiators: string[];
  areasToWatch: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedBoost: number;
  timeToImplement: string;
  priority: number;
}

export interface Strength {
  area: string;
  description: string;
  advantage: string;
  examples: string[];
}

export interface Opportunity {
  area: string;
  description: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: string;
}

// ==================== STATISTICS TYPES ====================

export interface VaultStatistics {
  categoryCounts: {
    power_phrases: number;
    transferable_skills: number;
    hidden_competencies: number;
    soft_skills: number;
    leadership_philosophy: number;
    executive_presence: number;
    personality_traits: number;
    work_style: number;
    values_motivations: number;
    behavioral_indicators: number;
  };
  qualityBreakdown: {
    gold: number;
    silver: number;
    bronze: number;
    assumed: number;
  };
  totalItems: number;
}

// ==================== SEARCH TYPES ====================

export interface SearchResult {
  item_id: string;
  item_type: string;
  content: string;
  quality_tier: QualityTier;
  confidence_score: number;
  effectiveness_score: number;
  match_rank: number;
}

export interface SearchInsights {
  totalResults: number;
  categoriesFound: string[];
  qualityBreakdown: {
    gold: number;
    silver: number;
    bronze: number;
    assumed: number;
  };
  avgMatchRank: number;
}

// ==================== BULK OPERATIONS TYPES ====================

export interface BulkOperation {
  operation: 'update_quality' | 'delete' | 'archive';
  tableName: string;
  itemIds: string[];
  newValues?: {
    quality_tier?: QualityTier;
    [key: string]: any;
  };
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  newVaultStrength?: number;
  errors?: string[];
}

// ==================== EXPORT TYPES ====================

export type ExportFormat = 'json' | 'csv' | 'text';

export interface ExportOptions {
  vaultId: string;
  format: ExportFormat;
  categories: string[];
  qualityTiers: QualityTier[];
  includeMetadata: boolean;
}

export interface ExportResult {
  content: string;
  contentType: string;
  filename: string;
  totalItems: number;
}

// ==================== REVIEW TYPES ====================

export interface ReviewAction {
  itemId: string;
  tableName: string;
  action: 'confirm' | 'reject' | 'edit';
  newValue?: string;
  newQualityTier?: QualityTier;
}

export interface ReviewBatch {
  vaultId: string;
  actions: ReviewAction[];
}

export interface ReviewResult {
  processed: number;
  confirmed: number;
  rejected: number;
  edited: number;
  newVaultStrength: number;
}

// ==================== GAP FILLING TYPES ====================

export interface GapFillingQuestion {
  id: string;
  question: string;
  category: string;
  gapArea: string;
  questionType: 'text' | 'multiple_choice' | 'rating' | 'checkbox';
  options?: string[];
  helpText?: string;
}

export interface GapFillingResponse {
  questionId: string;
  answer: string | string[] | number;
  category: string;
}

export interface GapFillingResult {
  newItemsCreated: number;
  categoriesImproved: string[];
  newVaultStrength: number;
  strengthIncrease: number;
}

// ==================== UI COMPONENT TYPES ====================

export interface OnboardingData {
  vaultId?: string;
  resumeText?: string;
  initialAnalysis?: InitialAnalysis;
  careerDirection?: CareerDirection;
  targetRoles?: string[];
  targetIndustries?: string[];
  industryResearch?: IndustryResearch;
  extractedData?: {
    totalItems: number;
    vaultStrength: number;
    breakdown: VaultStatistics;
  };
  vaultStrength?: number;
}

export interface SelectedVaultItem {
  id: string;
  tableName: string;
  category: string;
  content: string;
  qualityTier?: QualityTier;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    message: string;
    uniqueValue?: string;
    searchTip?: string;
    [key: string]: any;
  };
}
