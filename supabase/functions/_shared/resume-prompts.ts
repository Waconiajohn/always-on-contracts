/**
 * Shared Resume Generation Prompts
 * 
 * These prompts are designed to make our resume builder NOTICEABLY better
 * than simply pasting into ChatGPT by:
 * 1. Enforcing truth/verification rules
 * 2. Grounding all claims in Career Vault data
 * 3. Providing structured gap analysis
 * 4. Including "why this helps" reasoning
 * 5. Adding interview preparation awareness
 */

// ============================================================================
// SHARED SYSTEM PROMPT - Use for ALL resume-related AI calls
// ============================================================================

export const RESUME_ARCHITECT_SYSTEM_PROMPT = `You are an expert executive résumé architect and hiring strategist.

Your job is to help candidates create **must-interview résumés** for specific roles.

A "must-interview résumé" is one that makes hiring teams think:
"This is exactly the kind of person we've been trying to hire. We should meet them."

## NON-NEGOTIABLE RULES:

1. **NEVER FABRICATE** experience, titles, employers, or accomplishments.
   - Only use information explicitly provided in the Career Vault or résumé
   - If inferring responsibilities, base them on actual job titles and industries

2. **LABEL SUGGESTIONS AS DRAFTS**
   - Every generated bullet or statement should include: "DRAFT - verify this matches your actual experience"
   - Never present generated content as verified fact

3. **INTERVIEW-DEFENSIBLE CLAIMS**
   - Only suggest achievements the candidate can explain in detail during an interview
   - If suggesting metrics, mark estimated figures with "~" or "approximately"

4. **CAREER VAULT = SOURCE OF TRUTH**
   - When Career Vault data is provided, prioritize it over generic industry templates
   - Reference specific vault items in your reasoning

5. **CONSERVATIVE QUANTIFICATION**
   - When adding numbers, use the lower end of realistic ranges
   - Better to under-claim and over-deliver than vice versa

## OUTPUT STYLE:

- Write for senior professionals (35-65 years old)
- Use ATS-optimized language with natural keyword integration
- Be concise and impact-focused
- Lead with outcomes, not responsibilities
- Always return valid JSON when requested`;

// ============================================================================
// GAP TYPES - Classification system for resume gaps
// ============================================================================

export type GapType = 
  | 'missing_skill_or_tool'      // Required skill/tool not mentioned
  | 'weak_achievement_story'     // Has experience but no compelling narrative
  | 'missing_metrics_or_scope'   // Achievement lacks quantification
  | 'missing_domain_experience'  // Industry/domain knowledge gap
  | 'unclear_level_or_seniority' // Doesn't convey appropriate level
  | 'positioning_issue';         // Over/under-qualified perception

export type GapSeverity = 'critical' | 'important' | 'nice-to-have';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ============================================================================
// JOB BLUEPRINT PROMPT - Deep job analysis
// ============================================================================

export const JOB_BLUEPRINT_USER_PROMPT = (jobDescription: string, companyContext?: string) => `
Analyze this job description and produce a structured "Job Blueprint" for building a must-interview résumé.

## INPUTS:

**Job Description:**
${jobDescription}

**Company Context:**
${companyContext || 'Not provided'}

## YOUR TASKS:

1. **Infer Context**
   - Industry (e.g., "Healthcare Technology")
   - Role family (e.g., "Product Management")
   - Seniority level: entry | mid | senior | executive | c-level

2. **Role Summary**
   - 2 sentences focused on OUTCOMES, not responsibilities
   - What does success look like in this role?

3. **Competency Extraction**
   - Top 10-15 competencies (technical, domain, leadership mix)
   - Tag each as: required | preferred | nice-to-have

4. **Must-Haves Identification**
   - Tools, platforms, certifications that are NON-NEGOTIABLE
   - Regulatory frameworks or domain knowledge required

5. **Hiring Manager Priorities**
   - Top 5-8 things the hiring manager REALLY cares about
   - What would make them say "we NEED to interview this person"?
   - What are the deal-breakers that get instant rejection?

6. **Optimal Résumé Structure**
   - Recommended sections for this specific role
   - Bullet count and focus area per section
   - What should the candidate emphasize?

## OUTPUT FORMAT (JSON):

{
  "inferred_industry": "string",
  "inferred_role_family": "string",
  "inferred_seniority": "entry | mid | senior | executive | c-level",
  "role_summary": "2-sentence outcome-focused summary",
  "competencies": [
    {"skill": "string", "category": "required | preferred | nice-to-have", "type": "technical | domain | leadership | soft"}
  ],
  "must_haves": [
    {"requirement": "string", "category": "tool | certification | experience | knowledge"}
  ],
  "hiring_manager_priorities": [
    {"priority": "string", "why_it_matters": "string", "evidence_needed": "string"}
  ],
  "deal_breakers": ["string"],
  "resume_structure": [
    {"section": "Summary", "recommended_bullets": 3, "focus": "Lead with biggest achievement", "keywords_to_include": ["string"]}
  ],
  "ats_keywords": {
    "critical": ["string"],
    "important": ["string"],
    "bonus": ["string"]
  }
}`;

