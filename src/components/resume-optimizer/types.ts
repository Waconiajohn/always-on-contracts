// Resume Optimizer V9 - Types
// 6-Step Collaborative Resume Optimization System

export type OptimizerStep = 
  | 'career-profile'      // Step 1: Review career trajectory
  | 'gap-analysis'        // Step 2: Categorized requirements
  | 'answer-assistant'    // Step 3: AI-powered language help  
  | 'customization'       // Step 4: Intensity/tone controls
  | 'strategic-versions'  // Step 5: Multiple resume versions
  | 'hiring-manager';     // Step 6: Hiring manager review

export const STEP_CONFIG: Record<OptimizerStep, {
  title: string;
  subtitle: string;
  icon: string;
  estimatedTime: string;
}> = {
  'career-profile': {
    title: 'Career Profile Review',
    subtitle: 'Confirm your career trajectory and expertise',
    icon: '👤',
    estimatedTime: '2 min'
  },
  'gap-analysis': {
    title: 'Intelligent Gap Analysis',
    subtitle: 'See how you match each requirement',
    icon: '🎯',
    estimatedTime: '1 min'
  },
  'answer-assistant': {
    title: 'AI Answer Assistant',
    subtitle: 'Get help crafting strategic language',
    icon: '✨',
    estimatedTime: '5 min'
  },
  'customization': {
    title: 'Customize Your Approach',
    subtitle: 'Set intensity and tone preferences',
    icon: '⚙️',
    estimatedTime: '1 min'
  },
  'strategic-versions': {
    title: 'Strategic Versions',
    subtitle: 'Compare different positioning strategies',
    icon: '📄',
    estimatedTime: '3 min'
  },
  'hiring-manager': {
    title: 'Hiring Manager Review',
    subtitle: 'Get feedback from an HM perspective',
    icon: '👔',
    estimatedTime: '2 min'
  }
};

// Confidence levels for suggestions
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
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: '🥇'
  },
  'high': {
    label: 'High',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: '🥈'
  },
  'moderate': {
    label: 'Moderate',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
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

// Career Profile (Step 1)
export interface CareerProfile {
  yearsOfExperience: number;
  seniority: string;
  industries: string[];
  leadershipRoles: string[];
  technicalExpertise: string[];
  softSkills: string[];
  careerTrajectory: string;
  uniqueValueProposition: string;
  certifications?: string[];
  education?: string[];
}

// Requirement Categories (Step 2)
export type RequirementCategory = 'highly-qualified' | 'partially-qualified' | 'experience-gap';

export interface AnalyzedRequirement {
  id: string;
  requirement: string;
  category: RequirementCategory;
  
  // Why this matters
  explanation: string;
  
  // What's in your background
  yourExperience?: string;
  
  // What's missing (for partial/gaps)
  whatsGap?: string;
  
  // Suggested language
  suggestedLanguage: string;
  
  // Alternative positioning options
  alternatives: AlternativeLanguage[];
  
  // Confidence level
  confidence: ConfidenceLevel;
  
  // Evidence from resume
  resumeEvidence: string[];
  
  // User selection state
  selectedLanguage?: string;
  userEdited?: boolean;
  isAccepted?: boolean;
}

export interface AlternativeLanguage {
  id: string;
  tone: 'formal' | 'technical' | 'conversational' | 'executive';
  text: string;
  rationale: string;
}

// Gap Analysis Result (Step 2)
export interface GapAnalysisResult {
  highlyQualified: AnalyzedRequirement[];
  partiallyQualified: AnalyzedRequirement[];
  experienceGaps: AnalyzedRequirement[];
  overallFitScore: number;
  summary: string;
}

// Customization Options (Step 4)
export type IntensityLevel = 'conservative' | 'moderate' | 'aggressive';
export type TonePreference = 'formal' | 'conversational' | 'technical' | 'executive';

export interface CustomizationSettings {
  intensity: IntensityLevel;
  tone: TonePreference;
}

// Resume Version (Step 5)
export interface ResumeVersion {
  id: string;
  name: string;
  emphasis: string;
  description: string;
  sections: ResumeSection[];
  score?: number;
}

export interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'education' | 'certifications' | 'achievements';
  title: string;
  content: string[];
  isEdited?: boolean;
}

// Hiring Manager Review (Step 6)
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

// Version History Entry
export interface VersionHistoryEntry {
  id: string;
  timestamp: number;
  stepCompleted: OptimizerStep;
  versionSnapshot: ResumeVersion;
  changeDescription: string;
}

// Main State
export interface OptimizerState {
  // Input data
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  
  // Step 1
  careerProfile: CareerProfile | null;
  isProfileConfirmed: boolean;
  
  // Step 2
  gapAnalysis: GapAnalysisResult | null;
  
  // Step 3 - tracked per requirement
  selectedAnswers: Record<string, string>;
  
  // Step 4
  customization: CustomizationSettings;
  
  // Step 5
  resumeVersions: ResumeVersion[];
  selectedVersionId?: string;
  selectedTemplate?: { id: string; name: string };
  
  // Step 6
  hiringManagerReview: HiringManagerReview | null;
  
  // Version History
  versionHistory: VersionHistoryEntry[];
  
  // UI State
  currentStep: OptimizerStep;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
}

export const createInitialState = (): OptimizerState => ({
  resumeText: '',
  jobDescription: '',
  jobTitle: undefined,
  company: undefined,
  careerProfile: null,
  isProfileConfirmed: false,
  gapAnalysis: null,
  selectedAnswers: {},
  customization: {
    intensity: 'moderate',
    tone: 'formal'
  },
  resumeVersions: [],
  selectedVersionId: undefined,
  hiringManagerReview: null,
  versionHistory: [],
  currentStep: 'career-profile',
  isProcessing: false,
  processingMessage: '',
  error: null
});
