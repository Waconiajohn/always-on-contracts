// Types for Must-Interview Resume Builder V3

export type BuilderStep = 'target' | 'assessment' | 'build' | 'review' | 'finalize';

export interface GapSuggestion {
  id: string;
  text: string;
  approach: 'vault_based' | 'industry_standard' | 'alternative';
  confidence: number;
  isEdited?: boolean;
  originalText?: string;
}

export interface ResumeGap {
  id: string;
  requirement: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  currentContent: string | null;
  suggestions: GapSuggestion[];
  userSelection: {
    selectedSuggestionId: string | null;
    customText: string | null;
    skipped: boolean;
  } | null;
}

export interface ResumeStrength {
  area: string;
  evidence: string;
  confidence: number;
}

export interface RecommendedFormat {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  thumbnail?: string;
}

export interface ResumeAssessment {
  alignmentScore: number;
  strengths: ResumeStrength[];
  gaps: ResumeGap[];
  recommendedFormats: RecommendedFormat[];
  industry: string;
  profession: string;
  seniority: string;
  roleTitle: string;
  companyName?: string;
  atsKeywords: {
    critical: string[];
    important: string[];
    niceToHave: string[];
  };
}

export interface ResumeSectionItem {
  id: string;
  content: string;
  order: number;
  isGapFill?: boolean;
  gapId?: string;
  vaultItemId?: string;
}

export interface ResumeSection {
  id: string;
  type: string;
  title: string;
  items: ResumeSectionItem[];
  order: number;
  required: boolean;
  status: 'pending' | 'generated' | 'edited' | 'approved';
  originalContent?: string;
  aiImprovedContent?: string;
  gapsAddressed: string[];
  atsKeywordsUsed: string[];
  resumeItemsUsed: string[];
}

export interface HiringManagerFeedback {
  firstImpressionScore: number;
  firstImpressionSummary: string;
  redFlags: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  strengths: string[];
  improvements: Array<{
    area: string;
    currentText: string;
    suggestedText: string;
    reason: string;
  }>;
  overallRecommendation: 'strong_hire' | 'consider' | 'needs_work' | 'pass';
}

export interface ATSReport {
  score: number;
  keywordMatches: Array<{
    keyword: string;
    found: boolean;
    context?: string;
  }>;
  formatIssues: string[];
  recommendations: string[];
}

export interface MustInterviewState {
  // Target inputs
  resumeText: string;
  resumeFile: File | null;
  jobDescription: string;
  jobUrl: string;

  // Analysis results
  assessment: ResumeAssessment | null;
  selectedFormat: string | null;

  // Generated content
  sections: ResumeSection[];
  
  // Progress tracking
  initialScore: number | null;
  currentScore: number | null;
  
  // Review results
  hiringManagerFeedback: HiringManagerFeedback | null;
  atsReport: ATSReport | null;
  
  // Meta
  isLoading: boolean;
  error: string | null;
}