// ============================================================================
// RESUME ASSESSMENT PROMPT - Score and gap analysis
// ============================================================================

export const RESUME_ASSESSMENT_USER_PROMPT = (
  jobBlueprint: object,
  candidateProfile: object,
  currentResumeText: string
) => `
Diagnose how well this résumé positions the candidate as a must-interview choice.

## INPUTS:

**Job Blueprint:**
${JSON.stringify(jobBlueprint, null, 2)}

**Candidate Career Vault Profile:**
${JSON.stringify(candidateProfile, null, 2)}

**Current Résumé Text:**
${currentResumeText}

## YOUR TASKS:

1. **Alignment Score (0-100)**
   - How likely is this candidate to get an interview for THIS specific job?
   - 80+ = Must-interview status
   - 60-79 = Qualified but needs work
   - Below 60 = Significant gaps

2. **Strengths Analysis**
   - Where does the résumé already align well with the job blueprint?
   - What would make a hiring manager say "yes"?

3. **Gap Analysis**
   - Identify 5-8 most important gaps that would change a hiring manager's decision
   - For EACH gap, provide:
     * Gap type classification
     * Severity level
     * Current state snapshot (what the résumé says now)
     * Target state (what it should say)
     * Any Career Vault evidence that could help
     * Why this specific gap matters for this specific job

## OUTPUT FORMAT (JSON):

{
  "overall_alignment_score": 72,
  "score_explanation": "Short paragraph explaining the score",
  "strengths": [
    {
      "area": "string",
      "details": "What the résumé does well",
      "keywords_present": ["string"]
    }
  ],
  "gaps": [
    {
      "id": "gap_1",
      "title": "Short descriptive title",
      "gap_type": "missing_skill_or_tool | weak_achievement_story | missing_metrics_or_scope | missing_domain_experience | unclear_level_or_seniority | positioning_issue",
      "severity": "critical | important | nice-to-have",
      "related_competencies": ["string"],
      "related_resume_sections": ["Summary", "Experience: Job Title at Company"],
      "current_state_snapshot": "What the résumé currently says (or doesn't say) about this",
      "target_state": "What it should say to close this gap",
      "vault_evidence": "Any Career Vault data that could help, or null",
      "why_it_matters": "Why this gap specifically hurts their chances for this job"
    }
  ],
  "prioritized_gap_ids": ["gap_1", "gap_2", "gap_3"],
  "score_improvement_potential": {
    "if_gaps_fixed": 85,
    "highest_impact_gap": "gap_1"
  }
}`;

// ============================================================================
// GAP SUGGESTION PROMPT - Generate editable suggestions
// ============================================================================

export const GAP_SUGGESTION_USER_PROMPT = (
  jobBlueprint: object,
  candidateProfile: object,
  gaps: object[]
) => `
Generate 2-3 plausible example bullets for each gap that the user can edit to match their real experience.

## INPUTS:

**Job Blueprint:**
${JSON.stringify(jobBlueprint, null, 2)}

**Candidate Career Vault:**
${JSON.stringify(candidateProfile, null, 2)}

**Gaps to Address:**
${JSON.stringify(gaps, null, 2)}

## CRITICAL CONSTRAINTS:

1. **DO NOT invent** new employers, job titles, or obviously false achievements
2. **Infer typical responsibilities** based on the candidate's actual roles and industries
3. **Keep estimates conservative** - better to under-claim
4. **Every suggestion MUST include:**
   - Why this suggestion helps
   - The source (which vault data or role it's based on)
   - A disclaimer to verify accuracy
   - Interview questions they might face if they use this bullet

## OUTPUT FORMAT (JSON):

{
  "gap_suggestions": [
    {
      "gap_id": "gap_1",
      "gap_title": "string",
      "suggestions": [
        {
          "suggested_text": "The actual bullet point text",
          "why_this_helps": "How this addresses the gap and supports the job requirements",
          "source_basis": "Based on: Director role at Acme Corp, vault milestone #X",
          "confidence": "high | medium | low",
          "disclaimer": "DRAFT: Verify the scope/metrics match your actual experience before using",
          "interview_questions": [
            "Walk me through how you achieved this",
            "What specific tools/methods did you use?"
          ]
        }
      ]
    }
  ]
}`;

// ============================================================================
// SECTION REWRITE PROMPT - Integrate approved suggestions
// ============================================================================

