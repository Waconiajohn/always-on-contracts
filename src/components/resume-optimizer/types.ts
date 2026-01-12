// Resume Optimizer V10 - Types
// Rubric-First, Evidence-Safe Benchmark Resume System

// ============= Step Types =============
export type OptimizerStep = 
  | 'gap-analysis'        // Step 1: Fit Blueprint (Pass 1)
  | 'proof-collector'     // Step 2: Executive Proof Collector (NEW)
  | 'customization'       // Step 3: Intensity/tone controls
  | 'strategic-versions'  // Step 4: Benchmark Resume (Pass 2)
  | 'hiring-manager';     // Step 5: Hiring manager review

// Single source of truth for step order
export const STEP_ORDER: OptimizerStep[] = [
  'gap-analysis',
  'proof-collector',
  'customization',
  'strategic-versions',
  'hiring-manager'
];

export const STEP_CONFIG: Record<OptimizerStep, {
  title: string;
  subtitle: string;
  icon: string;
  estimatedTime: string;
}> = {
  'gap-analysis': {
    title: 'Fit Blueprint',
    subtitle: 'Rubric-first analysis with role success criteria',
    icon: '🎯',
    estimatedTime: '2 min'
  },
  'proof-collector': {
    title: 'Executive Proof Collector',
    subtitle: 'Provide missing facts to strengthen claims',
    icon: '📝',
    estimatedTime: '3 min'
  },
  'customization': {
    title: 'Customize Your Approach',
    subtitle: 'Set intensity, tone, and 50+ preferences',
    icon: '⚙️',
    estimatedTime: '1 min'
  },
  'strategic-versions': {
    title: 'Benchmark Resume',
    subtitle: 'Interview-safe, evidence-backed resume',
    icon: '📄',
    estimatedTime: '2 min'
  },
  'hiring-manager': {
    title: 'Hiring Manager Review',
    subtitle: 'Get feedback from an HM perspective',
    icon: '👔',
    estimatedTime: '2 min'
  }
};

// ============= Confidence Levels =============
export type ConfidenceLevel = 'very-high' | 'high' | 'moderate' | 'low';

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  'very-high': {
    label: 'Very High',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    icon: '🥇'
  },
  'high': {
    label: 'High',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: '🥈'
  },
  'moderate': {
    label: 'Moderate',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: '🥉'
  },
  'low': {
    label: 'Low',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '⚠️'
  }
};

// ============= Pass 1: Fit Blueprint Types =============

// Structured source data for evidence attribution
export interface EvidenceSource {
  jobTitle: string;
  company: string;
  dateRange?: string;        // e.g., "2018-2022"
  sectionType: 'summary' | 'selected_skills' | 'selected_accomplishments' | 'experience' | 'education' | 'certifications';
  endYear?: number;          // For recency calculation
}

// Recency status calculated from evidence end year
export type RecencyStatus = 'recent' | 'dated' | 'stale';

// Evidence from resume (E1, E2, E3...)
export interface EvidenceUnit {
  id: string;           // E1, E2, etc.
  sourceRole: string;
  source?: EvidenceSource;   // Structured source data
  text: string;
  strength: 'strong' | 'moderate' | 'weak' | 'inference';
  recencyStatus?: RecencyStatus;  // Calculated from endYear
}

// Atomic job requirement (R1, R2, R3...)
export interface AtomicRequirement {
  id: string;           // R1, R2, etc.
  requirement: string;
  type: 'Leadership' | 'Domain' | 'Execution' | 'Metrics' | 'Tooling' | 'Communication' | 'Strategy';
  senioritySignal: 'Director-level' | 'Manager-level' | 'IC-level';
  outcomeTarget: 'Retention' | 'Expansion' | 'Adoption' | 'Quality' | 'Revenue' | 'Risk' | 'Efficiency';
}

// Gap taxonomy types
export type GapTaxonomy = 'Domain' | 'Scope' | 'Ownership' | 'Metric' | 'Tooling' | 'Recency';

// Forward declaration for BulletTiers (defined below)
export interface BulletTierOption {
  bullet: string;
  emphasis: string;
  requiresConfirmation?: boolean;
  confirmationFields?: string[];
}

