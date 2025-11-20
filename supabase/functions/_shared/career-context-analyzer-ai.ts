/**
 * Career Context Analyzer - AI-Powered Career Intelligence
 *
 * REPLACES the regex-based career-context-analyzer.ts with AI-powered analysis.
 *
 * WHY AI INSTEAD OF REGEX?
 * - Regex can only match patterns we explicitly program
 * - AI understands context and nuance across ANY industry
 * - No maintenance of brittle pattern matching
 * - Works for phrases we never anticipated
 *
 * Example:
 * - Regex: Needs explicit pattern for "managed", "led", "guided", "supervised"...
 * - AI: Understands "stewarded", "orchestrated", "accountable for" without being told
 */

import { callLovableAI, LOVABLE_AI_MODELS } from './lovable-ai-config.ts';
import { logAIUsage } from './cost-tracking.ts';
import { 
  calculateYearsOfExperience, 
  inferSeniorityLevel, 
  hasManagementExperience,
  extractBudgetOwnership,
  inferCompanySizes,
  type WorkPosition 
} from './career-calculations.ts';

export interface CareerContext {
  // Core demographics
  inferredSeniority: 'Junior IC' | 'Mid-Level IC' | 'Senior IC' | 'Staff/Principal IC' |
                     'Team Lead' | 'Manager' | 'Senior Manager' | 'Director' | 'VP' | 'C-Level';
  seniorityConfidence: number; // 0-100
  yearsOfExperience: number;

  // Role characteristics
  hasManagementExperience: boolean;
  managementDetails: string; // AI explanation: "Led teams of 3-4 rigs, $350MM budget oversight"
  teamSizesManaged: number[]; // e.g., [3, 4, 12]
  hasExecutiveExposure: boolean;
  executiveDetails: string; // AI explanation
  hasBudgetOwnership: boolean;
  budgetDetails: string; // AI explanation: "$350MM annual drilling operations budget"
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

  // AI reasoning (for debugging/transparency)
  aiReasoning: string;
}

interface VaultData {
  powerPhrases: any[];
  skills: any[];
  competencies: any[];
  softSkills: any[];
  leadership: any[];
  executivePresence: any[];
  certifications?: any[];
  workPositions?: WorkPosition[];
  education?: any[];
  milestones?: any[];
}

/**
 * AI-powered career context analysis
 *
 * Uses AI to analyze vault data and infer career level, experience, and trajectory.
 * No brittle regex patterns - AI understands context and nuance.
 */
