export type JourneyPhase = 'foundation' | 'job-search' | 'growth';

export interface PhaseConfig {
  id: JourneyPhase;
  title: string;
  subtitle: string;
  requiredResumeCompletion: number;
  featureIds: string[];
}

export const JOURNEY_PHASES: PhaseConfig[] = [
  {
    id: 'foundation',
    title: 'Build Your Career Intelligence',
    subtitle: 'Create a powerful foundation for your job search',
    requiredResumeCompletion: 0,
    featureIds: ['master-resume', 'resume-builder'],
  },
  {
    id: 'job-search',
    title: 'Find & Land Your Next Role',
    subtitle: 'Apply your career intelligence to land opportunities',
    requiredResumeCompletion: 100,
    featureIds: [
      'job-search',
      'applications',
      'interview-prep',
      'linkedin-profile',
      'linkedin-networking',
    ],
  },
  {
    id: 'growth',
    title: 'Accelerate Your Career',
    subtitle: 'Maximize your impact and earnings',
    requiredResumeCompletion: 100,
    featureIds: [
      'salary-negotiation',
      'career-pathing',
      'linkedin-blogging',
      'financial-planning',
      'market-intelligence',
    ],
  },
];

export function getCurrentPhase(resumeCompletion: number): JourneyPhase {
  if (resumeCompletion < 100) return 'foundation';
  // Default to job-search once resume is complete
  return 'job-search';
}

export function getPhaseStatus(
  phase: PhaseConfig,
  currentResumeCompletion: number
): 'active' | 'unlocked' | 'locked' {
  if (currentResumeCompletion < phase.requiredResumeCompletion) return 'locked';
  
  const currentPhaseId = getCurrentPhase(currentResumeCompletion);
  if (currentPhaseId === phase.id) return 'active';
  
  return 'unlocked';
}