// Fit classification per requirement
export interface FitMapEntry {
  requirementId: string;
  category: 'HIGHLY QUALIFIED' | 'PARTIALLY QUALIFIED' | 'EXPERIENCE GAP';
  whyQualified?: string;        // Conversational explanation (2-3 sentences)
  resumeLanguage: string;       // Ready-to-paste resume bullet (mandatory)
  gapExplanation?: string;      // What's specifically missing (for partial/gaps)
  bridgingStrategy?: string;    // How to address the gap (for gaps only)
  rationale: string;
  evidenceIds: string[];
  gapTaxonomy: GapTaxonomy[];
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: ConfidenceLevel;
  // NEW: Pre-generated bullet tiers (Conservative/Strong/Aggressive)
  bulletTiers?: {
    conservative: BulletTierOption;
    strong: BulletTierOption;
    aggressive: BulletTierOption;
  };
}

// Staged bullet for user to collect during gap analysis
export interface StagedBullet {
  text: string;
  sectionHint?: string;
  requirementId?: string;
}

/**
 * @deprecated Use fitMap.resumeLanguage instead.
 * Kept for backwards compatibility with existing data structures.
 * New implementations should use inline-edited bullets from FitMapEntry.
 */
export interface BulletBankItem {
  bullet: string;
  evidenceIds: string[];
  requirementIds: string[];
}

// Missing bullets the user needs to provide info for
export interface MissingBulletPlan {
  id: string;
  targetRequirementIds: string[];
  whatToAskCandidate: string;
  whereToPlace: string;
  templateBullet: string;
}

// ATS keyword analysis
export interface ATSAlignment {
  topKeywords: string[];
  covered: { keyword: string; evidenceIds: string[] }[];
  missingButAddable: { keyword: string; whereToAdd: string; template: string }[];
  missingRequiresExperience: { keyword: string; whyGap: string }[];
}

// Executive summary from Pass 1
export interface ExecutiveSummary {
  hireSignal: string;
  likelyObjections: string[];
  mitigationStrategy: string[];
  bestPositioningAngle: string;
}

// Benchmark themes
export interface BenchmarkTheme {
  theme: string;
  evidenceIds: string[];
  requirementIds: string[];
}

// ============= NEW: Role Success Rubric Types =============

export interface CompetencyDef {
  id: string;
  name: string;
  definition: string;
  proofExamples: string[];
  antiPatterns: string[];
  weight?: 'critical' | 'important' | 'nice-to-have';
}

export interface MetricNorm {
  metric: string;
  typicalRange: string;
  unit: string;
  sources: string[];
  riskIfMissing: 'high' | 'medium' | 'low';
  context?: string;
}

export interface RoleSuccessRubric {
  roleArchetype: string;
  industryContext: string;
  coreOutcomes: string[];
  topCompetencies: CompetencyDef[];
  benchmarkProofPoints: string[];
  metricsNorms: MetricNorm[];
  commonPitfalls: string[];
  executiveSignals: string[];
}

export interface BenchmarkResumePattern {
  targetTitleRules: string[];
  sectionOrder: string[];
  signatureWinsPattern: {
    description: string;
    bulletFormula: string;
    examples: string[];
  };
  summaryPattern: {
    description: string;
    requiredElements: string[];
  };
  bulletFormula: string;
  orderingRules: string[];
  executive50PlusRules: string[];
}

// ============= NEW: Benchmark Candidate Profile Types =============

export interface BenchmarkCandidateProfile {
  topCompetencies: Array<{
    name: string;
    definition: string;
    proofExamples: string[];
    weight: 'critical' | 'important' | 'nice-to-have';
  }>;
  expectedProofPoints: string[];
  typicalMetrics: Array<{
    metric: string;
    range: string;
    context: string;
  }>;
  commonArtifacts: string[];
  weakResumePitfalls: string[];
}

// ============= NEW: Bullet Tier Types =============

export type BulletTierLevel = 'conservative' | 'strong' | 'aggressive';

export interface BulletTier {
  bullet: string;
  emphasis: string;
  requiresConfirmation?: boolean;
  confirmationFields?: string[];
}

export interface BulletTiers {
  conservative: BulletTier;
  strong: BulletTier;
  aggressive: BulletTier;
}

// ============= NEW: Gap Closer Strategy Types =============

export interface ClosingStrategy {
  type: 'adjacent_proof' | 'equivalent_substitution' | 'proof_extraction' | 'narrative_positioning';
  explanation: string;
  bulletOptions: Array<{
    tier: BulletTierLevel;
    bullet: string;
    requiredConfirmations?: string[];
  }>;
  questions?: Array<{
    question: string;
    fieldKey: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
  }>;
}