export async function analyzeCareerContextAI(vaultData: VaultData, userId: string): Promise<CareerContext> {

  // CRITICAL FIX: Use actual work positions data instead of guessing
  console.log('[CAREER CONTEXT] Analyzing vault data:', {
    powerPhrases: vaultData.powerPhrases?.length || 0,
    skills: vaultData.skills?.length || 0,
    workPositions: vaultData.workPositions?.length || 0,
    education: vaultData.education?.length || 0,
    milestones: vaultData.milestones?.length || 0,
  });

  // Calculate factual career metrics from work positions
  const workPositions = vaultData.workPositions || [];
  const milestones = vaultData.milestones || [];

  // FACT 1: Years of experience from actual work history
  const yearsOfExperience = calculateYearsOfExperience(workPositions);
  console.log(`[CAREER CONTEXT] ✅ FACT: ${yearsOfExperience} years of experience from ${workPositions.length} positions`);

  // FACT 2: Seniority from actual job titles
  const seniorityResult = inferSeniorityLevel(workPositions);
  console.log(`[CAREER CONTEXT] ✅ FACT: ${seniorityResult.seniority} (${seniorityResult.confidence}% confidence)`);

  // FACT 3: Management experience from titles and team sizes
  const managementResult = hasManagementExperience(workPositions, milestones);
  console.log(`[CAREER CONTEXT] ✅ FACT: Management=${managementResult.hasManagement}, Teams=${managementResult.teamSizes.join(', ')}`);

  // FACT 4: Budget ownership from milestones
  const budgetResult = extractBudgetOwnership(milestones);
  console.log(`[CAREER CONTEXT] ✅ FACT: Budget=${budgetResult.hasBudget}, Sizes=$${budgetResult.budgetSizes.map(b => (b/1_000_000).toFixed(1) + 'M').join(', ')}`);

  // FACT 5: Company sizes from work history
  const companySizes = inferCompanySizes(workPositions);
  console.log(`[CAREER CONTEXT] ✅ FACT: Company sizes=${companySizes.join(', ')}`);

  // If work positions exist, use factual data and minimal AI
  if (workPositions.length > 0) {
    console.log('[CAREER CONTEXT] ✅ Using FACTUAL data from work positions (no guessing)');
    
    return {
      inferredSeniority: seniorityResult.seniority,
      seniorityConfidence: seniorityResult.confidence,
      yearsOfExperience,
      hasManagementExperience: managementResult.hasManagement,
      managementDetails: managementResult.details,
      teamSizesManaged: managementResult.teamSizes,
      hasExecutiveExposure: seniorityResult.seniority === 'C-Level' || seniorityResult.seniority === 'VP',
      executiveDetails: seniorityResult.seniority === 'C-Level' || seniorityResult.seniority === 'VP' 
        ? `${seniorityResult.seniority} title from work history`
        : 'No executive-level titles in work history',
      hasBudgetOwnership: budgetResult.hasBudget,
      budgetDetails: budgetResult.details,
      budgetSizesManaged: budgetResult.budgetSizes,
      companySizes,
      technicalDepth: workPositions.some(wp => /engineer|developer|architect|technical/i.test(wp.job_title)) ? 75 : 50,
      leadershipDepth: managementResult.hasManagement ? 70 : 30,
      strategicDepth: seniorityResult.seniority.includes('Director') || seniorityResult.seniority.includes('VP') || seniorityResult.seniority === 'C-Level' ? 70 : 40,
      primaryResponsibilities: workPositions.slice(0, 1).map(wp => wp.description?.split('.')[0] || wp.job_title).filter(Boolean),
      impactScale: seniorityResult.seniority.includes('C-Level') || seniorityResult.seniority.includes('VP') ? 'company' :
                   seniorityResult.seniority.includes('Director') ? 'organization' :
                   managementResult.hasManagement ? 'department' :
                   seniorityResult.seniority.includes('Senior') ? 'team' : 'individual',
      nextLikelyRole: `Next level from ${seniorityResult.seniority}`,
      careerArchetype: managementResult.hasManagement ? 'people_management' :
                       seniorityResult.seniority.includes('Staff') || seniorityResult.seniority.includes('Principal') ? 'deep_technical' : 'tech_leadership',
      aiReasoning: `FACTUAL ANALYSIS: ${yearsOfExperience}yrs experience, ${seniorityResult.reasoning}. ${managementResult.details}. ${budgetResult.details}.`
    };
  }

  // FALLBACK: If no work positions, fall back to AI inference from power phrases
  console.warn('[CAREER CONTEXT] ⚠️ No work positions found - falling back to AI inference (less accurate)');

  // If vault is completely empty, return minimal context
  const totalItems = (vaultData.powerPhrases?.length || 0) + 
                     (vaultData.skills?.length || 0) + 
                     (vaultData.competencies?.length || 0);
  
  if (totalItems === 0) {
    console.warn('[CAREER CONTEXT] Vault is empty - returning minimal context');
    return {
      inferredSeniority: 'Mid-Level IC',
      seniorityConfidence: 10,
      yearsOfExperience: 5,
      hasManagementExperience: false,
      managementDetails: 'No vault data available - run extraction first',
      teamSizesManaged: [],
      hasExecutiveExposure: false,
      executiveDetails: 'No vault data available',
      hasBudgetOwnership: false,
      budgetDetails: 'No vault data available',
      budgetSizesManaged: [],
      companySizes: [],
      technicalDepth: 50,
      leadershipDepth: 30,
      strategicDepth: 40,
      primaryResponsibilities: [],
      impactScale: 'individual',
      nextLikelyRole: 'Unknown - insufficient data',
      careerArchetype: 'generalist',
      aiReasoning: 'Vault is empty - no data to analyze. User needs to complete resume extraction first.',
    };
  }

  // Prepare vault data summary for AI
  const powerPhrasesText = (vaultData.powerPhrases || [])
    .map(pp => `- ${pp.power_phrase || pp.phrase}`)
    .join('\n');

  // 🔍 DIAGNOSTIC: Check what power phrases the analyzer is receiving
  const managementKeywordsInPhrases = (vaultData.powerPhrases || []).filter(pp =>
    /supervis|manag|led|team|direct|oversee|rig|crew/i.test(pp.power_phrase || pp.phrase || '')
  );
  console.log('🔍 [DIAGNOSTIC] Career analyzer received power phrases with management keywords:',
    managementKeywordsInPhrases.map(pp => pp.power_phrase || pp.phrase)
  );

  if (managementKeywordsInPhrases.length === 0) {
    console.warn('⚠️ [DIAGNOSTIC] Career analyzer received NO power phrases with management keywords!');
  }

  const skillsText = (vaultData.skills || [])
    .map(s => s.stated_skill || s.skill)
    .join(', ');

  const softSkillsText = (vaultData.softSkills || [])
    .map(s => s.skill_name || s.soft_skill || s.skill)
    .join(', ');

  const competenciesText = (vaultData.competencies || [])
    .map(c => `${c.competency_area}: ${c.inferred_capability}`)
    .join('\n');

  const leadershipText = (vaultData.leadership || [])
    .map(l => l.philosophy_statement || l.statement)
    .join('; ');

  const prompt = `You are an expert career analyst. Analyze this professional's vault data and determine their career context.

VAULT DATA:

POWER PHRASES (Quantified Achievements):
${powerPhrasesText}

SKILLS (${vaultData.skills.length} total):
${skillsText}

SOFT SKILLS (${vaultData.softSkills.length} total):
${softSkillsText}

LEADERSHIP INSIGHTS (${vaultData.leadership.length} total):
${leadershipText}

EXECUTIVE PRESENCE INDICATORS: ${vaultData.executivePresence.length} items

CERTIFICATIONS: ${vaultData.certifications?.length || 0} items

---

TASK: Analyze this vault data and provide career context analysis.

RESPOND WITH VALID JSON ONLY (no markdown):
{
  "hasManagementExperience": true,
  "managementDetails": "Led drilling operations team across 3-4 rigs with oversight of 12+ personnel",
  "teamSizesManaged": [3, 4, 12],
  "hasBudgetOwnership": true,
  "budgetDetails": "$350MM annual drilling operations budget with documented cost optimization",
  "budgetSizesManaged": [350000000],
  "hasExecutiveExposure": false,
  "executiveDetails": "No evidence of C-suite or board-level interactions",
  "inferredSeniority": "Senior Manager",
  "seniorityConfidence": 85,
  "yearsOfExperience": 12,
  "technicalDepth": 75,
  "leadershipDepth": 65,
  "strategicDepth": 45,
  "primaryResponsibilities": [
    "Drilling operations oversight",
    "Budget management ($350MM)",
    "Team leadership (3-4 rigs)",
    "AFE generation and approval",
    "HSE compliance and safety"
  ],
  "impactScale": "department",
  "nextLikelyRole": "Drilling Engineering Manager or Operations Director",
  "careerArchetype": "tech_leadership",
  "companySizes": ["enterprise"],
  "aiReasoning": "Strong technical drilling expertise combined with clear management scope (3-4 rigs, $350MM budget). Job title 'Supervisor' indicates formal people management. Budget size and operational scale suggest senior individual contributor or first-level manager in large organization. Next step is likely manager/director role."
}

ANALYSIS GUIDELINES:

1. MANAGEMENT EXPERIENCE:
   - Look for ANY indication of people leadership (formal or informal)
   - Phrases like "led team", "guided operations", "supervised", "managed", "directed", "oversaw", "coordinated team", "mentored", etc.
   - Job titles with: Supervisor, Manager, Lead, Director, Head, Chief
   - Team size indicators: "X people", "team of X", "X engineers", "X rigs", etc.
   - Don't require specific words - understand CONTEXT

2. BUDGET OWNERSHIP:
   - Look for budget amounts: "$350MM", "$1.5M", "multi-million dollar"
   - P&L responsibility, cost center ownership, financial accountability
   - Spending authority, budget approval, financial planning
   - Extract dollar amounts where possible

3. EXECUTIVE EXPOSURE:
   - C-suite interactions, board presentations, senior leadership collaboration
   - Strategic planning at company level
   - External representation (industry conferences, partnerships)

4. SENIORITY INFERENCE:
   - Junior IC: 0-3 years, learning focused, no team leadership
   - Mid-Level IC: 3-6 years, project ownership, may mentor
   - Senior IC: 6-10 years, technical leadership, cross-team influence
   - Staff/Principal IC: 10+ years, architectural influence, company-wide impact
   - Team Lead: Informal leadership, 2-5 people
   - Manager: Formal management, 5-15 people, hiring/firing authority
   - Senior Manager: Multiple teams, 15-50 people, budget ownership
   - Director: Department-level, 50-150 people, strategic planning
   - VP: Division-level, 150+ people, P&L ownership
   - C-Level: Company-level, board accountability

5. CAREER ARCHETYPE:
   - deep_technical: Strong technical skills, no management interest, IC track
   - tech_leadership: Technical + leadership, architect or staff engineer path
   - people_management: People leadership focus, manager track
   - strategic_executive: Strategic thinking, executive presence, VP/C-level path
   - generalist: Balanced across multiple dimensions

6. YEARS OF EXPERIENCE:
   - Estimate based on achievement depth, skill breadth, leadership progression
   - Consider: 5-8 achievements per year of experience typical
   - Factor in certifications (take time to acquire)
   - Consider management scope (managing 50 people ≈ 10+ years)

BE ACCURATE. Use the ACTUAL evidence from vault data. Don't assume or invent details.`;

  const { response, metrics } = await callLovableAI(
    {
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    },
    'career-context-analyzer',
    userId
  );

  await logAIUsage(metrics);

  // Parse AI response
  const content = response.choices[0].message.content;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // 🔍 DIAGNOSTIC: Show raw AI response for management detection debugging
  console.log('🔍 [DIAGNOSTIC] AI response snippet:', cleaned.substring(0, 500));

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    // Fallback: Use regex-based analysis
    console.warn('Falling back to regex-based analysis due to AI parse error');
    return analyzeCareerContextFallback(vaultData);
  }

  // 🔍 DIAGNOSTIC: Show what AI detected about management
  console.log('🔍 [DIAGNOSTIC] AI detected management:', {
    hasManagement: parsed.hasManagementExperience,
    details: parsed.managementDetails,
    teamSizes: parsed.teamSizesManaged,
    budgetOwnership: parsed.hasBudgetOwnership,
  });

  // Validate and return
  return {
    inferredSeniority: parsed.inferredSeniority || 'Mid-Level IC',
    seniorityConfidence: parsed.seniorityConfidence || 70,
    yearsOfExperience: parsed.yearsOfExperience || 5,
    hasManagementExperience: parsed.hasManagementExperience || false,
    managementDetails: parsed.managementDetails || 'No management experience detected',
    teamSizesManaged: parsed.teamSizesManaged || [],
    hasExecutiveExposure: parsed.hasExecutiveExposure || false,
    executiveDetails: parsed.executiveDetails || 'No executive exposure detected',
    hasBudgetOwnership: parsed.hasBudgetOwnership || false,
    budgetDetails: parsed.budgetDetails || 'No budget ownership detected',
    budgetSizesManaged: parsed.budgetSizesManaged || [],
    companySizes: parsed.companySizes || ['midmarket'],
    technicalDepth: parsed.technicalDepth || 50,
    leadershipDepth: parsed.leadershipDepth || 50,
    strategicDepth: parsed.strategicDepth || 50,
    primaryResponsibilities: parsed.primaryResponsibilities || [],
    impactScale: parsed.impactScale || 'individual',
    nextLikelyRole: parsed.nextLikelyRole || 'Next senior role',
    careerArchetype: parsed.careerArchetype || 'generalist',
    aiReasoning: parsed.aiReasoning || 'AI analysis completed',
  };
}

