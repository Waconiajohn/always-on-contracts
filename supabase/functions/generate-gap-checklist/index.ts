import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

/**
 * Generate Gap Checklist Edge Function
 *
 * Analyzes a MatchScoreBreakdown and generates a prioritized, actionable
 * checklist of gaps for the user to address. This is a pure algorithmic
 * function - no AI calls needed.
 */

const logger = createLogger('generate-gap-checklist');

// TypeScript interfaces (mirrored from src/lib/types/benchmark.ts for Deno)
type GapType = 'keyword' | 'accomplishment' | 'experience' | 'format';
type GapSeverity = 'high' | 'medium' | 'low';
type GapActionType = 'add' | 'strengthen' | 'reorganize' | 'remove' | 'add-new-bullet';
type ResumeSection = 'summary' | 'experience' | 'skills' | 'education';
type SkillCriticality = 'must-have' | 'nice-to-have' | 'bonus';
type ExperienceLevelMatch = 'below' | 'aligned' | 'above';

interface GapAction {
  id: string;
  gapType: GapType;
  severity: GapSeverity;
  issue: string;
  impact: string;
  action: GapActionType;
  actionDescription: string;
  suggestedKeyword?: string;
  section?: ResumeSection;
  affectedBulletIndices?: number[];
  improvementType?: string;
  suggestedBullet?: string;
  alternatives?: {
    type: string;
    description: string;
  }[];
  uiOrder: number;
}

interface MatchScoreBreakdown {
  overallScore: number;
  categories: {
    keywords: {
      score: number;
      matched: string[];
      missing: string[];
      missingByPriority: {
        keyword: string;
        criticality: SkillCriticality;
      }[];
      summary: string;
    };
    experience: {
      score: number;
      userYearsOfExperience: number;
      benchmarkYearsOfExperience: {
        min: number;
        max: number;
        median: number;
        reasoning: string;
      };
      levelMatch: ExperienceLevelMatch;
      gaps: string[];
      summary: string;
    };
    accomplishments: {
      score: number;
      userHasMetrics: boolean;
      userMetrics: string[];
      benchmarkMetrics: string[];
      missingMetrics: string[];
      accomplishmentTypes: {
        type: string;
        found: boolean;
        evidence?: string;
      }[];
      summary: string;
    };
    atsCompliance: {
      score: number;
      issues: string[];
      warnings: string[];
      sectionsFound: string[];
      sectionsMissing: string[];
      summary: string;
    };
  };
}

interface BenchmarkCandidate {
  roleTitle: string;
  level: string;
  coreSkills: {
    skill: string;
    criticality: SkillCriticality;
    whyMatters: string;
    evidenceOfMastery: string;
  }[];
  expectedAccomplishments: {
    type: string;
    description: string;
    exampleBullet: string;
    metricsToInclude: string[];
  }[];
  typicalMetrics: string[];
}