export interface GapCloserStrategy {
  requirementId: string;
  gapType: GapTaxonomy;
  strategies: ClosingStrategy[];
}

// ============= NEW: Scoring Report Types =============

export interface ScoringReport {
  fitScore: number;           // JD requirement coverage (0-100)
  benchmarkScore: number;     // Closeness to benchmark profile (0-100)
  credibilityScore: number;   // How defensible claims are (0-100)
  atsScore: number;           // Keyword coverage + readability (0-100)
  overallHireability: number; // Weighted composite
}

// ============= NEW: Score History Tracking =============

export type ScoreSnapshotTrigger = 'initial' | 'bullet_add' | 'bullet_remove' | 'fact_confirm' | 'manual_edit';

export interface ScoreSnapshot {
  timestamp: number;
  fitScore: number;
  benchmarkScore: number;
  credibilityScore: number;
  atsScore: number;
  overallHireability: number;
  triggeredBy: ScoreSnapshotTrigger;
}

// ============= NEW: Inference Map Types =============

export interface PlausibleInference {
  inference: string;
  constraint: string;
  riskOfOverreach: 'Low' | 'Medium' | 'High';
}

export interface ValidationQuestion {
  question: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'range' | 'select' | 'multi';
  exampleAnswer?: string;
  options?: string[];
}

export interface DraftBulletPlaceholder {
  status: 'NEEDS_CONFIRMATION';
  bullet: string;
  requiredFields: string[];
  targetRequirementIds: string[];
}

export interface InferenceMapEntry {
  requirementId: string;
  verifiedClaims: { claim: string; evidenceIds: string[] }[];
  plausibleInferences: PlausibleInference[];
  validationQuestions: ValidationQuestion[];
  draftBulletsPlaceholders: DraftBulletPlaceholder[];
}

// ============= NEW: Proof Collector Types =============

export type ProofFieldCategory = 'Scope' | 'Leadership' | 'Outcomes' | 'Stakeholders' | 'Tools' | 'Timeline';

export interface ProofCollectorField {
  fieldKey: string;
  label: string;
  description: string;
  fieldType: 'text' | 'number' | 'range' | 'select' | 'multi';
  options?: string[];
  examples?: string[];
  priority: 'high' | 'medium' | 'low';
  category: ProofFieldCategory;
}

// Complete Fit Blueprint (Pass 1 output) - ENHANCED
export interface FitBlueprint {
  // NEW: Rubric-first data
  roleSuccessRubric?: RoleSuccessRubric;
  benchmarkResumePattern?: BenchmarkResumePattern;
  
  // NEW: Benchmark candidate profile
  benchmarkCandidateProfile?: BenchmarkCandidateProfile;
  
  // NEW: Gap closer strategies
  gapCloserStrategies?: GapCloserStrategy[];
  
  // Existing fields
  evidenceInventory: EvidenceUnit[];
  requirements: AtomicRequirement[];
  fitMap: FitMapEntry[];
  benchmarkThemes: BenchmarkTheme[];
  /** @deprecated Use fitMap entries with resumeLanguage instead */
  bulletBank: BulletBankItem[];
  missingBulletPlan: MissingBulletPlan[];
  atsAlignment: ATSAlignment;
  executiveSummary: ExecutiveSummary;
  overallFitScore: number;
  
  // NEW: Inference safety layer
  inferenceMap?: InferenceMapEntry[];
  bulletBankVerified?: BulletBankItem[];
  bulletBankInferredPlaceholders?: DraftBulletPlaceholder[];
  proofCollectorFields?: ProofCollectorField[];
}

// ============= Pass 2: Benchmark Resume Types =============

export interface BenchmarkResume {
  resumeText: string;
  sections: ResumeSection[];
  changelog: ChangelogEntry[];
  followUpQuestions: string[];
}

export interface ChangelogEntry {
  section: string;
  change: string;
  rationale: string;
  evidenceUsed?: string[];
  requirementIds?: string[];
}

export interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'education' | 'certifications' | 'achievements' | 'competencies';
  title: string;
  content: string[];
  evidenceTags?: Record<number, string[]>; // index -> [E1, R2, ...]
  isEdited?: boolean;
}

// ============= Customization Types =============
export type IntensityLevel = 'conservative' | 'moderate' | 'aggressive';
export type TonePreference = 'formal' | 'conversational' | 'technical' | 'executive';

