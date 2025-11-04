/**
 * Career Context Analyzer - Deep Career Intelligence Extraction
 *
 * Analyzes vault content to infer career level, experience, and trajectory.
 * Used to generate hyper-personalized gap analysis and recommendations.
 */

export interface CareerContext {
  // Core demographics
  inferredSeniority: 'Junior IC' | 'Mid-Level IC' | 'Senior IC' | 'Staff/Principal IC' |
                     'Team Lead' | 'Manager' | 'Senior Manager' | 'Director' | 'VP' | 'C-Level';
  seniorityConfidence: number; // 0-100
  yearsOfExperience: number;

  // Role characteristics
  hasManagementExperience: boolean;
  teamSizesManaged: number[]; // e.g., [5, 12, 30]
  hasExecutiveExposure: boolean; // Worked with C-suite/board
  hasBudgetOwnership: boolean;
  budgetSizesManaged: number[]; // in USD

  // Company context
  companySizes: ('startup' | 'midmarket' | 'enterprise')[];

  // Technical vs Leadership balance
  technicalDepth: number; // 0-100 (IC-focused)
  leadershipDepth: number; // 0-100 (Manager-focused)
  strategicDepth: number; // 0-100 (Executive-focused)

  // Work scope analysis
  primaryResponsibilities: string[]; // Top 5-8 things they do
  impactScale: 'individual' | 'team' | 'department' | 'organization' | 'company';

  // Career trajectory signals
  nextLikelyRole: string;
  careerArchetype: 'deep_technical' | 'tech_leadership' | 'people_management' |
                   'strategic_executive' | 'generalist';
}

interface VaultData {
  powerPhrases: any[];
  skills: any[];
  competencies: any[];
  softSkills: any[];
  leadership: any[];
  executivePresence: any[];
  certifications?: any[];
}

