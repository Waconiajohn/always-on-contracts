// ResumeMatch Types

export interface KeywordMatch {
  keyword: string;
  priority: 'critical' | 'important' | 'nice_to_have';
  prevalence?: string;
}

export interface GapAnalysisItem {
  requirement: string;
  evidence?: string;
  currentStatus?: string;
  recommendation?: string;
  workaround?: string;
  content?: string;
  experience?: string;
}

export interface GapAnalysis {
  fullMatches: GapAnalysisItem[];
  partialMatches: GapAnalysisItem[];
  missingRequirements: GapAnalysisItem[];
  overqualifications: GapAnalysisItem[];
  irrelevantContent: GapAnalysisItem[];
  gapSummary: string[];
}

export interface ATSCompliance {
  headerIssues: string[];
  formatIssues: string[];
  keywordPlacement: string;
}

export interface ScoreBreakdown {
  jdMatch: {
    score: number;
    weight: number;
    matchedKeywords: KeywordMatch[];
    missingKeywords: KeywordMatch[];
    skillsMatch: number;
    experienceMatch: number;
  };
  industryBenchmark: {
    score: number;
    weight: number;
    roleStandards: string[];
    meetingStandards: string[];
    belowStandards: string[];
    competitiveRank: string;
  };
  atsCompliance: {
    score: number;
    weight: number;
    headerIssues: string[];
    formatIssues: string[];
    keywordPlacement: string;
  };
  humanVoice: {
    score: number;
    weight: number;
    aiProbability: number;
    concerns: string[];
    humanElements: string[];
  };
}

export interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

export interface ResumeMatchResult {
  success: boolean;
  overallScore: number;
  tier: ScoreTier;
  nextTierThreshold: number;
  pointsToNextTier: number;
  scores: {
    jdMatch: { score: number; weight: number };
    industryBenchmark: { score: number; weight: number };
    atsCompliance: { score: number; weight: number };
    humanVoice: { score: number; weight: number };
  };
  breakdown: {
    jdMatch: {
      matchedKeywords: KeywordMatch[];
      missingKeywords: KeywordMatch[];
      skillsMatch: number;
      experienceMatch: number;
    };
    industryBenchmark: {
      roleStandards: string[];
      meetingStandards: string[];
      belowStandards: string[];
      competitiveRank: string;
    };
    atsCompliance: ATSCompliance;
    humanVoice: {
      aiProbability: number;
      concerns: string[];
      humanElements: string[];
    };
  };
  gapAnalysis: GapAnalysis;
  priorityFixes: Array<{
    priority: number;
    category: string;
    gapType: string;
    issue: string;
    fix: string;
    impact: string;
  }>;
  quickWins: string[];
  detected: {
    role: string;
    industry: string;
    level: string;
  };
  executionTimeMs: number;
  analyzedAt: string;
}

export interface ClientATSIssue {
  type: 'error' | 'warning' | 'info';
  category: 'format' | 'structure' | 'content';
  issue: string;
  fix: string;
}
