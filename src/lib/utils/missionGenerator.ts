/**
 * Mission Generator
 * Creates prioritized missions based on vault data and ROI calculations
 */

export interface Mission {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  estimatedTime: string;
  action: () => void;
  actionLabel: string;
  roi: number; // Internal score for sorting
}

interface MissionGeneratorInput {
  // Verification needs
  assumedNeedingReview: number;

  // Quality improvements
  weakPhrasesCount: number; // Power phrases without metrics

  // Freshness
  staleItemsCount: number; // Items not updated in 6+ months

  // Blockers
  missingManagementItems?: number;
  missingBudgetOwnership?: boolean;

  // Context
  targetRoles?: string[];
  strengthScore: number;

  // Callbacks
  onVerifyAssumed: () => void;
  onAddMetrics: () => void;
  onRefreshStale: () => void;
  onAddManagement?: () => void;
  onAddBudget?: () => void;
}

/**
 * Calculate ROI (Return on Investment) for a mission
 * ROI = Impact Score / Effort Score
 * Higher ROI = better mission to prioritize
 */
function calculateROI(impactScore: number, effortMinutes: number): number {
  // Normalize effort to 0-1 scale (assuming max 60 minutes)
  const normalizedEffort = Math.min(effortMinutes / 60, 1);

  // Avoid division by zero
  const effort = Math.max(normalizedEffort, 0.1);

  return impactScore / effort;
}

/**
 * Generate prioritized missions from vault data
 */
export function generateMissions(input: MissionGeneratorInput): Mission[] {
  const missions: Mission[] = [];

  // CRITICAL: Missing management for VP/Director roles
  if (
    input.missingManagementItems &&
    input.missingManagementItems > 0 &&
    input.targetRoles?.some((role) =>
      /\b(vp|vice president|director|chief|ceo|cfo|cto)\b/i.test(role)
    )
  ) {
    const impactScore = 50; // Huge impact - unblocks senior roles
    const effortMinutes = 15;

    missions.push({
      id: 'add-management-experience',
      priority: 'critical',
      title: 'Document Management Experience',
      description: `Add ${input.missingManagementItems} management items to qualify for senior leadership roles.`,
      impact: 'Unblocks VP/Director roles',
      estimatedTime: `${effortMinutes} min`,
      action: input.onAddManagement || input.onVerifyAssumed,
      actionLabel: 'Add Now',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // CRITICAL: Missing budget ownership for C-suite
  if (
    input.missingBudgetOwnership &&
    input.targetRoles?.some((role) => /\b(ceo|cfo|cto|coo|chief)\b/i.test(role))
  ) {
    const impactScore = 50;
    const effortMinutes = 10;

    missions.push({
      id: 'add-budget-ownership',
      priority: 'critical',
      title: 'Document Budget/P&L Ownership',
      description: 'Add budget responsibility evidence to qualify for C-suite roles.',
      impact: 'Unblocks executive roles',
      estimatedTime: `${effortMinutes} min`,
      action: input.onAddBudget || input.onVerifyAssumed,
      actionLabel: 'Add Now',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // HIGH: Verify assumed items (tier upgrade)
  if (input.assumedNeedingReview > 0) {
    // Each verified item: Assumed (0.4x) → Silver (0.8x) = +0.4 weight
    const pointsPerItem = 0.67;
    const totalPoints = Math.round(input.assumedNeedingReview * pointsPerItem);
    const effortMinutes = Math.ceil(input.assumedNeedingReview / 2); // ~30 seconds per item
    const impactScore = totalPoints;

    missions.push({
      id: 'verify-assumed',
      priority: input.assumedNeedingReview > 20 ? 'high' : 'medium',
      title: `Verify ${input.assumedNeedingReview} Assumed Items`,
      description: 'Upgrade AI-inferred items from Assumed tier to Silver/Gold tier.',
      impact: `+${totalPoints} pts`,
      estimatedTime: `${effortMinutes} min`,
      action: input.onVerifyAssumed,
      actionLabel: 'Start Verification',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // HIGH: Add metrics to power phrases
  if (input.weakPhrasesCount > 0) {
    const pointsPerItem = 0.75; // Quantification bonus
    const totalPoints = Math.round(input.weakPhrasesCount * pointsPerItem);
    const effortMinutes = input.weakPhrasesCount * 2; // ~2 min per phrase
    const impactScore = totalPoints;

    missions.push({
      id: 'add-metrics',
      priority: 'high',
      title: `Add Metrics to ${input.weakPhrasesCount} Power Phrases`,
      description: 'Quantify impact with numbers (%, $, time saved) for stronger resume bullets.',
      impact: `+${totalPoints} pts`,
      estimatedTime: `${effortMinutes} min`,
      action: input.onAddMetrics,
      actionLabel: 'Add Metrics',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // MEDIUM: Refresh stale items
  if (input.staleItemsCount > 0) {
    const pointsPerItem = 0.27; // Freshness: 0.7x → 1.0x = +0.3 weight
    const totalPoints = Math.round(input.staleItemsCount * pointsPerItem);
    const effortMinutes = 5; // Quick batch update
    const impactScore = totalPoints;

    missions.push({
      id: 'refresh-stale',
      priority: input.staleItemsCount > 50 ? 'medium' : 'low',
      title: `Refresh ${input.staleItemsCount} Stale Items`,
      description: 'Update items older than 6 months to maintain vault freshness.',
      impact: `+${totalPoints} pts`,
      estimatedTime: `${effortMinutes} min`,
      action: input.onRefreshStale,
      actionLabel: 'Refresh Now',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // LOW: Improve vault score to Elite (if close)
  if (input.strengthScore >= 75 && input.strengthScore < 90) {
    const pointsNeeded = 90 - input.strengthScore;
    const effortMinutes = pointsNeeded * 2; // Rough estimate
    const impactScore = pointsNeeded * 0.5; // Lower priority, but good for polish

    missions.push({
      id: 'reach-elite',
      priority: 'low',
      title: 'Reach Elite Status (90+)',
      description: `You're ${pointsNeeded} points away from Elite tier. Complete missions above to reach it.`,
      impact: `+${pointsNeeded} pts`,
      estimatedTime: `${effortMinutes} min`,
      action: input.onVerifyAssumed, // Generic action
      actionLabel: 'View Plan',
      roi: calculateROI(impactScore, effortMinutes),
    });
  }

  // Sort by ROI (highest first), then by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return missions.sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by ROI
    return b.roi - a.roi;
  });
}

/**
 * Calculate market percentile from vault score
 * Based on normal distribution assumption
 * Returns the percentile number (e.g., 84 for top 16%)
 */
export function calculateMarketRank(score: number): number {
  // Assuming mean = 68, std = 15
  const mean = 68;
  const std = 15;
  const zScore = (score - mean) / std;

  // Rough percentile approximation
  let percentile: number;

  if (zScore >= 2) percentile = 98; // Top 2%
  else if (zScore >= 1.5) percentile = 93; // Top 7%
  else if (zScore >= 1) percentile = 84; // Top 16%
  else if (zScore >= 0.5) percentile = 69; // Top 31%
  else if (zScore >= 0) percentile = 50; // Top 50%
  else if (zScore >= -0.5) percentile = 31;
  else if (zScore >= -1) percentile = 16;
  else percentile = 5;

  return percentile;
}