export function analyzeCareerContext(vaultData: VaultData): CareerContext {

  // ===== MANAGEMENT EXPERIENCE DETECTION =====
  const managementPhrases = vaultData.powerPhrases.filter(pp =>
    /led|managed?|directed|guided|supervised|oversaw|coordinated|built\s+team|hired|recruited|coached|mentored|spearheaded|headed|commanded|governed/i.test(pp.power_phrase)
  );

  const teamSizes = managementPhrases
    .map(pp => {
      // Match various team size patterns:
      // "team of 5", "5 engineers", "3-4 rigs", "managed 12 people"
      const patterns = [
        /(?:team|group|crew|staff)\s+of\s+(\d+)/i,
        /(\d+)\s+(?:engineers?|people|reports?|employees|staff|members)/i,
        /(?:over|managed?|supervised|led)\s+(\d+)/i,
        /(\d+)[-–]\d+\s+(?:rigs|teams|groups|people)/i, // "3-4 rigs" -> extract first number
      ];

      for (const pattern of patterns) {
        const match = pp.power_phrase.match(pattern);
        if (match) return parseInt(match[1]);
      }
      return null;
    })
    .filter((n): n is number => n !== null);

  const maxTeamSize = teamSizes.length > 0 ? Math.max(...teamSizes) : 0;
  const hasManagementExperience = managementPhrases.length > 0;

  // ===== EXECUTIVE EXPOSURE DETECTION =====
  const executivePhrases = vaultData.powerPhrases.filter(pp =>
    /board|c-suite|ceo|cto|cfo|coo|vp|executive\s+team|presented\s+to\s+leadership|senior\s+leadership/i.test(pp.power_phrase)
  );

  const hasExecutiveExposure = executivePhrases.length > 0 || vaultData.executivePresence.length > 15;

  // ===== BUDGET OWNERSHIP DETECTION =====
  const budgetPhrases = vaultData.powerPhrases.filter(pp =>
    /\$\d+|budget|p&l|revenue|cost\s+sav/i.test(pp.power_phrase)
  );

  const budgetSizes = budgetPhrases
    .map(pp => {
      // Match patterns like: "$350MM", "$1.5M", "$100K", "350 million"
      const patterns = [
        /\$(\d+(?:\.\d+)?)\s*(mm|m|k|b)?/i,
        /(\d+(?:\.\d+)?)\s+(million|billion|thousand)/i,
      ];

      for (const pattern of patterns) {
        const match = pp.power_phrase.match(pattern);
        if (!match) continue;

        const value = parseFloat(match[1]);
        const unit = match[2]?.toLowerCase();

        const multiplier =
          unit === 'k' || unit === 'thousand' ? 1000 :
          unit === 'm' || unit === 'mm' || unit === 'million' ? 1000000 :
          unit === 'b' || unit === 'billion' ? 1000000000 : 1;

        return value * multiplier;
      }
      return null;
    })
    .filter((n): n is number => n !== null);

  const hasBudgetOwnership = budgetSizes.length > 0;

  // ===== COMPANY SIZE INFERENCE =====
  const companySizeIndicators = vaultData.powerPhrases
    .map(pp => {
      if (/startup|seed|series\s+[ab]|early.stage/i.test(pp.power_phrase)) return 'startup';
      if (/enterprise|fortune\s+\d+|global|international|f500/i.test(pp.power_phrase)) return 'enterprise';
      return 'midmarket';
    });

  const companySizes = Array.from(new Set(companySizeIndicators)) as ('startup' | 'midmarket' | 'enterprise')[];

  // ===== SENIORITY INFERENCE =====
  let inferredSeniority: CareerContext['inferredSeniority'];
  let seniorityConfidence = 70;

  if (hasExecutiveExposure && hasBudgetOwnership && maxTeamSize >= 50) {
    inferredSeniority = 'VP';
    seniorityConfidence = 90;
  } else if (hasExecutiveExposure && maxTeamSize >= 30) {
    inferredSeniority = 'Director';
    seniorityConfidence = 85;
  } else if (hasManagementExperience && maxTeamSize >= 15) {
    inferredSeniority = 'Senior Manager';
    seniorityConfidence = 80;
  } else if (hasManagementExperience && maxTeamSize >= 5) {
    inferredSeniority = 'Manager';
    seniorityConfidence = 85;
  } else if (vaultData.powerPhrases.length > 50 && vaultData.leadership.length > 10) {
    inferredSeniority = 'Staff/Principal IC';
    seniorityConfidence = 75;
  } else if (vaultData.powerPhrases.length > 30) {
    inferredSeniority = 'Senior IC';
    seniorityConfidence = 80;
  } else if (vaultData.powerPhrases.length > 15) {
    inferredSeniority = 'Mid-Level IC';
    seniorityConfidence = 85;
  } else {
    inferredSeniority = 'Junior IC';
    seniorityConfidence = 70;
  }

  // ===== YEARS OF EXPERIENCE ESTIMATION =====
  const yearsOfExperience = Math.max(
    Math.floor(vaultData.powerPhrases.length / 6), // ~6 achievements per year
    maxTeamSize > 0 ? Math.floor(maxTeamSize / 3) + 5 : 0, // Managing 15 people ≈ 10+ years
    (vaultData.certifications?.length || 0) * 2, // Certifications accumulate over time
    3 // Minimum assumption
  );

  // ===== TECHNICAL VS LEADERSHIP BALANCE =====
  const technicalSkills = vaultData.skills.filter(s =>
    /python|java|javascript|typescript|aws|azure|gcp|kubernetes|docker|sql|react|angular|vue|api|microservice|cloud/i.test(s.stated_skill || s.skill)
  ).length;

  const leadershipSkills = vaultData.leadership.length +
                          vaultData.softSkills.filter(s =>
                            /communication|leadership|mentoring|coaching|collaboration/i.test(s.soft_skill || s.skill)
                          ).length;

  const total = Math.max(technicalSkills + leadershipSkills, 1);
  const technicalDepth = Math.round((technicalSkills / total) * 100);
  const leadershipDepth = Math.round((leadershipSkills / total) * 100);
  const strategicDepth = hasExecutiveExposure ? 75 : hasManagementExperience ? 40 : 15;

  // ===== PRIMARY RESPONSIBILITIES =====
  const primaryResponsibilities = vaultData.powerPhrases
    .slice(0, 8)
    .map(pp => {
      // Extract verb + object pattern
      const match = pp.power_phrase.match(/^([\w\s]+?(?:ed|ing))\s+(.{20,60})/i);
      if (match) {
        return `${match[1].trim()} ${match[2].split(/[,.]/)[ 0].trim()}`;
      }
      return pp.power_phrase.slice(0, 60);
    });

  // ===== IMPACT SCALE =====
  let impactScale: CareerContext['impactScale'] = 'individual';
  if (maxTeamSize >= 50) impactScale = 'company';
  else if (maxTeamSize >= 20) impactScale = 'organization';
  else if (maxTeamSize >= 5) impactScale = 'department';
  else if (managementPhrases.length > 0) impactScale = 'team';

  // ===== CAREER ARCHETYPE =====
  let careerArchetype: CareerContext['careerArchetype'] = 'generalist';
  if (technicalDepth > 70 && !hasManagementExperience) {
    careerArchetype = 'deep_technical';
  } else if (technicalDepth > 50 && hasManagementExperience) {
    careerArchetype = 'tech_leadership';
  } else if (hasManagementExperience && leadershipDepth > 60) {
    careerArchetype = 'people_management';
  } else if (strategicDepth > 60) {
    careerArchetype = 'strategic_executive';
  }

  // ===== NEXT LIKELY ROLE =====
  const nextLikelyRole = getNextRole(inferredSeniority, careerArchetype);

  return {
    inferredSeniority,
    seniorityConfidence,
    yearsOfExperience,
    hasManagementExperience,
    teamSizesManaged: teamSizes,
    hasExecutiveExposure,
    hasBudgetOwnership,
    budgetSizesManaged: budgetSizes,
    companySizes,
    technicalDepth,
    leadershipDepth,
    strategicDepth,
    primaryResponsibilities,
    impactScale,
    nextLikelyRole,
    careerArchetype,
  };
}

