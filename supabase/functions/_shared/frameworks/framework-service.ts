/**
 * Framework Service
 * Loading, matching, and applying competency frameworks to extraction
 */

import {
  CompetencyFramework,
  COMPETENCY_FRAMEWORKS
} from '../competency-frameworks.ts';

export interface FrameworkContext {
  framework: CompetencyFramework | null;
  matchQuality: 'exact' | 'partial' | 'default' | 'generated';
  matchScore: number; // 0-100
  adaptations: string[];
  confidence: number;
}

export interface FrameworkMatchCriteria {
  role: string;
  industry?: string;
  jobDescription?: string;
}

/**
 * Calculate similarity between two strings
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Word overlap similarity
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Find best matching competency framework
 */
export function findCompetencyFramework(
  role: string,
  industry?: string
): CompetencyFramework | null {
  if (!role) return null;

  // Try exact match first
  for (const framework of COMPETENCY_FRAMEWORKS) {
    if (framework.role.toLowerCase() === role.toLowerCase()) {
      if (!industry || framework.industry.toLowerCase() === industry.toLowerCase()) {
        return framework;
      }
    }

    // Check aliases
    for (const alias of framework.aliases) {
      if (alias.toLowerCase() === role.toLowerCase()) {
        if (!industry || framework.industry.toLowerCase() === industry.toLowerCase()) {
          return framework;
        }
      }
    }
  }

  return null;
}

/**
 * Find similar framework using fuzzy matching
 */
export function findSimilarFramework(
  criteria: FrameworkMatchCriteria
): { framework: CompetencyFramework; matchScore: number; adaptations: string[] } | null {
  let bestMatch: CompetencyFramework | null = null;
  let bestScore = 0;
  const adaptations: string[] = [];

  for (const framework of COMPETENCY_FRAMEWORKS) {
    let score = 0;

    // Role similarity (most important)
    const roleSimilarity = calculateStringSimilarity(framework.role, criteria.role);
    score += roleSimilarity * 70;

    // Check aliases
    for (const alias of framework.aliases) {
      const aliasSimilarity = calculateStringSimilarity(alias, criteria.role);
      score = Math.max(score, aliasSimilarity * 70);
    }

    // Industry similarity
    if (criteria.industry) {
      const industrySimilarity = calculateStringSimilarity(framework.industry, criteria.industry);
      score += industrySimilarity * 30;
    }

    if (score > bestScore && score > 50) { // Minimum 50% match
      bestScore = score;
      bestMatch = framework;

      // Document adaptations
      adaptations.length = 0;
      if (roleSimilarity < 1.0) {
        adaptations.push(`Adapted from "${framework.role}" to "${criteria.role}"`);
      }
      if (criteria.industry && framework.industry.toLowerCase() !== criteria.industry.toLowerCase()) {
        adaptations.push(`Cross-industry adaptation from "${framework.industry}" to "${criteria.industry}"`);
      }
    }
  }

  if (bestMatch && bestScore > 50) {
    return { framework: bestMatch, matchScore: bestScore, adaptations };
  }

  return null;
}

/**
 * Load framework context for extraction
 */
export async function loadFrameworkContext(
  criteria: FrameworkMatchCriteria
): Promise<FrameworkContext> {
  console.log(`🔍 Loading framework for role: "${criteria.role}", industry: "${criteria.industry || 'any'}"`);

  // Try exact match
  const exactMatch = findCompetencyFramework(criteria.role, criteria.industry);
  if (exactMatch) {
    console.log(`✅ Exact framework match: ${exactMatch.role}`);
    return {
      framework: exactMatch,
      matchQuality: 'exact',
      matchScore: 100,
      adaptations: [],
      confidence: 95
    };
  }

  // Try fuzzy match
  const similarMatch = findSimilarFramework(criteria);
  if (similarMatch) {
    console.log(`🔄 Similar framework match: ${similarMatch.framework.role} (${similarMatch.matchScore.toFixed(0)}% match)`);
    return {
      framework: similarMatch.framework,
      matchQuality: 'partial',
      matchScore: similarMatch.matchScore,
      adaptations: similarMatch.adaptations,
      confidence: Math.min(similarMatch.matchScore, 85)
    };
  }

  // Use default framework
  console.log(`⚠️ No matching framework found, using default`);
  const defaultFramework = getDefaultFramework();

  return {
    framework: defaultFramework,
    matchQuality: 'default',
    matchScore: 0,
    adaptations: ['Using generic framework - no role-specific benchmarks available'],
    confidence: 50
  };
}

/**
 * Get default framework for unknown roles
 */