/**
 * Fallback to basic analysis if AI fails
 * This is the OLD regex-based logic - only used as emergency fallback
 */
function analyzeCareerContextFallback(vaultData: VaultData): CareerContext {
  // Simplified fallback - just count indicators
  const hasManagement = vaultData.powerPhrases.some(pp =>
    /led|manage|direct|guid|supervis|oversee|coordinat/i.test(pp.power_phrase)
  );

  const hasBudget = vaultData.powerPhrases.some(pp =>
    /\$|budget|p&l|revenue/i.test(pp.power_phrase)
  );

  const hasExecutive = vaultData.executivePresence.length > 10;

  return {
    inferredSeniority: hasManagement ? 'Manager' : 'Mid-Level IC',
    seniorityConfidence: 50,
    yearsOfExperience: Math.max(3, Math.floor(vaultData.powerPhrases.length / 6)),
    hasManagementExperience: hasManagement,
    managementDetails: hasManagement ? 'Management indicators detected' : 'No management detected',
    teamSizesManaged: [],
    hasExecutiveExposure: hasExecutive,
    executiveDetails: hasExecutive ? 'Executive presence indicators detected' : 'No executive exposure',
    hasBudgetOwnership: hasBudget,
    budgetDetails: hasBudget ? 'Budget indicators detected' : 'No budget ownership',
    budgetSizesManaged: [],
    companySizes: ['midmarket'],
    technicalDepth: 50,
    leadershipDepth: hasManagement ? 60 : 30,
    strategicDepth: hasExecutive ? 70 : 30,
    primaryResponsibilities: [],
    impactScale: hasManagement ? 'team' : 'individual',
    nextLikelyRole: 'Next senior role',
    careerArchetype: 'generalist',
    aiReasoning: 'Fallback analysis used due to AI parsing error',
  };
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
