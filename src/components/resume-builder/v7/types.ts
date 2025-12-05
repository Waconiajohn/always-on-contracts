/**
 * Resume Builder V7 - Type Definitions
 * Complete type system for the redesigned builder
 */

// Score Types
export interface ScoreBreakdown {
  ats: number;
  requirements: number;
  competitive: number;
}

export interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

// Detected Profile Info
export interface DetectedInfo {
  role: string;
  industry: string;
  level: string;
}

// Gap Analysis Types
export interface GapAnalysisResult {
  fullMatches: { requirement: string; evidence: string }[];
  partialMatches: { requirement: string; currentStatus: string; recommendation: string }[];
  missingRequirements: { requirement: string; workaround: string }[];
  overqualifications: { experience: string; recommendation: string }[];
  irrelevantContent: { content: string; recommendation: string }[];
  gapSummary: string[];
}

// Template Types
export type TemplateId = 'executive' | 'modern' | 'classic' | 'technical';

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  bestFor: string[];
  atsScore: number;
  recommended?: boolean;
  previewImage?: string;
  features: string[];
}

// Section Types
export type SectionType = 'summary' | 'experience' | 'skills' | 'education' | 'certifications';

export interface SectionContent {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  bullets?: string[];
  isComplete: boolean;
  lastModified?: Date;
}

// Quick Glance Types
export interface QuickGlanceHotZone {
  section: string;
  content: string;
  attention: 'hot' | 'warm' | 'scanned' | 'skipped';
  feedback: string;
}

export interface QuickGlanceResult {
  score: number;
  hotZones: QuickGlanceHotZone[];
  noticedIn8Seconds: { item: string; strength: 'strong' | 'weak' | 'missing'; requirement?: string }[];
  suggestions: { area: string; current: string; suggested: string; reason: string }[];
}

// ATS Types
export interface ATSIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'parsing' | 'keywords' | 'format' | 'structure';
  title: string;
  description: string;
  fix?: string;
  autoFixable: boolean;
  fixed: boolean;
}

export interface MissingKeyword {
  keyword: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  suggestedPlacement: string;
}

export interface ATSAuditResult {
  parseScore: number;
  formatScore: number;
  keywordScore: number;
  overallScore: number;
  issues: ATSIssue[];
  missingKeywords: MissingKeyword[];
  passedChecks: string[];
}

// Humanization Types
export interface HumanizationResult {
  beforeScore: number;
  afterScore: number;
  changes: { before: string; after: string; reason: string }[];
  changesDescription: string;
}

// Hiring Manager Review Types
export interface HMReviewResult {
  verdict: 'would-interview' | 'maybe' | 'would-not-interview';
  confidence: number;
  timeToDecision: number;
  standoutItems: string[];
  concerns: string[];
  marketContext?: {
    averageSalary: string;
    competitorInsights: string;
    keyTrends: string;
  };
  overallFeedback: string;
}

// Builder State
export interface V7BuilderState {
  // Input data
  resumeText: string;
  jobDescription: string;
  
  // Scores
  initialScore: number;
  currentScore: number;
  previousScore?: number;
  scores: ScoreBreakdown;
  
  // Profile
  detected: DetectedInfo;
  
  // Gap Analysis
  gapAnalysis: GapAnalysisResult | null;
  quickWins: string[];
  
  // Template
  selectedTemplate: ResumeTemplate | null;
  
  // Sections
  sections: Record<SectionType, SectionContent>;
  currentSection: SectionType;
  
  // Quick Glance
  quickGlanceResult: QuickGlanceResult | null;
  
  // ATS
  atsAuditResult: ATSAuditResult | null;
  
  // Humanization
  humanizationResult: HumanizationResult | null;
  
  // HM Review
  hmReviewResult: HMReviewResult | null;
  
  // Research
  industryResearch: string | null;
  
  // UI State
  isProcessing: boolean;
  processingMessage: string;
}

// Step Definition
export type V7Step = 
  | 'gap-analysis'
  | 'template-gallery'
  | 'section-studio'
  | 'quick-glance-test'
  | 'ats-control-center'
  | 'humanization-lab'
  | 'hm-review'
  | 'export';

export const V7_STEP_ORDER: V7Step[] = [
  'gap-analysis',
  'template-gallery',
  'section-studio',
  'quick-glance-test',
  'ats-control-center',
  'humanization-lab',
  'hm-review',
  'export'
];

export const V7_STEP_LABELS: Record<V7Step, string> = {
  'gap-analysis': 'Gap Analysis',
  'template-gallery': 'Choose Template',
  'section-studio': 'Build Resume',
  'quick-glance-test': 'Quick Glance',
  'ats-control-center': 'ATS Audit',
  'humanization-lab': 'Humanize',
  'hm-review': 'HM Review',
  'export': 'Export'
};

// AI Enhancement Types
export type AIEnhancementType = 'expand' | 'ats-boost' | 'quantify' | 'benchmark';

export interface AIEnhancement {
  id: AIEnhancementType;
  name: string;
  description: string;
  bestFor: string;
  estimatedImpact: string;
  icon: string;
}

// Calculate score tier
export function calculateTier(score: number): ScoreTier {
  if (score >= 90) return { tier: 'ON_FIRE', emoji: '🚀', color: 'red', message: 'Benchmark Achieved!' };
  if (score >= 75) return { tier: 'HOT', emoji: '🔥', color: 'orange', message: 'Almost there!' };
  if (score >= 60) return { tier: 'WARM', emoji: '🌡️', color: 'amber', message: 'Good progress' };
  if (score >= 40) return { tier: 'LUKEWARM', emoji: '😐', color: 'yellow', message: 'Needs work' };
  if (score >= 20) return { tier: 'COLD', emoji: '❄️', color: 'blue', message: 'Major changes needed' };
  return { tier: 'FREEZING', emoji: '🥶', color: 'blue', message: 'Critical gaps' };
}
