/**
 * MustInterviewBuilder V2 Types
 * 
 * Complete type system for the redesigned, best-in-class resume builder.
 * Every bullet shows before/after, confidence, sources, and interview prep.
 */

// ============================================================================
// GAP & CONFIDENCE TYPES
// ============================================================================

export type GapType = 
  | 'missing_skill_or_tool'
  | 'weak_achievement_story'
  | 'missing_metrics_or_scope'
  | 'missing_domain_experience'
  | 'unclear_level_or_seniority'
  | 'positioning_issue';

export type GapSeverity = 'critical' | 'important' | 'nice-to-have';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type BulletStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

// ============================================================================
// JOB BLUEPRINT (from AI analysis)
// ============================================================================

export interface HiringManagerPriority {
  priority: string;
  whyItMatters: string;
  evidenceNeeded: string;
}

export interface ResumeStructureSection {
  section: string;
  recommendedBullets: number;
  focus: string;
  keywordsToInclude: string[];
}

export interface JobBlueprint {
  inferredIndustry: string;
  inferredRoleFamily: string;
  inferredSeniority: 'entry' | 'mid' | 'senior' | 'executive' | 'c-level';
  roleSummary: string;
  competencies: Array<{
    skill: string;
    category: 'required' | 'preferred' | 'nice-to-have';
    type: 'technical' | 'domain' | 'leadership' | 'soft';
  }>;
  mustHaves: Array<{
    requirement: string;
    category: 'tool' | 'certification' | 'experience' | 'knowledge';
  }>;
  hiringManagerPriorities: HiringManagerPriority[];
  dealBreakers: string[];
  resumeStructure: ResumeStructureSection[];
  atsKeywords: {
    critical: string[];
    important: string[];
    bonus: string[];
  };
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

export interface GapAnalysis {
  id: string;
  title: string;
  gapType: GapType;
  severity: GapSeverity;
  relatedCompetencies: string[];
  relatedResumeSections: string[];
  currentStateSnapshot: string;
  targetState: string;
  vaultEvidence?: string;
  whyItMatters: string;
}

// ============================================================================
// BULLET SUGGESTIONS
// ============================================================================

export interface BulletSuggestion {
  id: string;
  /** The user's original text (if exists) */
  originalText?: string;
  /** AI-generated enhanced version */
  suggestedText: string;
  /** Which gap this addresses (if any) */
  gapId?: string;
  /** AI confidence in this suggestion */
  confidence: ConfidenceLevel;
  /** Explanation of why this helps the candidate */
  whyThisHelps: string;
  /** Where this came from (e.g., "Based on: Director role at Acme Corp") */
  sourceBasis?: string;
  /** Interview questions this bullet might invite */
  interviewQuestions: string[];
  /** Job requirements/competencies this bullet supports */
  supports: string[];
  /** Current status of this bullet */
  status: BulletStatus;
  /** User's edited version (if they chose to edit) */
  editedText?: string;
  /** Order in the section */
  order: number;
}

// ============================================================================
// ROLE DATA (for Experience section)
// ============================================================================

export interface RoleData {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  suggestions?: BulletSuggestion[];
  relevantCompetencies?: string[];
  /** Why this role matters for the target job */
  relevanceToJob: string[];
  /** All bullet suggestions for this role */
  bullets: BulletSuggestion[];
  /** Recommended number of bullets for this role */
  recommendedBulletCount: { min: number; max: number };
  /** Summary of bullet progress */
  progress: {
    accepted: number;
    pending: number;
    rejected: number;
    edited: number;
  };
}

// ============================================================================
// SECTION DATA
// ============================================================================

export interface SectionProgress {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  edited: number;
}

export interface HighlightsSection {
  bullets: BulletSuggestion[];
  progress: SectionProgress;
  sectionGuidance: string;
  gapsAddressed: string[];
}

export interface SummarySection {
  originalText: string;
  suggestedText: string;
  status: BulletStatus;
  editedText?: string;
  whyThisHelps: string;
  keywordsIncluded: string[];
}

export type SuggestedSkill = {
  skill: string;
  reason: string;
  source: 'ats_critical' | 'ats_important' | 'competency' | 'must_have' | 'nice_to_have';
  status: 'pending' | 'accepted' | 'rejected';
};

export interface SkillsData {
  /** Skills already in the resume/vault */
  existing: string[];
  /** AI-suggested skills from job blueprint */
  suggested: SuggestedSkill[];
  /** Final list of accepted skills */
  accepted: string[];
}

// ============================================================================
// SCORES
// ============================================================================

export interface ScoreData {
  initial: number;
  current: number;
  projected: number;
  breakdown: {
    atsMatch: number;
    requirementsCoverage: number;
    competitiveStrength: number;
  };
}

// ============================================================================
// BUILDER STATE
// ============================================================================

export type BuilderStep = 1 | 2 | 3 | 4 | 5;

export interface BuilderState {
  /** Current step in the flow */
  currentStep: BuilderStep;
  /** Job blueprint from AI analysis */
  jobBlueprint: JobBlueprint | null;
  /** Original resume text */
  originalResume: string;
  /** Target job description */
  jobDescription: string;
  /** Target job title */
  jobTitle: string;
  /** Target company */
  companyName: string;
  /** Gap analysis results */
  gaps: GapAnalysis[];
  /** Scores (initial, current, projected) */
  scores: ScoreData;
  /** Professional Summary section */
  summary: SummarySection | null;
  /** Key Highlights section */
  highlights: HighlightsSection | null;
  /** Experience section (by role) */
  roles: RoleData[];
  /** Skills section */
  skills: SkillsData | null;
  /** Is the builder currently loading data? */
  isLoading: boolean;
  /** Any error message */
  error: string | null;
  /** When was this state last saved? */
  lastSaved: Date | null;
}

// ============================================================================
// STEP COMPONENT PROPS
// ============================================================================

export interface OverviewStepProps {
  currentScore: number;
  projectedScore: number;
  scoreBreakdown: {
    atsMatch: number;
    requirementsCoverage: number;
    competitiveStrength: number;
  };
  gaps: GapAnalysis[];
  jobBlueprint: JobBlueprint;
  estimatedTime: string;
  onStartBuilding: () => void;
}

export interface HighlightsStepProps {
  highlights: {
    bullets: BulletSuggestion[];
  };
  onBulletAction: (bulletId: string, action: 'accept' | 'reject' | 'edit', editedText?: string) => void;
  onApproveAll: () => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ExperienceStepProps {
  roles: RoleData[];
  jobBlueprint: JobBlueprint;
  onBulletAction: (roleId: string, bulletId: string, action: 'accept' | 'reject' | 'edit' | 'useOriginal', editedText?: string) => void;
  onApproveAllForRole: (roleId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface SkillsStepProps {
  skills: SkillsData;
  jobBlueprint: JobBlueprint;
  onSkillAction: (skill: string, action: 'accept' | 'reject') => void;
  onAddCustomSkill: (skill: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ReviewStepProps {
  state: BuilderState;
  onExport: (format: 'pdf' | 'docx' | 'clipboard') => void;
  onRescore: () => void;
  onBack: () => void;
  onSave: () => void;
}

// ============================================================================
// CARD COMPONENT PROPS
// ============================================================================

export interface BulletSuggestionRowProps {
  suggestion: BulletSuggestion;
  onAccept: () => void;
  onEdit: (text: string) => void;
  onSkip: () => void;
  showInterviewQuestions?: boolean;
}

export interface BulletComparisonCardProps {
  suggestion: BulletSuggestion;
  onUseAI: () => void;
  onKeepOriginal: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  showInterviewQuestions?: boolean;
}

export interface RoleEditorCardProps {
  role: RoleData;
  jobBlueprint: JobBlueprint;
  onBulletAction: (bulletId: string, action: 'accept' | 'reject' | 'edit' | 'useOriginal', editedText?: string) => void;
  onApproveAll: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export interface GapCardProps {
  gap: GapAnalysis;
  isAddressed: boolean;
  onViewSuggestions?: () => void;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface ExportData {
  summary: string;
  highlights: string[];
  experience: Array<{
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }>;
  skills: string[];
}

export type GapTypeInfo = {
  icon: string;
  label: string;
  description: string;
  color: string;
};

export const GAP_TYPE_INFO: Record<GapType, GapTypeInfo> = {
  'missing_skill_or_tool': {
    icon: '🔧',
    label: 'Missing Skill/Tool',
    description: 'A required skill or tool is not mentioned in your résumé',
    color: 'text-orange-500'
  },
  'weak_achievement_story': {
    icon: '📖',
    label: 'Weak Achievement',
    description: 'You have the experience but need a more compelling narrative',
    color: 'text-yellow-500'
  },
  'missing_metrics_or_scope': {
    icon: '📊',
    label: 'Missing Metrics',
    description: 'Achievement lacks quantification or scope indicators',
    color: 'text-blue-500'
  },
  'missing_domain_experience': {
    icon: '🏢',
    label: 'Domain Gap',
    description: 'Industry or domain-specific knowledge not demonstrated',
    color: 'text-purple-500'
  },
  'unclear_level_or_seniority': {
    icon: '📈',
    label: 'Level Unclear',
    description: 'Résumé doesn\'t convey the right seniority for this role',
    color: 'text-indigo-500'
  },
  'positioning_issue': {
    icon: '🎯',
    label: 'Positioning Issue',
    description: 'You may appear over/under-qualified based on emphasis',
    color: 'text-red-500'
  }
};

export const SEVERITY_COLORS: Record<GapSeverity, string> = {
  'critical': 'bg-red-100 text-red-700 border-red-200',
  'important': 'bg-amber-100 text-amber-700 border-amber-200',
  'nice-to-have': 'bg-blue-100 text-blue-700 border-blue-200'
};

export const CONFIDENCE_INFO: Record<ConfidenceLevel, { color: string; label: string; bgColor: string }> = {
  'high': { color: 'text-green-600', label: 'High Confidence', bgColor: 'bg-green-100' },
  'medium': { color: 'text-amber-600', label: 'Verify This', bgColor: 'bg-amber-100' },
  'low': { color: 'text-red-600', label: 'Needs Review', bgColor: 'bg-red-100' }
};
