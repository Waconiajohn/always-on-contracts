export type JourneyPhase = 'foundation' | 'job-search' | 'growth';

export interface PhaseConfig {
  id: JourneyPhase;
  title: string;
  subtitle: string;
  requiredVaultCompletion: number;
  featureIds: string[];
}

export const JOURNEY_PHASES: PhaseConfig[] = [
  {
    id: 'foundation',
    title: 'Build Your Career Intelligence',
    subtitle: 'Create a powerful foundation for your job search',
    requiredVaultCompletion: 0,
    featureIds: ['career-vault', 'resume-builder'],
  },
  {
    id: 'job-search',
    title: 'Find & Land Your Next Role',
    subtitle: 'Apply your career intelligence to land opportunities',
    requiredVaultCompletion: 100,
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
    requiredVaultCompletion: 100,
    featureIds: [
      'salary-negotiation',
      'career-pathing',
      'linkedin-blogging',
      'financial-planning',
      'market-intelligence',
    ],
  },
];

export function getCurrentPhase(vaultCompletion: number): JourneyPhase {
  if (vaultCompletion < 100) return 'foundation';
  // Default to job-search once vault is complete
  return 'job-search';
}

export function getPhaseStatus(
  phase: PhaseConfig,
  currentVaultCompletion: number
): 'active' | 'unlocked' | 'locked' {
  if (currentVaultCompletion < phase.requiredVaultCompletion) return 'locked';
  
  const currentPhaseId = getCurrentPhase(currentVaultCompletion);
  if (currentPhaseId === phase.id) return 'active';
  
  return 'unlocked';
}
