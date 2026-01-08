// Resume Optimizer V9 - Types
// 5-Step 2-Pass Benchmark Resume System

// ============= Step Types =============
export type OptimizerStep = 
  | 'gap-analysis'        // Step 1: Fit Blueprint (Pass 1)
  | 'answer-assistant'    // Step 2: Missing Bullet Collector
  | 'customization'       // Step 3: Intensity/tone controls
  | 'strategic-versions'  // Step 4: Benchmark Resume (Pass 2)
  | 'hiring-manager';     // Step 5: Hiring manager review

// Single source of truth for step order
export const STEP_ORDER: OptimizerStep[] = [
  'gap-analysis',
  'answer-assistant',
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
    subtitle: 'Deep evidence-backed analysis of your qualifications',
    icon: '🎯',
    estimatedTime: '2 min'
  },
  'answer-assistant': {
    title: 'Complete Your Profile',
    subtitle: 'Provide details to strengthen your resume',
    icon: '✍️',
    estimatedTime: '5 min'
  },
  'customization': {
    title: 'Customize Your Approach',
    subtitle: 'Set intensity and tone preferences',
    icon: '⚙️',
    estimatedTime: '1 min'
  },
  'strategic-versions': {
    title: 'Benchmark Resume',
    subtitle: 'Your optimized, interview-ready resume',
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

// Evidence from resume (E1, E2, E3...)
export interface EvidenceUnit {
  id: string;           // E1, E2, etc.
  sourceRole: string;
  text: string;
  strength: 'strong' | 'moderate' | 'weak' | 'inference';
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
}

// Staged bullet for user to collect during gap analysis
export interface StagedBullet {
  text: string;
  sectionHint?: string;
  requirementId?: string;
}

// Pre-generated bullets
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

// Complete Fit Blueprint (Pass 1 output)
export interface FitBlueprint {
  evidenceInventory: EvidenceUnit[];
  requirements: AtomicRequirement[];
  fitMap: FitMapEntry[];
  benchmarkThemes: BenchmarkTheme[];
  bulletBank: BulletBankItem[];
  missingBulletPlan: MissingBulletPlan[];
  atsAlignment: ATSAlignment;
  executiveSummary: ExecutiveSummary;
  overallFitScore: number;
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

// ============= Main State =============
export interface OptimizerState {
  // Input data
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  
  // Step 1: Fit Blueprint (Pass 1)
  fitBlueprint: FitBlueprint | null;
  
  // Step 2: Missing Bullet Responses
  missingBulletResponses: Record<string, string>;
  
  // Step 2: Staged Bullets (user-collected suggestions)
  stagedBullets: StagedBullet[];
  
  // Step 3: Customization
  customization: CustomizationSettings;
  
  // Step 4: Benchmark Resume (Pass 2)
  benchmarkResume: BenchmarkResume | null;
  selectedTemplate?: { id: string; name: string };
  
  // Step 5: Hiring Manager Review
  hiringManagerReview: HiringManagerReview | null;
  
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
  missingBulletResponses: {},
  stagedBullets: [],
  customization: {
    intensity: 'moderate',
    tone: 'formal'
  },
  benchmarkResume: null,
  selectedTemplate: undefined,
  hiringManagerReview: null,
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