// Helper to generate unique IDs
function generateId(): string {
  return `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Determine if a keyword is likely an accomplishment type (for section targeting)
function isAccomplishmentKeyword(keyword: string): boolean {
  const accomplishmentIndicators = [
    'led', 'managed', 'delivered', 'shipped', 'launched',
    'mentored', 'coached', 'scaled', 'optimized', 'reduced',
    'increased', 'improved', 'built', 'designed', 'architected'
  ];
  const lowerKeyword = keyword.toLowerCase();
  return accomplishmentIndicators.some(ind => lowerKeyword.includes(ind));
}

// Create keyword gaps from missing skills
function createKeywordGaps(
  scoreBreakdown: MatchScoreBreakdown,
  benchmark: BenchmarkCandidate,
  startOrder: number
): GapAction[] {
  const gaps: GapAction[] = [];
  const missingByPriority = scoreBreakdown.categories.keywords.missingByPriority || [];

  // Process must-have keywords first (high severity)
  const mustHaves = missingByPriority.filter(k => k.criticality === 'must-have');
  const niceToHaves = missingByPriority.filter(k => k.criticality === 'nice-to-have');

  // Limit to top 4 must-haves
  mustHaves.slice(0, 4).forEach((item, index) => {
    const benchmarkSkill = benchmark.coreSkills.find(
      s => s.skill.toLowerCase() === item.keyword.toLowerCase()
    );

    const section: ResumeSection = isAccomplishmentKeyword(item.keyword) ? 'experience' : 'skills';

    gaps.push({
      id: generateId(),
      gapType: 'keyword',
      severity: 'high',
      issue: `Missing "${item.keyword}" (required for this role)`,
      impact: 'Adding this could increase match score by ~3-5%',
      action: 'add',
      actionDescription: benchmarkSkill?.evidenceOfMastery
        ? `Add "${item.keyword}" to your ${section} section. ${benchmarkSkill.evidenceOfMastery}`
        : `Add "${item.keyword}" to your ${section} section with concrete examples of usage.`,
      suggestedKeyword: item.keyword,
      section,
      uiOrder: startOrder + index,
      alternatives: benchmarkSkill ? [{
        type: 'context',
        description: benchmarkSkill.whyMatters
      }] : undefined
    });
  });

  // Add top 2 nice-to-haves as medium severity
  niceToHaves.slice(0, 2).forEach((item, index) => {
    gaps.push({
      id: generateId(),
      gapType: 'keyword',
      severity: 'medium',
      issue: `Missing "${item.keyword}" (nice-to-have skill)`,
      impact: 'Adding this could increase match score by ~1-2%',
      action: 'add',
      actionDescription: `Consider adding "${item.keyword}" to strengthen your application.`,
      suggestedKeyword: item.keyword,
      section: 'skills',
      uiOrder: startOrder + mustHaves.length + index + 10 // Lower priority
    });
  });

  return gaps;
}

// Create accomplishment gaps
function createAccomplishmentGaps(
  scoreBreakdown: MatchScoreBreakdown,
  benchmark: BenchmarkCandidate,
  startOrder: number
): GapAction[] {
  const gaps: GapAction[] = [];
  const accomplishments = scoreBreakdown.categories.accomplishments;

  // Check if accomplishment score is below threshold
  if (accomplishments.score < 75) {
    const severity: GapSeverity = accomplishments.score < 50 ? 'high' : 'medium';

    // Main accomplishment gap
    gaps.push({
      id: generateId(),
      gapType: 'accomplishment',
      severity,
      issue: 'Your accomplishments lack quantified results. Add metrics to show impact.',
      impact: 'Adding metrics to 3-4 bullets could increase score by 15-20%',
      action: 'strengthen',
      actionDescription: 'Review your experience bullets and add specific numbers: revenue generated, users impacted, percentage improvements, team sizes, etc.',
      section: 'experience',
      improvementType: 'add-metrics',
      uiOrder: startOrder,
      alternatives: benchmark.typicalMetrics.slice(0, 3).map(metric => ({
        type: 'example-metric',
        description: metric
      }))
    });

    // Check for missing accomplishment types
    const missingTypes = accomplishments.accomplishmentTypes
      .filter(t => !t.found)
      .slice(0, 2);

    missingTypes.forEach((missingType, index) => {
      const benchmarkAccomplishment = benchmark.expectedAccomplishments.find(
        a => a.type === missingType.type
      );

      if (benchmarkAccomplishment) {
        gaps.push({
          id: generateId(),
          gapType: 'accomplishment',
          severity: 'medium',
          issue: `Missing "${formatAccomplishmentType(missingType.type)}" accomplishment`,
          impact: 'Adding this type of accomplishment demonstrates breadth of impact',
          action: 'add-new-bullet',
          actionDescription: benchmarkAccomplishment.description,
          section: 'experience',
          improvementType: missingType.type,
          suggestedBullet: benchmarkAccomplishment.exampleBullet,
          uiOrder: startOrder + 1 + index
        });
      }
    });
  }

  // Check for missing metrics even if score is okay
  if (accomplishments.missingMetrics && accomplishments.missingMetrics.length > 0) {
    const topMissing = accomplishments.missingMetrics.slice(0, 2);
    topMissing.forEach((metric, index) => {
      gaps.push({
        id: generateId(),
        gapType: 'accomplishment',
        severity: 'low',
        issue: `Consider adding metric: ${metric}`,
        impact: 'This metric type is commonly expected for this role',
        action: 'strengthen',
        actionDescription: `Look for opportunities to quantify your work with ${metric.toLowerCase()}.`,
        section: 'experience',
        improvementType: 'add-specific-metric',
        uiOrder: startOrder + 5 + index + 20 // Lower priority
      });
    });
  }

  return gaps;
}

// Format accomplishment type for display
function formatAccomplishmentType(type: string): string {
  const typeMap: Record<string, string> = {
    'shipped_product': 'Shipped Product',
    'led_team': 'Team Leadership',
    'mentorship': 'Mentorship',
    'optimization': 'Optimization',
    'technical_innovation': 'Technical Innovation',
    'scale': 'Scale/Growth',
    'cost_reduction': 'Cost Reduction',
    'revenue_growth': 'Revenue Growth',
    'process_improvement': 'Process Improvement',
    'cross_functional': 'Cross-Functional Collaboration'
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Create experience gaps
function createExperienceGaps(
  scoreBreakdown: MatchScoreBreakdown,
  startOrder: number
): GapAction[] {
  const gaps: GapAction[] = [];
  const experience = scoreBreakdown.categories.experience;

  if (experience.levelMatch === 'below') {
    gaps.push({
      id: generateId(),
      gapType: 'experience',
      severity: 'medium',
      issue: 'Your experience level is below benchmark median. Emphasize impact and breadth.',
      impact: 'Reframing your work could improve perceived seniority by 10-15 points',
      action: 'reorganize',
      actionDescription: `You have ${experience.userYearsOfExperience} years vs. the expected ${experience.benchmarkYearsOfExperience.median}. Focus on: (1) Highlighting scope and scale of your work, (2) Emphasizing leadership and ownership, (3) Showing progression and growth.`,
      section: 'experience',
      uiOrder: startOrder,
      alternatives: [
        {
          type: 'strategy',
          description: 'Use strong action verbs that show ownership: "Led", "Architected", "Drove"'
        },
        {
          type: 'strategy',
          description: 'Quantify team sizes, budgets, or user counts to show scope'
        }
      ]
    });

    // Add specific experience gaps
    experience.gaps.slice(0, 2).forEach((gap, index) => {
      gaps.push({
        id: generateId(),
        gapType: 'experience',
        severity: 'low',
        issue: gap,
        impact: 'Addressing this could strengthen your overall experience narrative',
        action: 'strengthen',
        actionDescription: 'Consider how to better highlight relevant experience in this area.',
        section: 'experience',
        uiOrder: startOrder + 1 + index + 15
      });
    });
  }

  return gaps;
}

// Create ATS/format gaps
function createFormatGaps(
  scoreBreakdown: MatchScoreBreakdown,
  startOrder: number
): GapAction[] {
  const gaps: GapAction[] = [];
  const ats = scoreBreakdown.categories.atsCompliance;

  // Process issues (more severe)
  ats.issues.slice(0, 3).forEach((issue, index) => {
    const action = determineFormatAction(issue);
    gaps.push({
      id: generateId(),
      gapType: 'format',
      severity: 'medium',
      issue: issue,
      impact: 'Fixing this improves ATS parsing and readability',
      action: action,
      actionDescription: getFormatActionDescription(issue, action),
      uiOrder: startOrder + index
    });
  });

  // Process missing sections
  ats.sectionsMissing.slice(0, 2).forEach((section, index) => {
    gaps.push({
      id: generateId(),
      gapType: 'format',
      severity: section.toLowerCase().includes('summary') ? 'medium' : 'low',
      issue: `Missing section: ${section}`,
      impact: 'Adding standard sections improves ATS compatibility',
      action: 'add',
      actionDescription: `Add a ${section} section to your resume.`,
      section: section.toLowerCase() as ResumeSection,
      uiOrder: startOrder + 3 + index + 10
    });
  });

  // Process warnings (less severe)
  ats.warnings.slice(0, 2).forEach((warning, index) => {
    gaps.push({
      id: generateId(),
      gapType: 'format',
      severity: 'low',
      issue: warning,
      impact: 'Minor improvement for readability',
      action: 'reorganize',
      actionDescription: 'Consider addressing this formatting concern.',
      uiOrder: startOrder + 5 + index + 20
    });
  });

  return gaps;
}

// Determine the appropriate action for a format issue
function determineFormatAction(issue: string): GapActionType {
  const lowerIssue = issue.toLowerCase();
  if (lowerIssue.includes('remove') || lowerIssue.includes('delete') || lowerIssue.includes('graphic')) {
    return 'remove';
  }
  if (lowerIssue.includes('reorder') || lowerIssue.includes('move') || lowerIssue.includes('structure')) {
    return 'reorganize';
  }
  if (lowerIssue.includes('add') || lowerIssue.includes('include') || lowerIssue.includes('missing')) {
    return 'add';
  }
  return 'reorganize';
}

// Get action description for format issues
function getFormatActionDescription(issue: string, action: GapActionType): string {
  switch (action) {
    case 'remove':
      return 'Remove this element to improve ATS compatibility and focus on content.';
    case 'add':
      return 'Add this element to ensure your resume has all expected sections.';
    case 'reorganize':
    default:
      return 'Reorganize this section to improve readability and ATS parsing.';
  }
}

// Sort gaps by severity and uiOrder
function sortGaps(gaps: GapAction[]): GapAction[] {
  const severityOrder: Record<GapSeverity, number> = {
    'high': 0,
    'medium': 1,
    'low': 2
  };

  return gaps.sort((a, b) => {
    // First sort by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by uiOrder
    return a.uiOrder - b.uiOrder;
  });
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  const startTime = Date.now();

  try {
    const { scoreBreakdown, benchmark, resumeText } = await req.json();

    if (!scoreBreakdown || !scoreBreakdown.categories) {
      throw new Error('Valid scoreBreakdown is required');
    }
    if (!benchmark) {
      throw new Error('Benchmark candidate is required');
    }

    logger.info('Generating gap checklist', {
      overallScore: scoreBreakdown.overallScore,
      roleTitle: benchmark.roleTitle
    });

    // Generate all gaps
    const allGaps: GapAction[] = [];
    let orderCounter = 0;

    // 1. Keyword gaps (highest priority)
    const keywordGaps = createKeywordGaps(scoreBreakdown, benchmark, orderCounter);
    allGaps.push(...keywordGaps);
    orderCounter += keywordGaps.length;

    // 2. Accomplishment gaps
    const accomplishmentGaps = createAccomplishmentGaps(scoreBreakdown, benchmark, orderCounter);
    allGaps.push(...accomplishmentGaps);
    orderCounter += accomplishmentGaps.length;

    // 3. Experience gaps
    const experienceGaps = createExperienceGaps(scoreBreakdown, orderCounter);
    allGaps.push(...experienceGaps);
    orderCounter += experienceGaps.length;

    // 4. Format/ATS gaps
    const formatGaps = createFormatGaps(scoreBreakdown, orderCounter);
    allGaps.push(...formatGaps);

    // Sort all gaps
    const sortedGaps = sortGaps(allGaps);

    // Limit to top 8-10 gaps (don't overwhelm user)
    const maxGaps = 10;
    const checklist = sortedGaps.slice(0, maxGaps);

    // Re-assign uiOrder after sorting and limiting
    checklist.forEach((gap, index) => {
      gap.uiOrder = index;
    });

    const highPriorityCount = checklist.filter(g => g.severity === 'high').length;
    const executionTimeMs = Date.now() - startTime;

    logger.info('Gap checklist generated', {
      totalGaps: allGaps.length,
      returnedGaps: checklist.length,
      highPriorityCount,
      executionTimeMs
    });

    return new Response(
      JSON.stringify({
        success: true,
        checklist,
        totalGaps: allGaps.length,
        highPriorityCount,
        metrics: {
          executionTimeMs
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error generating gap checklist', {
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        success: false,
        checklist: null,
        totalGaps: 0,
        highPriorityCount: 0,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: error.message?.includes('required') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