function getNextRole(current: CareerContext['inferredSeniority'], archetype: CareerContext['careerArchetype']): string {
  const roleProgressions: Record<string, Record<string, string>> = {
    'Junior IC': {
      'deep_technical': 'Mid-Level Software Engineer',
      'generalist': 'Mid-Level Engineer'
    },
    'Mid-Level IC': {
      'deep_technical': 'Senior Software Engineer',
      'generalist': 'Senior Engineer'
    },
    'Senior IC': {
      'deep_technical': 'Staff Engineer',
      'tech_leadership': 'Engineering Manager',
      'generalist': 'Staff Engineer'
    },
    'Staff/Principal IC': {
      'deep_technical': 'Principal Engineer',
      'tech_leadership': 'Senior Engineering Manager',
      'strategic_executive': 'Director of Engineering'
    },
    'Manager': {
      'people_management': 'Senior Engineering Manager',
      'tech_leadership': 'Senior Engineering Manager'
    },
    'Senior Manager': {
      'people_management': 'Director of Engineering',
      'strategic_executive': 'VP of Engineering'
    },
    'Director': {
      'strategic_executive': 'VP of Engineering'
    },
    'VP': {
      'strategic_executive': 'SVP or CTO'
    },
  };

  return roleProgressions[current]?.[archetype] || 'Next Senior Role';
}

export function getCareerLevelGuidance(level: CareerContext['inferredSeniority']): string {
  const guidance: Record<string, string> = {
    'Junior IC': '- Focus on: Technical skill depth, foundational engineering practices, code quality\n- Avoid: Leadership/management gaps, executive presence\n- Gaps should be: Technical skills, learning velocity, contribution impact',

    'Mid-Level IC': '- Focus on: System design, cross-functional collaboration, technical ownership, mentoring juniors\n- Avoid: People management, board communication\n- Gaps should be: Architecture experience, technical leadership, stakeholder communication',

    'Senior IC': '- Focus on: Architecture, technical strategy, mentoring, tech-to-business translation, cross-org influence\n- Avoid: P&L ownership, board communication (unless seeking management track)\n- Gaps should be: System architecture, technical vision, influence without authority',

    'Staff/Principal IC': '- Focus on: Org-wide technical influence, architecture vision, industry thought leadership, strategic partnerships\n- May include: Technical executive presence, company-wide initiatives\n- Gaps should be: Technical strategy, org design input, external thought leadership',

    'Team Lead': '- Focus on: Team coordination, technical mentoring, project delivery, stakeholder alignment\n- Gaps should be: People skills, delegation, project management',

    'Manager': '- Focus on: Team building, hiring, 1:1 coaching, performance management, roadmap execution, stakeholder management\n- Avoid: Board communication, large-scale org transformation\n- Gaps should be: Talent development, team dynamics, delivery execution',

    'Senior Manager': '- Focus on: Multi-team coordination, strategic roadmap planning, talent development at scale, budget management, cross-functional leadership\n- May include: Executive presentations, department strategy\n- Gaps should be: Org planning, strategic influence, manager development',

    'Director': '- Focus on: Department strategy, org design, cross-functional leadership, executive presence, budget/P&L\n- Include: Senior stakeholder management, may include board exposure\n- Gaps should be: Strategic vision, org transformation, executive communication',

    'VP': '- Focus on: Company strategy, org-wide transformation, board communication, P&L ownership, market positioning\n- Include: All executive-level competencies\n- Gaps should be: Board-level communication, strategic planning, P&L management',

    'C-Level': '- Focus on: Company vision, market strategy, board governance, investor relations, industry leadership\n- Gaps should be: Board expertise, market vision, company-wide transformation',
  };

  return guidance[level] || guidance['Mid-Level IC'];
}
