// Resume Builder V2 - TypeScript Types
// Evidence-locked, anti-hallucination resume optimization system

// ============================================
// Core Enums & Constants
// ============================================

export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'completed' | 'archived';

export type SeniorityLevel = 
  | 'IC' 
  | 'Senior IC' 
  | 'Manager' 
  | 'Senior Manager' 
  | 'Director' 
  | 'Senior Director' 
  | 'VP' 
  | 'SVP' 
  | 'C-Level';

export type EvidenceCategory = 
  | 'skill' 
  | 'tool' 
  | 'domain' 
  | 'responsibility' 
  | 'metric' 
  | 'leadership';

export type EvidenceSource = 'extracted' | 'user_provided';

export type EvidenceConfidence = 'high' | 'medium';

export type ActionSource = 
  | 'tighten' 
  | 'executive' 
  | 'specific' 
  | 'reduce_buzzwords' 
  | 'match_jd' 
  | 'conservative' 
  | 'try_another' 
  | 'micro_edit' 
  | 'manual' 
  | 'initial';

export type KeywordDecision = 'add' | 'ignore' | 'not_true' | 'ask_me';

export type JDRequirementCategory = 
  | 'hard_skill' 
  | 'tool' 
  | 'domain' 
  | 'responsibility' 
  | 'outcome' 
  | 'education' 
  | 'title' 
  | 'soft_skill';

export type BenchmarkCategory = 
  | 'hard_skill' 
  | 'tool' 
  | 'domain' 
  | 'leadership' 
  | 'responsibility' 
  | 'metric';

export type SectionHint = 'Summary' | 'Skills' | 'Experience' | 'Education';

// ============================================
// Database Row Types (matching rb_* tables)
// ============================================

export interface RBProject {
  id: string;
  user_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  jd_text: string | null;
  jd_confidence: number | null;
  role_title: string | null;
  seniority_level: SeniorityLevel | null;
  industry: string | null;
  sub_industry: string | null;
  target_confirmed: boolean;
  user_override_target: UserOverrideTarget | null;
  current_score: number | null;
  original_score: number | null;
}

export interface UserOverrideTarget {
  role_title?: string;
  seniority_level?: SeniorityLevel;
  industry?: string;
  sub_industry?: string;
}

export interface RBDocument {
  id: string;
  project_id: string;
  file_name: string;
  raw_text: string | null;
  parsed_json: ParsedResume | null;
  span_index: SpanIndex | null;
  created_at: string;
  updated_at: string;
}

export interface RBEvidence {
  id: string;
  project_id: string;
  claim_text: string;
  evidence_quote: string;
  category: EvidenceCategory;
  source: EvidenceSource;
  span_location: SpanLocation | null;
  confidence: EvidenceConfidence;
  is_active: boolean;
  created_at: string;
}

export interface RBVersion {
  id: string;
  project_id: string;
  section_name: string;
  version_number: number;
  content: string;
  action_source: ActionSource;
  is_active: boolean;
  created_at: string;
}

export interface RBKeywordDecision {
  id: string;
  project_id: string;
  keyword: string;
  decision: KeywordDecision;
  evidence_id: string | null;
  created_at: string;
}

export interface RBJDRequirement {
  id: string;
  project_id: string;
  category: JDRequirementCategory;
  text: string;
  weight: number;
  exact_phrases: string[] | null;
  synonyms: string[] | null;
  section_hint: SectionHint | null;
  created_at: string;
}

export interface RBBenchmarkRequirement {
  id: string;
  project_id: string;
  category: BenchmarkCategory;
  text: string;
  weight: number;
  section_hint: SectionHint | null;
  created_at: string;
}

// ============================================
// Parsed Resume Structure
// ============================================

export interface ParsedResume {
  header: ResumeHeader;
  summary?: string;
  skills?: SkillsSection;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications?: CertificationEntry[];
  projects?: ProjectEntry[];
  other?: OtherSection[];
}