function getDefaultFramework(): CompetencyFramework {
  return {
    role: 'Generic Professional',
    industry: 'General',
    aliases: [],
    technicalCompetencies: [
      {
        name: 'Domain Expertise',
        requiredLevel: 'advanced',
        category: 'Technical',
        keywords: ['expertise', 'knowledge', 'skills', 'proficiency']
      },
      {
        name: 'Problem Solving',
        requiredLevel: 'advanced',
        category: 'Cognitive',
        keywords: ['problem solving', 'analysis', 'troubleshooting', 'solutions']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 1,
        maxValue: 50,
        typicalValue: 5,
        unit: 'people',
        keywords: ['team', 'staff', 'people', 'employees', 'managed', 'supervised', 'led']
      },
      {
        aspect: 'Budget',
        minValue: 10000,
        maxValue: 10000000,
        typicalValue: 500000,
        unit: 'USD',
        keywords: ['budget', 'financial', 'spending', 'cost', 'expenditure', 'P&L']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['any'],
        required: false
      }
    ],
    certifications: [],
    experienceLevel: {
      minYears: 2,
      maxYears: 20,
      typical: 5
    }
  };
}

/**
 * Build framework-aware extraction prompt context
 */
export function buildFrameworkPromptContext(
  framework: CompetencyFramework,
  passType: 'power_phrases' | 'skills' | 'competencies' | 'soft_skills'
): string {
  switch (passType) {
    case 'power_phrases':
      return buildPowerPhrasesContext(framework);
    case 'skills':
      return buildSkillsContext(framework);
    case 'competencies':
      return buildCompetenciesContext(framework);
    case 'soft_skills':
      return buildSoftSkillsContext(framework);
    default:
      return '';
  }
}

/**
 * Build context for power phrases extraction
 */
function buildPowerPhrasesContext(framework: CompetencyFramework): string {
  const managementContext = framework.managementBenchmarks.length > 0
    ? `
MANAGEMENT/LEADERSHIP BENCHMARKS TO LOOK FOR:
${framework.managementBenchmarks.map(b => `
- ${b.aspect}: Typical range ${b.minValue}-${b.maxValue} ${b.unit} (typical: ${b.typicalValue} ${b.unit})
  Keywords to watch for: ${b.keywords.join(', ')}
`).join('\n')}

⚠️ CRITICAL: These are TYPICAL values for ${framework.role}. The candidate may exceed or fall short.
Extract what is ACTUALLY stated in the resume, but flag if significantly outside these ranges.
`
    : '';

  const technicalContext = `
EXPECTED TECHNICAL COMPETENCIES for ${framework.role}:
${framework.technicalCompetencies.slice(0, 5).map(c => `
- ${c.name} (${c.requiredLevel} level): Look for ${c.keywords.slice(0, 3).join(', ')}
`).join('\n')}

When extracting achievements, prioritize those that demonstrate these competencies.
`;

  return `
═══════════════════════════════════════════════════════════
ROLE CONTEXT: Analyzing resume for "${framework.role}" in ${framework.industry}
═══════════════════════════════════════════════════════════

${managementContext}

${technicalContext}

EXTRACTION GUIDANCE:
1. For this role, management/leadership scope is ${framework.managementBenchmarks.length > 0 ? 'CRITICAL' : 'optional'}
2. Technical achievements should align with the competencies listed above
3. Quantified achievements should include BOTH impact metrics AND scope metrics
4. Extract what is ACTUALLY in the resume, but note if claims seem unusually high/low

═══════════════════════════════════════════════════════════
`;
}

/**
 * Build context for skills extraction
 */
function buildSkillsContext(framework: CompetencyFramework): string {
  return `
═══════════════════════════════════════════════════════════
ROLE CONTEXT: Skills for "${framework.role}"
═══════════════════════════════════════════════════════════

EXPECTED CORE SKILLS (look for these specifically):
${framework.technicalCompetencies.map(c => `
- ${c.name} (${c.requiredLevel}): ${c.keywords.join(', ')}
`).join('\n')}

PRIORITIZE skills that match these expectations, but also extract any other relevant skills.
If a skill is mentioned but not demonstrated, assign lower confidence.

═══════════════════════════════════════════════════════════
`;
}

/**
 * Build context for competencies extraction
 */
