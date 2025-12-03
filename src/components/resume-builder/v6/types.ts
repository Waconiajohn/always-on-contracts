/**
 * Types for Benchmark Resume Builder V6
 */

// Score breakdown
export interface ScoreBreakdown {
  ats: number;
  requirements: number;
  competitive: number;
}

// Detected role/industry info
export interface DetectedInfo {
  role: string;
  industry: string;
  level: string;
}

// Gap analysis
export interface Gap {
  id: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  category: string;
  issue: string;
  fix: string;
  impact: string;
  resolved: boolean;
}

// Resume templates
export type TemplateType = 'chronological' | 'functional' | 'combination' | 'executive';

export interface ResumeTemplate {
  id: TemplateType;
  name: string;
  description: string;
  bestFor: string[];
  atsScore: number;
  recommended?: boolean;
  preview: string;
}

// Resume section types
export type SectionType = 'summary' | 'highlights' | 'experience' | 'skills' | 'education' | 'certifications';

export interface ResumeBullet {
  id: string;
  originalText: string;
  currentText: string;
  suggestedVersions: {
    conservative: string;
    moderate: string;
    aggressive: string;
  };
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  confidence: 'exact' | 'enhanced' | 'invented';
  keywords: string[];
  metrics?: string[];
  source?: 'vault' | 'resume' | 'ai_generated';
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  bullets: ResumeBullet[];
  isComplete: boolean;
  isEditing: boolean;
  order: number;
  roleInfo?: {
    company: string;
    title: string;
    dates: string;
    location?: string;
  };
}

// ATS Audit
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

export interface KeywordAnalysis {
  keyword: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  present: boolean;
  count: number;
  suggestedPlacement?: string;
}

export interface ATSAuditResult {
  overallScore: number;
  parseTestPassed: boolean;
  issues: ATSIssue[];
  keywords: KeywordAnalysis[];
  formatScore: number;
  structureScore: number;
  keywordCoverage: number;
}

// Hiring Manager Review
export interface HMFeedbackItem {
  id: string;
  type: 'positive' | 'suggestion' | 'concern';
  category: 'clarity' | 'impact' | 'relevance' | 'credibility' | 'formatting';
  title: string;
  description: string;
  section?: string;
  priority: number;
}

export interface HMReviewResult {
  overallImpression: 'strong' | 'good' | 'needs-work';
  timeToReadSeconds: number;
  wouldInterview: boolean;
  feedback: HMFeedbackItem[];
  strengthAreas: string[];
  improvementAreas: string[];
}

// Humanization
export interface HumanizationResult {
  originalText: string;
  humanizedText: string;
  changesDescription: string;
  aiConfidenceReduced: boolean;
}

// Main builder state
export interface BenchmarkBuilderState {
  resumeText: string;
  jobDescription: string;
  initialScore: number;
  currentScore: number;
  previousScore?: number;
  scores: ScoreBreakdown;
  detected: DetectedInfo;
  gaps: Gap[];
  quickWins: string[];
  selectedTemplate: ResumeTemplate | null;
  sections: ResumeSection[];
  currentSectionIndex: number;
  atsAuditResult: ATSAuditResult | null;
  hmReviewResult: HMReviewResult | null;
  humanizedContent: HumanizationResult | null;
  isProcessing: boolean;
  processingMessage: string;
  industryResearch: string | null;
}

// Step props
export interface StepProps {
  state: BenchmarkBuilderState;
  onNext?: () => void;
  onBack?: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

// Export formats
export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'clipboard';