export interface ResumeHeader {
  fullName: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface SkillsSection {
  hard_skills?: string[];
  tools?: string[];
  domain?: string[];
  soft_skills?: string[];
  all?: string[]; // Flat list if not categorized
}

export interface ExperienceEntry {
  id: string;
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  graduation_date?: string;
  gpa?: string;
  honors?: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  expiration?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export interface OtherSection {
  id: string;
  heading: string;
  content: string;
}

// ============================================
// Span Indexing (for evidence highlighting)
// ============================================

export interface SpanIndex {
  sections: SectionSpan[];
}

export interface SectionSpan {
  section: 'header' | 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'other';
  startChar: number;
  endChar: number;
  children?: ChildSpan[];
}

export interface ChildSpan {
  type: 'job' | 'bullet' | 'entry';
  index: number;
  startChar: number;
  endChar: number;
}

export interface SpanLocation {
  section: string;
  jobIndex?: number;
  bulletIndex?: number;
  startChar: number;
  endChar: number;
}

// ============================================
// AI Response Types (matching edge function schemas)
// ============================================

// AI Call #1: JD Classification
export interface JDClassificationResponse {
  role_title: string;
  role_alternates: string[];
  seniority_level: SeniorityLevel;
  industry: string;
  sub_industry: string | null;
  confidence: number;
  justification: {
    role: string;
    level: string;
    industry: string;
  };
}

// AI Call #2: JD Requirements Extraction
export interface JDRequirementsResponse {
  hard_skills: RequirementItem[];
  tools_tech: RequirementItem[];
  domain_knowledge: RequirementItem[];
  responsibilities: RequirementItem[];
  outcomes_metrics: RequirementItem[];
  education_certs: RequirementItem[];
  titles_seniority: RequirementItem[];
  soft_skills: RequirementItem[];
}

export interface RequirementItem {
  text: string;
  weight: number;
  exact_phrases: string[];
  synonyms: string[];
  section_hint: SectionHint;
}

// AI Call #3: Benchmark Generation
export interface BenchmarkResponse {
  benchmark_requirements: BenchmarkItem[];
  keyword_universe: string[];
}

export interface BenchmarkItem {
  text: string;
  category: BenchmarkCategory;
  weight: number;
  section_hint: SectionHint;
}

// AI Call #4: Resume Claim Extraction
export interface ClaimExtractionResponse {
  claims: ExtractedClaim[];
}

export interface ExtractedClaim {
  claim_text: string;
  category: EvidenceCategory;
  evidence_quote: string;
  confidence: EvidenceConfidence;
}

// AI Call #5: Gap Analysis
export interface GapAnalysisResponse {
  met: MetRequirement[];
  partial: PartialRequirement[];
  unmet: UnmetRequirement[];
  questions: string[];
  safe_keyword_insertions: string[];
}

export interface MetRequirement {
  requirement_text: string;
  evidence_quote: string;
}

export interface PartialRequirement {
  requirement_text: string;
  what_is_missing: string;
  evidence_quote: string | null;
}

export interface UnmetRequirement {
  requirement_text: string;
  recommended_action: 'add_keyword' | 'ask_user' | 'ignore';
}

// AI Call #6: Section Rewrite
export interface SectionRewriteResponse {
  rewritten_text: string;
  keywords_added: string[];
  evidence_used: string[];
  questions: string[];
}

// AI Call #7: Micro Edit
export interface MicroEditResponse {
  improved_line: string;
  evidence_used: string[];
  notes: string | null;
}

// AI Call #8: Hiring Manager Critique
export interface HiringManagerCritiqueResponse {
  top_issues: string[];
  risky_or_vague_claims: string[];
  safe_improvements: string[];
  questions_for_candidate: string[];
}

// AI Call #9: Validation (Hallucination Check)
export interface ValidationResponse {
  unsupported_claims: string[];
  unsupported_metrics: string[];
  unsupported_tools: string[];
  severity: 'low' | 'medium' | 'high';
}

// ============================================
// Score Report Types
// ============================================

export interface ScoreReport {
  overall_score: number;
  original_score: number;
  categories: ScoreCategory[];
}

export interface ScoreCategory {
  id: string;
  name: string;
  score: number;
  max_score: number;
  items: ScoreCategoryItem[];
}

export interface ScoreCategoryItem {
  text: string;
  status: 'met' | 'partial' | 'unmet';
  evidence_quote?: string;
  suggested_action?: string;
}

// ============================================
// UI State Types
// ============================================

export interface ProjectWithDetails extends RBProject {
  document?: RBDocument;
  evidence_count?: number;
  version_count?: number;
}

export interface StudioSection {
  name: string;
  path: string;
  isComplete: boolean;
  hasChanges: boolean;
}

export interface VersionHistoryEntry {
  id: string;
  version_number: number;
  action_source: ActionSource;
  content: string;
  created_at: string;
  is_active: boolean;
}

export interface KeywordChipData {
  keyword: string;
  hasEvidence: boolean;
  decision?: KeywordDecision;
  source: 'jd' | 'benchmark';
  section_hint?: SectionHint;
}

// ============================================
// Processing Pipeline Types
// ============================================

export type ProcessingStage = 
  | 'extract_jd_requirements'
  | 'generate_benchmark'
  | 'extract_resume_claims'
  | 'gap_analysis'
  | 'compute_score';

export interface ProcessingProgress {
  stage: ProcessingStage;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  error?: string;
}

// ============================================
// Form Types
// ============================================

export interface CreateProjectInput {
  jd_text?: string;
}

export interface UploadResumeInput {
  file: File;
  project_id: string;
}

export interface ConfirmTargetInput {
  project_id: string;
  role_title: string;
  seniority_level: SeniorityLevel;
  industry: string;
  sub_industry?: string;
}

export interface AddBulletInput {
  project_id: string;
  job_id: string;
  action: string;
  result?: string;
  tools?: string[];
}