function buildCompetenciesContext(framework: CompetencyFramework): string {
  return `
═══════════════════════════════════════════════════════════
ROLE CONTEXT: Competencies for "${framework.role}"
═══════════════════════════════════════════════════════════

FRAMEWORK COMPETENCIES:
${framework.technicalCompetencies.map(c => `${c.category}: ${c.name}`).join('\n')}

INFER competencies based on:
1. Explicit mentions of these competency areas
2. Achievements that demonstrate these capabilities
3. Job responsibilities that require these skills

EXPERIENCE LEVEL: ${framework.experienceLevel.typical} years typical
Expect competencies appropriate for this experience level.

═══════════════════════════════════════════════════════════
`;
}

/**
 * Build context for soft skills extraction
 */
function buildSoftSkillsContext(framework: CompetencyFramework): string {
  const seniorityLevel = framework.experienceLevel.typical >= 10 ? 'senior' :
    framework.experienceLevel.typical >= 5 ? 'mid-level' : 'junior';

  return `
═══════════════════════════════════════════════════════════
ROLE CONTEXT: Soft Skills for ${seniorityLevel} "${framework.role}"
═══════════════════════════════════════════════════════════

SENIORITY EXPECTATIONS:
- Experience level: ${seniorityLevel} (${framework.experienceLevel.typical} years typical)
- ${framework.managementBenchmarks.length > 0 ? 'Leadership/management role - expect leadership soft skills' : 'Individual contributor role - expect collaboration soft skills'}

LOOK FOR BEHAVIORAL EVIDENCE of soft skills like:
${seniorityLevel === 'senior' ? '- Strategic thinking, stakeholder management, mentorship, decision-making' : ''}
${seniorityLevel === 'mid-level' ? '- Collaboration, problem-solving, communication, adaptability' : ''}
${seniorityLevel === 'junior' ? '- Learning agility, attention to detail, teamwork, initiative' : ''}

═══════════════════════════════════════════════════════════
`;
}

/**
 * Validate extraction against framework benchmarks
 */
export function validateAgainstFramework(
  extracted: any,
  framework: CompetencyFramework
): {
  missingExpectedFields: string[];
  unusualClaims: Array<{ field: string; value: any; expected: string; severity: 'warning' | 'info' }>;
} {
  const missingExpectedFields: string[] = [];
  const unusualClaims: Array<{ field: string; value: any; expected: string; severity: 'warning' | 'info' }> = [];

  // Check for management evidence if role requires it
  if (framework.managementBenchmarks.length > 0) {
    const powerPhrases = extracted.powerPhrases || extracted.power_phrases || [];
    const hasManagementEvidence = powerPhrases.some((p: any) =>
      /manag|supervis|led|direct|oversee|guide|coordinat/i.test(p.phrase || p.power_phrase || '')
    );

    if (!hasManagementEvidence) {
      missingExpectedFields.push('management_evidence');
    }
  }

  // Check for expected technical competencies
  const skills = extracted.skills || extracted.transferableSkills || [];
  for (const competency of framework.technicalCompetencies) {
    if (competency.requiredLevel === 'expert' || competency.requiredLevel === 'advanced') {
      const found = skills.some((s: any) =>
        competency.keywords.some(k =>
          (s.stated_skill || s.skill_name || '').toLowerCase().includes(k.toLowerCase())
        )
      );

      if (!found) {
        missingExpectedFields.push(`competency_${competency.name.toLowerCase().replace(/\s+/g, '_')}`);
      }
    }
  }

  // Check for unusual values
  const powerPhrases = extracted.powerPhrases || extracted.power_phrases || [];
  for (const phrase of powerPhrases) {
    const metrics = phrase.impact_metrics || phrase.impactMetrics;
    if (!metrics) continue;

    // Check team size
    const teamSizeBenchmark = framework.managementBenchmarks.find(b => b.aspect === 'Team Size');
    if (teamSizeBenchmark && metrics.teamSize) {
      if (metrics.teamSize > teamSizeBenchmark.maxValue * 2) {
        unusualClaims.push({
          field: 'team_size',
          value: metrics.teamSize,
          expected: `${teamSizeBenchmark.minValue}-${teamSizeBenchmark.maxValue} typical for ${framework.role}`,
          severity: 'warning'
        });
      }
    }

    // Check budget
    const budgetBenchmark = framework.managementBenchmarks.find(b => b.aspect === 'Budget');
    if (budgetBenchmark && metrics.budget) {
      if (metrics.budget > budgetBenchmark.maxValue * 3) {
        unusualClaims.push({
          field: 'budget',
          value: metrics.budget,
          expected: `$${budgetBenchmark.minValue.toLocaleString()}-$${budgetBenchmark.maxValue.toLocaleString()} typical for ${framework.role}`,
          severity: 'warning'
        });
      }
    }
  }

  return { missingExpectedFields, unusualClaims };
}
