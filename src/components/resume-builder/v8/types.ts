/**
 * V8 Resume Builder Types
 * Evidence-first, zero-hallucination architecture
 */

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

export type V8Step = 'evidence-matrix' | 'build' | 'fine-tune' | 'export';

export const V8_STEPS: V8Step[] = ['evidence-matrix', 'build', 'fine-tune', 'export'];

export const V8_STEP_CONFIG: Record<V8Step, { 
  title: string; 
  subtitle: string; 
  icon: string;
  estimatedTime: string;
}> = {
  'evidence-matrix': {
    title: 'Match Evidence',
    subtitle: 'Connect your experience to job requirements',
    icon: '🎯',
    estimatedTime: '~30 seconds'
  },
  'build': {
    title: 'Build Resume',
    subtitle: 'Edit sections with live preview',
    icon: '✍️',
    estimatedTime: '5-10 minutes'
  },
  'fine-tune': {
    title: 'Fine-Tune',
    subtitle: 'Humanize and optimize for ATS',
    icon: '✨',
    estimatedTime: '2-3 minutes'
  },
  'export': {
    title: 'Export',
    subtitle: 'Download your must-interview resume',
    icon: '🚀',
    estimatedTime: '~30 seconds'
  }
};

// ============================================================================
// SCORE TYPES
// ============================================================================

export interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

export interface ScoreBreakdown {
  jdMatch: { score: number; weight: number };
  industryBenchmark: { score: number; weight: number };
  atsCompliance: { score: number; weight: number };
  humanVoice: { score: number; weight: number };
}

export interface DetectedInfo {
  role: string;
  industry: string;
  level: 'Entry-Level' | 'Mid-Level' | 'Senior' | 'Executive' | 'C-Level';
}

// ============================================================================
// GAP ANALYSIS TYPES
// ============================================================================

export interface GapMatch {
  requirement: string;
  evidence: string;
}

export interface PartialMatch {
  requirement: string;
  currentStatus: string;
  recommendation: string;
}

export interface MissingRequirement {
  requirement: string;
  workaround: string;
}

export interface GapAnalysis {
  fullMatches: GapMatch[];
  partialMatches: PartialMatch[];
  missingRequirements: MissingRequirement[];
  overqualifications: Array<{ experience: string; recommendation: string }>;
  irrelevantContent: Array<{ content: string; recommendation: string }>;
  gapSummary: string[];
}

// ============================================================================
// EVIDENCE MATRIX TYPES
// ============================================================================

export interface JobRequirement {
  id: string;
  text: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  category: 'skill' | 'experience' | 'certification' | 'domain';
}

export interface VaultEvidence {
  id: string;
  content: string;
  source: {
    milestoneId: string;
    workPositionId: string;
    company: string;
    jobTitle: string;
    dateRange: string;
  };
  qualityTier: 'strong' | 'good' | 'weak';
}

export interface EvidenceMatch {
  requirementId: string;
  requirementText: string;
  requirementCategory: string;
  milestoneId: string;
  originalBullet: string;
  originalSource: VaultEvidence['source'];
  matchScore: number;
  matchReasons: string[];
  qualityScore: 'strong' | 'good' | 'weak';
  enhancedBullet: string;
  atsKeywords: string[];
  isSelected: boolean; // User can toggle
}

export interface EvidenceMatrixResult {
  matches: EvidenceMatch[];
  unmatchedRequirements: JobRequirement[];
  stats: {
    totalRequirements: number;
    matchedRequirements: number;
    coverageScore: number;
  };
}

// ============================================================================
// RESUME SECTION TYPES
// ============================================================================

export type SectionType = 'summary' | 'experience' | 'skills' | 'education' | 'certifications';

export interface ResumeSection {
  id: SectionType;
  title: string;
  content: string;
  originalContent: string; // For comparison
  isComplete: boolean;
  isModified: boolean;
  evidenceUsed: string[]; // IDs of vault evidence used
  atsKeywords: string[]; // Keywords present in this section
  wordCount: number;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  dateRange: string;
  bullets: Array<{
    id: string;
    content: string;
    evidenceId?: string; // Link to vault evidence
    isAIGenerated: boolean;
    matchedRequirements: string[];
  }>;
}

// ============================================================================
// FINE-TUNE TYPES
// ============================================================================

export interface HumanizationResult {
  originalText: string;
  humanizedText: string;
  aiProbabilityBefore: number;
  aiProbabilityAfter: number;
  changesApplied: string[];
}

