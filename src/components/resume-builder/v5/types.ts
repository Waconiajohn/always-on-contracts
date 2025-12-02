/**
 * Elite Resume Builder V5 - Type Definitions
 */

export type ContentConfidence = 'exact' | 'enhanced' | 'invented';

export interface ContentSource {
  type: 'resume' | 'vault' | 'ai_generated';
  originalText?: string;
  vaultItemId?: string;
  milestoneId?: string;
}

export interface ResumeBullet {
  id: string;
  text: string;
  confidence: ContentConfidence;
  source: ContentSource;
  gapAddressed?: string;
  requirementId?: string;
  atsKeywords?: string[];
  isEdited?: boolean;
  userEditedText?: string;
}

export interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'education' | 'certifications';
  title: string;
  bullets: ResumeBullet[];
  paragraph?: string;
  roleInfo?: {
    company: string;
    title: string;
    dates: string;
  };
}

export interface EliteResumeData {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  sections: ResumeSection[];
  overallScore: number;
  tier: ScoreTier;
}

export interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

export interface MatchAnalysis {
  overallMatch: number;
  coveredRequirements: string[];
  uncoveredRequirements: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}
