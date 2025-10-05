export interface LinkedInPost {
  title: string;
  content: string;
  hashtags: string[];
  postType: string;
  hookStrength: string;
  estimatedEngagement: string;
  improvementTips: string[];
}

export interface ContentAnalysis {
  overallScore: number;
  hookStrength: {
    score: number;
    feedback: string;
  };
  valueDensity: {
    score: number;
    feedback: string;
  };
  readability: {
    score: number;
    feedback: string;
  };
  ctaEffectiveness: {
    score: number;
    feedback: string;
  };
  strengths: string[];
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impact: string;
  }>;
  viralPotential: 'low' | 'medium' | 'high' | 'exceptional';
}

export interface CareerTrend {
  title: string;
  category: string;
  description: string;
  relevanceScore: number;
  confidenceScore: number;
  dataQuality: 'high' | 'medium' | 'low' | 'speculative';
  lastVerified: string;
  contradictorySignals?: string;
}

export interface FinancialPlanAnalysis {
  retirementReadiness: {
    score: number;
    projectedCorpus: number;
    requiredCorpus: number;
    gap: number;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium';
    action: string;
    impact: string;
  }>;
  taxImpact: {
    currentBracket: string;
    optimizationOpportunities: string[];
  };
}