export interface CustomizationSettings {
  intensity: IntensityLevel;
  tone: TonePreference;
}

// ============= Hiring Manager Review Types =============
export interface HiringManagerReview {
  overallImpression: string;
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
  specificConcerns: HMConcern[];
  suggestedQuestions: string[];
  strengthsIdentified: string[];
  areasForImprovement: string[];
}

export interface HMConcern {
  area: string;
  concern: string;
  suggestion: string;
  severity: 'critical' | 'moderate' | 'minor';
}

// ============= Version History =============
export interface VersionHistoryEntry {
  id: string;
  timestamp: number;
  stepCompleted: OptimizerStep;
  resumeSnapshot: string;
  changeDescription: string;
  // For restore functionality
  fitBlueprint?: FitBlueprint;
  benchmarkResume?: BenchmarkResume;
}

// ============= Legacy Types (for backwards compatibility) =============
export interface ResumeVersion {
  id: string;
  name: string;
  emphasis: string;
  description: string;
  sections: ResumeSection[];
  score?: number;
}

// ============= NEW: Confirmed Facts (from Proof Collector) =============
export type ConfirmedFactValue = string | number | string[] | { min: number; max: number };

export interface ConfirmedFacts {
  [fieldKey: string]: ConfirmedFactValue;
}

// ============= NEW: Executive 50+ Preferences =============
export interface Executive50PlusPreferences {
  hideGraduationYears: boolean;
  experienceCondensationYears: number; // e.g., 15 means condense beyond 15 years
  includeAdditionalExperience: boolean;
  signatureWinsPosition: 'top' | 'inline';
}

// ============= NEW: Resume Mode =============
export type ResumeMode = 'interview-safe' | 'brainstorm';

// ============= Main State =============
export interface OptimizerState {
  // Input data
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  
  // Step 1: Fit Blueprint (Pass 1)
  fitBlueprint: FitBlueprint | null;
  
  // Step 2: Proof Collector (NEW - replaces missingBulletResponses)
  confirmedFacts: ConfirmedFacts;
  
  // Legacy Step 2: Missing Bullet Responses (kept for backwards compatibility)
  missingBulletResponses: Record<string, string>;
  
  // Step 2: Staged Bullets (user-collected suggestions)
  stagedBullets: StagedBullet[];
  
  // Step 3: Customization
  customization: CustomizationSettings;
  executive50PlusPrefs: Executive50PlusPreferences;
  resumeMode: ResumeMode;
  
  // Step 4: Benchmark Resume (Pass 2)
  benchmarkResume: BenchmarkResume | null;
  selectedTemplate?: { id: string; name: string };
  
  // Step 5: Hiring Manager Review
  hiringManagerReview: HiringManagerReview | null;
  
  // Score History Tracking
  scoreHistory: ScoreSnapshot[];
  initialScores: ScoreSnapshot | null;
  
  // Version History
  versionHistory: VersionHistoryEntry[];
  
  // UI State
  currentStep: OptimizerStep;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
  
  // Legacy (for backwards compatibility during transition)
  resumeVersions: ResumeVersion[];
  selectedVersionId?: string;
  gapAnalysis: any | null;
  careerProfile: any | null;
  isProfileConfirmed: boolean;
  selectedAnswers: Record<string, string>;
}

export const createInitialState = (): OptimizerState => ({
  resumeText: '',
  jobDescription: '',
  jobTitle: undefined,
  company: undefined,
  fitBlueprint: null,
  confirmedFacts: {},
  missingBulletResponses: {},
  stagedBullets: [],
  customization: {
    intensity: 'moderate',
    tone: 'formal'
  },
  executive50PlusPrefs: {
    hideGraduationYears: true,
    experienceCondensationYears: 15,
    includeAdditionalExperience: true,
    signatureWinsPosition: 'top'
  },
  resumeMode: 'interview-safe',
  benchmarkResume: null,
  selectedTemplate: undefined,
  hiringManagerReview: null,
  scoreHistory: [],
  initialScores: null,
  versionHistory: [],
  currentStep: 'gap-analysis',
  isProcessing: false,
  processingMessage: '',
  error: null,
  // Legacy defaults
  resumeVersions: [],
  selectedVersionId: undefined,
  gapAnalysis: null,
  careerProfile: null,
  isProfileConfirmed: false,
  selectedAnswers: {}
});
