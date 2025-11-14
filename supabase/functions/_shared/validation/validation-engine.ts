/**
 * Validation Engine
 * Multi-layered validation for extraction quality assurance
 */

export interface ValidationIssue {
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestedFix?: string;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  confidence: number;
  issues: ValidationIssue[];
  recommendations: string[];
  requiresUserReview: boolean;
}

export interface ExtractedData {
  powerPhrases?: Array<{
    phrase: string;
    category?: string;
    confidence_score?: number;
    impact_metrics?: any;
  }>;
  skills?: Array<{
    stated_skill: string;
    confidence_score?: number;
  }>;
  competencies?: Array<{
    competency_area: string;
    inferred_capability: string;
  }>;
  softSkills?: Array<{
    soft_skill: string;
    evidence?: string;
  }>;
}

export interface ExtractionContext {
  resumeText: string;
  framework?: any;
  roleInfo?: {
    primaryRole: string;
    industry?: string;
    seniority?: string;
  };
  resumeStructure?: {
    sections: string[];
    wordCount: number;
  };
}

export interface ValidationRule {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  validate: (data: ExtractedData, context: ExtractionContext) => Promise<ValidationIssue[]>;
}

/**
 * Calculate text coverage (what % of resume was used in extraction)
 */
function calculateTextCoverage(resumeText: string, extractedText: string): number {
  if (!resumeText || !extractedText) return 0;

  const resumeWords = new Set(
    resumeText.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const extractedWords = extractedText.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const matchedWords = extractedWords.filter(w => resumeWords.has(w));
  return resumeWords.size > 0 ? (matchedWords.length / resumeWords.size) * 100 : 0;
}

/**
 * Calculate semantic similarity between two strings (simplified)
 */
function calculateSemanticSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * VALIDATION RULE 1: Completeness Check
 */
export const completenessValidation: ValidationRule = {
  name: 'completeness_check',
  severity: 'critical',
  validate: async (data: ExtractedData, context: ExtractionContext): Promise<ValidationIssue[]> => {
    const issues: ValidationIssue[] = [];

    // Check minimum item counts
    const powerPhrasesCount = data.powerPhrases?.length || 0;
    if (powerPhrasesCount < 5) {
      issues.push({
        rule: 'completeness_check',
        severity: 'critical',
        message: `Extracted only ${powerPhrasesCount} power phrases, expected at least 5 for resume of this length`,
        suggestedFix: 'retry_with_enhanced_prompt',
        metadata: { actualCount: powerPhrasesCount, expectedMin: 5 }
      });
    }

    const skillsCount = data.skills?.length || 0;
    if (skillsCount < 3) {
      issues.push({
        rule: 'completeness_check',
        severity: 'warning',
        message: `Extracted only ${skillsCount} skills, expected at least 3`,
        suggestedFix: 'targeted_skill_extraction',
        metadata: { actualCount: skillsCount, expectedMin: 3 }
      });
    }

    // Check resume coverage
    if (data.powerPhrases && data.powerPhrases.length > 0) {
      const extractedText = data.powerPhrases.map(p => p.phrase).join(' ');
      const coveragePercent = calculateTextCoverage(context.resumeText, extractedText);

      if (coveragePercent < 30) {
        issues.push({
          rule: 'completeness_check',
          severity: 'warning',
          message: `Only ${coveragePercent.toFixed(1)}% of resume text was used in extraction`,
          suggestedFix: 'extract_unused_sections',
          metadata: { coverage: coveragePercent }
        });
      }
    }

    // Check for expected fields based on framework
    if (context.framework) {
      const managementBenchmarks = context.framework.managementBenchmarks || [];
      if (managementBenchmarks.length > 0) {
        const hasManagementPhrases = (data.powerPhrases || []).some(p =>
          /manage|supervis|led|team|direct|oversee/i.test(p.phrase)
        );

        if (!hasManagementPhrases) {
          issues.push({
            rule: 'completeness_check',
            severity: 'critical',
            message: `Role "${context.framework.role}" requires management evidence, but none was found`,
            suggestedFix: 'targeted_management_extraction',
            metadata: { role: context.framework.role }
          });
        }
      }
    }

    return issues;
  }
};

/**
 * VALIDATION RULE 2: Consistency Check
 */
export const consistencyValidation: ValidationRule = {
  name: 'consistency_check',
  severity: 'critical',
  validate: async (data: ExtractedData, context: ExtractionContext): Promise<ValidationIssue[]> => {
    const issues: ValidationIssue[] = [];

    // Check title-achievement alignment
    if (context.roleInfo?.primaryRole) {
      const seniorTitles = ['VP', 'Vice President', 'Director', 'Senior Manager', 'Head of', 'Chief', 'Lead'];
      const hasSeniorTitle = seniorTitles.some(t =>
        context.roleInfo!.primaryRole.includes(t)
      );

      const hasManagementEvidence = (data.powerPhrases || []).some(p =>
        /manage|supervise|lead|direct|guide|oversee/i.test(p.phrase)
      );

      if (hasSeniorTitle && !hasManagementEvidence) {
        issues.push({
          rule: 'consistency_check',
          severity: 'critical',
          message: `Title "${context.roleInfo.primaryRole}" suggests management role, but no management evidence found`,
          suggestedFix: 'targeted_management_extraction',
          metadata: { title: context.roleInfo.primaryRole }
        });
      }
    }

    // Check skill-evidence alignment
    if (data.skills && data.powerPhrases) {
      for (const skill of data.skills) {
        const evidenceFound = data.powerPhrases.some(p =>
          p.phrase.toLowerCase().includes(skill.stated_skill.toLowerCase())
        );

        if (!evidenceFound && (skill.confidence_score || 0) > 0.8) {
          issues.push({
            rule: 'consistency_check',
            severity: 'warning',
            message: `Skill "${skill.stated_skill}" has high confidence but no supporting evidence in achievements`,
            suggestedFix: 'link_skill_to_evidence',
            metadata: { skill: skill.stated_skill }
          });
        }
      }
    }

    return issues;
  }
};

/**
 * VALIDATION RULE 3: Plausibility Check
 */
export const plausibilityValidation: ValidationRule = {
  name: 'plausibility_check',
  severity: 'warning',
  validate: async (data: ExtractedData, context: ExtractionContext): Promise<ValidationIssue[]> => {
    const issues: ValidationIssue[] = [];

    // Check for impossible values in power phrases
    if (data.powerPhrases) {
      for (const phrase of data.powerPhrases) {
        const metrics = phrase.impact_metrics;

        if (metrics) {
          // Check team size
          if (metrics.teamSize && metrics.teamSize > 1000) {
            issues.push({
              rule: 'plausibility_check',
              severity: 'warning',
              message: `Team size of ${metrics.teamSize} seems unusually high`,
              suggestedFix: 'flag_for_user_verification',
              metadata: { phrase: phrase.phrase, teamSize: metrics.teamSize }
            });
          }

          // Check percentage improvements
          if (metrics.percentage && metrics.percentage > 100) {
            issues.push({
              rule: 'plausibility_check',
              severity: 'critical',
              message: `Percentage improvement of ${metrics.percentage}% is impossible (>100%)`,
              suggestedFix: 'reparse_achievement',
              metadata: { phrase: phrase.phrase, percentage: metrics.percentage }
            });
          }

          // Check budget amounts
          if (metrics.budget && metrics.budget > 10000000000) {
            // $10B
            issues.push({
              rule: 'plausibility_check',
              severity: 'warning',
              message: `Budget of $${(metrics.budget / 1000000000).toFixed(1)}B seems unusually high`,
              suggestedFix: 'flag_for_user_verification',
              metadata: { phrase: phrase.phrase, budget: metrics.budget }
            });
          }
        }
      }
    }

    // Compare against framework benchmarks
    if (context.framework && data.powerPhrases) {
      const teamSizeBenchmark = context.framework.managementBenchmarks?.find(
        (b: any) => b.aspect === 'Team Size'
      );

      if (teamSizeBenchmark) {
        const extractedTeamSizes = data.powerPhrases
          .filter(p => p.impact_metrics?.teamSize)
          .map(p => p.impact_metrics.teamSize);

        if (extractedTeamSizes.length > 0) {
          const maxTeamSize = Math.max(...extractedTeamSizes);

          if (maxTeamSize > teamSizeBenchmark.maxValue * 2) {
            issues.push({
              rule: 'plausibility_check',
              severity: 'warning',
              message: `Claimed team size of ${maxTeamSize} is 2x higher than typical for ${context.framework.role}`,
              suggestedFix: 'flag_for_user_verification',
              metadata: {
                claimedSize: maxTeamSize,
                typicalMax: teamSizeBenchmark.maxValue,
                role: context.framework.role
              }
            });
          }
        }
      }
    }

    return issues;
  }
};

/**
 * VALIDATION RULE 4: Redundancy Detection
 */
export const redundancyValidation: ValidationRule = {
  name: 'redundancy_check',
  severity: 'info',
  validate: async (data: ExtractedData, context: ExtractionContext): Promise<ValidationIssue[]> => {
    const issues: ValidationIssue[] = [];

    // Check for duplicate power phrases
    if (data.powerPhrases && data.powerPhrases.length > 1) {
      for (let i = 0; i < data.powerPhrases.length; i++) {
        for (let j = i + 1; j < data.powerPhrases.length; j++) {
          const similarity = calculateSemanticSimilarity(
            data.powerPhrases[i].phrase,
            data.powerPhrases[j].phrase
          );

          if (similarity > 0.85) {
            issues.push({
              rule: 'redundancy_check',
              severity: 'info',
              message: `Phrases appear to be duplicates (${(similarity * 100).toFixed(0)}% similar)`,
              suggestedFix: 'consolidate_duplicates',
              metadata: {
                phrase1: data.powerPhrases[i].phrase,
                phrase2: data.powerPhrases[j].phrase,
                similarity
              }
            });
          }
        }
      }
    }

    return issues;
  }
};

/**
 * All validation rules
 */
export const ALL_VALIDATION_RULES: ValidationRule[] = [
  completenessValidation,
  consistencyValidation,
  plausibilityValidation,
  redundancyValidation,
];

/**
 * Run all validation rules
 */
export async function runValidation(
  data: ExtractedData,
  context: ExtractionContext,
  rules: ValidationRule[] = ALL_VALIDATION_RULES
): Promise<ValidationResult> {
  const allIssues: ValidationIssue[] = [];

  for (const rule of rules) {
    try {
      const issues = await rule.validate(data, context);
      allIssues.push(...issues);
    } catch (error) {
      console.error(`Validation rule ${rule.name} failed:`, error);
      allIssues.push({
        rule: rule.name,
        severity: 'warning',
        message: `Validation rule failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestedFix: 'skip_validation'
      });
    }
  }

  const criticalIssues = allIssues.filter(i => i.severity === 'critical');
  const passed = criticalIssues.length === 0;
  const confidence = calculateConfidenceFromIssues(allIssues);
  const recommendations = generateRecommendations(allIssues);
  const requiresUserReview = confidence < 75 || criticalIssues.length > 0;

  return {
    passed,
    confidence,
    issues: allIssues,
    recommendations,
    requiresUserReview
  };
}

/**
 * Calculate overall confidence from validation issues
 */
function calculateConfidenceFromIssues(issues: ValidationIssue[]): number {
  let baseConfidence = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        baseConfidence -= 15;
        break;
      case 'warning':
        baseConfidence -= 5;
        break;
      case 'info':
        baseConfidence -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, baseConfidence));
}

/**
 * Generate recommendations from validation issues
 */
function generateRecommendations(issues: ValidationIssue[]): string[] {
  const recommendations: string[] = [];
  const fixesNeeded = new Set<string>();

  for (const issue of issues) {
    if (issue.suggestedFix) {
      fixesNeeded.add(issue.suggestedFix);
    }
  }

  if (fixesNeeded.has('retry_with_enhanced_prompt')) {
    recommendations.push('Re-extract with more specific prompts for missing areas');
  }

  if (fixesNeeded.has('targeted_management_extraction')) {
    recommendations.push('Perform targeted extraction for management/leadership evidence');
  }

  if (fixesNeeded.has('flag_for_user_verification')) {
    recommendations.push('Review claims that seem unusually high against resume');
  }

  if (fixesNeeded.has('consolidate_duplicates')) {
    recommendations.push('Merge duplicate or highly similar achievements');
  }

  return recommendations;
}