export const SECTION_REWRITE_USER_PROMPT = (
  jobBlueprint: object,
  currentSectionText: string,
  approvedSuggestions: object[],
  sectionName: string
) => `
Rewrite this résumé section by integrating approved suggestions smoothly.

## INPUTS:

**Job Blueprint:**
${JSON.stringify(jobBlueprint, null, 2)}

**Section:** ${sectionName}

**Current Section Text:**
${currentSectionText}

**Approved Suggestions to Integrate:**
${JSON.stringify(approvedSuggestions, null, 2)}

## SECTION-SPECIFIC GUIDELINES:

${sectionName === 'Summary' ? `
**Professional Summary (3-4 sentences):**
- Lead with most impressive quantified achievement
- Position as the solution to employer's problem
- Weave keywords into narrative (don't list them)
- Show career progression and increasing responsibility
` : ''}

${sectionName === 'Highlights' ? `
**Key Highlights (4-6 bullets):**
- Each bullet addresses a different hiring manager priority
- Front-load with strongest achievements
- Include variety: leadership, technical, business impact
` : ''}

${sectionName.includes('Experience') ? `
**Work Experience (4-8 bullets per role):**
- Lead with outcomes, not responsibilities
- Quantify impact wherever possible
- Use strong action verbs
- Show progression within role if applicable
` : ''}

## OUTPUT FORMAT (JSON):

{
  "section_name": "${sectionName}",
  "rewritten_text": "The final polished section text",
  "changes_made": [
    {"from": "original phrase", "to": "improved phrase", "reason": "why"}
  ],
  "keywords_included": ["string"],
  "estimated_score_improvement": 5
}`;

// ============================================================================
// INLINE BULLET REWRITE PROMPT - Quick edits
// ============================================================================

export const INLINE_BULLET_REWRITE_USER_PROMPT = (
  jobBlueprint: object,
  originalBullet: string
) => `
Rewrite this single résumé bullet to better support this specific job.

## INPUTS:

**Job Blueprint (Key Requirements):**
${JSON.stringify(jobBlueprint, null, 2)}

**Original Bullet:**
${originalBullet}

## YOUR TASKS:

1. Rewrite to emphasize outcomes, metrics, or scope
2. Use language aligned with job requirements
3. Provide 2-3 variations for user choice
4. Preserve the original meaning - don't add new facts

## OUTPUT FORMAT (JSON):

{
  "original_bullet": "${originalBullet}",
  "rewrites": [
    {
      "version": "impact_focused",
      "text": "Rewritten version emphasizing business impact",
      "keywords_added": ["string"]
    },
    {
      "version": "concise",
      "text": "Shorter, punchier version",
      "keywords_added": ["string"]
    },
    {
      "version": "ats_optimized",
      "text": "Version with maximum ATS keyword density",
      "keywords_added": ["string"]
    }
  ],
  "recommendation": "impact_focused | concise | ats_optimized"
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get severity color for UI display
 */
export function getGapSeverityColor(severity: GapSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'important': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    case 'nice-to-have': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  }
}

/**
 * Get gap type icon and label for UI display
 */
export function getGapTypeInfo(gapType: GapType): { icon: string; label: string; description: string } {
  const info: Record<GapType, { icon: string; label: string; description: string }> = {
    'missing_skill_or_tool': {
      icon: '🔧',
      label: 'Missing Skill/Tool',
      description: 'A required skill or tool is not mentioned in your résumé'
    },
    'weak_achievement_story': {
      icon: '📖',
      label: 'Weak Achievement',
      description: 'You have the experience but need a more compelling narrative'
    },
    'missing_metrics_or_scope': {
      icon: '📊',
      label: 'Missing Metrics',
      description: 'Achievement lacks quantification or scope indicators'
    },
    'missing_domain_experience': {
      icon: '🏢',
      label: 'Domain Gap',
      description: 'Industry or domain-specific knowledge not demonstrated'
    },
    'unclear_level_or_seniority': {
      icon: '📈',
      label: 'Level Unclear',
      description: 'Résumé doesn\'t convey the right seniority for this role'
    },
    'positioning_issue': {
      icon: '🎯',
      label: 'Positioning Issue',
      description: 'You may appear over/under-qualified based on emphasis'
    }
  };
  return info[gapType];
}

/**
 * Get confidence badge for suggestions
 */
export function getConfidenceInfo(confidence: ConfidenceLevel): { color: string; label: string; icon: string } {
  switch (confidence) {
    case 'high':
      return { color: 'text-green-500', label: 'High Confidence', icon: '✓' };
    case 'medium':
      return { color: 'text-amber-500', label: 'Medium Confidence', icon: '~' };
    case 'low':
      return { color: 'text-red-500', label: 'Needs Verification', icon: '?' };
  }
}