export interface ATSAuditResult {
  score: number;
  issues: Array<{
    type: 'format' | 'keyword' | 'structure';
    severity: 'critical' | 'warning' | 'info';
    description: string;
    fix: string;
  }>;
  keywordsPresent: string[];
  keywordsMissing: string[];
}

export interface HMReviewResult {
  overallImpression: string;
  strengths: string[];
  concerns: string[];
  interviewQuestions: string[];
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
}

// ============================================================================
// MAIN STATE TYPE
// ============================================================================

export interface V8BuilderState {
  // Input data (from QuickScore)
  resumeText: string;
  jobDescription: string;
  
  // Detected context
  detected: DetectedInfo;
  
  // Scores
  initialScore: number;
  currentScore: number;
  previousScore?: number;
  scoreBreakdown: ScoreBreakdown;
  tier: ScoreTier;
  
  // Gap Analysis (from instant-resume-score)
  gapAnalysis: GapAnalysis | null;
  
  // Evidence Matrix (from match-requirements-to-bullets)
  evidenceMatrix: EvidenceMatrixResult | null;
  
  // Resume Content
  sections: Record<SectionType, ResumeSection>;
  workExperiences: WorkExperience[];
  
  // Fine-tune results
  humanizationResult: HumanizationResult | null;
  atsAuditResult: ATSAuditResult | null;
  hmReviewResult: HMReviewResult | null;
  
  // UI State
  currentStep: V8Step;
  completedSteps: Set<V8Step>;
  isProcessing: boolean;
  processingMessage: string;
  
  // Persistence
  lastSavedAt: string | null;
  isDirty: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const createInitialSection = (id: SectionType, title: string): ResumeSection => ({
  id,
  title,
  content: '',
  originalContent: '',
  isComplete: false,
  isModified: false,
  evidenceUsed: [],
  atsKeywords: [],
  wordCount: 0
});

export const createInitialState = (partialState?: Partial<V8BuilderState>): V8BuilderState => ({
  resumeText: '',
  jobDescription: '',
  detected: { role: 'Professional', industry: 'General', level: 'Mid-Level' },
  initialScore: 0,
  currentScore: 0,
  scoreBreakdown: {
    jdMatch: { score: 0, weight: 60 },
    industryBenchmark: { score: 0, weight: 20 },
    atsCompliance: { score: 0, weight: 12 },
    humanVoice: { score: 0, weight: 8 }
  },
  tier: { tier: 'FREEZING', emoji: '🥶', color: '#1E40AF', message: 'Major gaps' },
  gapAnalysis: null,
  evidenceMatrix: null,
  sections: {
    summary: createInitialSection('summary', 'Professional Summary'),
    experience: createInitialSection('experience', 'Professional Experience'),
    skills: createInitialSection('skills', 'Skills & Competencies'),
    education: createInitialSection('education', 'Education'),
    certifications: createInitialSection('certifications', 'Certifications')
  },
  workExperiences: [],
  humanizationResult: null,
  atsAuditResult: null,
  hmReviewResult: null,
  currentStep: 'evidence-matrix',
  completedSteps: new Set(),
  isProcessing: false,
  processingMessage: '',
  lastSavedAt: null,
  isDirty: false,
  ...partialState
});

// ============================================================================
// ACTION TYPES
// ============================================================================

export type V8Action =
  | { type: 'SET_STEP'; step: V8Step }
  | { type: 'COMPLETE_STEP'; step: V8Step }
  | { type: 'SET_EVIDENCE_MATRIX'; result: EvidenceMatrixResult }
  | { type: 'TOGGLE_EVIDENCE_SELECTION'; matchId: string }
  | { type: 'UPDATE_SECTION_CONTENT'; sectionId: SectionType; content: string }
  | { type: 'MARK_SECTION_COMPLETE'; sectionId: SectionType }
  | { type: 'UPDATE_SCORE'; score: number; breakdown?: ScoreBreakdown }
  | { type: 'SET_PROCESSING'; isProcessing: boolean; message?: string }
  | { type: 'SET_HUMANIZATION_RESULT'; result: HumanizationResult }
  | { type: 'SET_ATS_AUDIT_RESULT'; result: ATSAuditResult }
  | { type: 'SET_HM_REVIEW_RESULT'; result: HMReviewResult }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_SAVED' }
  | { type: 'PREFILL_SECTIONS_FROM_EVIDENCE' };
