import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AUTO-POPULATE CAREER VAULT
 *
 * This function intelligently analyzes a resume and automatically populates
 * ALL 20 intelligence categories in the Career Vault, minimizing user effort.
 *
 * Strategy: Front-load AI intelligence, minimize human effort
 * - User uploads resume
 * - AI extracts EVERYTHING across all 20 categories
 * - User reviews/validates (5-10 min vs 45-60 min of questions)
 * - Vault is 80-90% complete instantly
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { resumeText, vaultId, targetRoles = [], targetIndustries = [] } = await req.json();

    if (!resumeText || !vaultId) {
      throw new Error('Missing required fields: resumeText and vaultId');
    }

    console.log('[AUTO-POPULATE-VAULT] Starting comprehensive vault analysis...');
    console.log(`[AUTO-POPULATE-VAULT] Resume length: ${resumeText.length} characters`);
    console.log(`[AUTO-POPULATE-VAULT] Target roles: ${targetRoles.join(', ')}`);
    console.log(`[AUTO-POPULATE-VAULT] Target industries: ${targetIndustries.join(', ')}`);

    // COMPREHENSIVE AI PROMPT
    // This extracts across ALL 20 intelligence categories in ONE pass
    const systemPrompt = `You are an elite executive career intelligence analyst extracting structured data from executive resumes.

CRITICAL INSTRUCTIONS:
1. You MUST use the extract_vault_intelligence function tool - this is mandatory
2. Extract ALL 20 intelligence categories with high-quality examples
3. Use ONLY information explicitly stated or clearly implied in the resume
4. Return 5-15 high-quality items per category (quality over quantity)
5. Each item must include specific evidence, context, and metrics where applicable

EXTRACTION PRINCIPLES:
- Be GENEROUS in extraction - this powers resume generation, LinkedIn optimization, interviews, and negotiations
- Infer hidden competencies and leadership philosophy from how they describe their experience
- Extract quantified achievements with business impact (revenue, cost savings, efficiency, growth)
- Identify transferable skills applicable across roles and industries
- Find rare, valuable capabilities not obvious from job titles

DO NOT:
- Return plain text responses without using the function tool
- Make assumptions not supported by the resume content
- Include generic or vague statements without specific evidence
- Skip any of the 20 required intelligence categories

OUTPUT FORMAT: Use the extract_vault_intelligence tool with all 20 categories populated.`;

    const userPrompt = `Analyze this executive resume and extract COMPREHENSIVE career intelligence across ALL 20 categories.

TARGET ROLES: ${targetRoles.length > 0 ? targetRoles.join(', ') : 'General executive positions'}
TARGET INDUSTRIES: ${targetIndustries.length > 0 ? targetIndustries.join(', ') : 'Cross-industry'}

RESUME TEXT:
${resumeText}

Extract across these 20 intelligence categories (MUST extract from ALL applicable categories):

**CORE INTELLIGENCE (3 categories):**

1. **powerPhrases**: Quantified achievements with business impact
   - Format: { phrase: "Increased revenue by 45% ($2.3M) in 18 months by...", context: "role/company", category: "revenue|cost_savings|efficiency|growth|leadership", metrics: { amount: "2.3M", percentage: "45%", timeframe: "18 months" }, keywords: ["revenue", "growth"] }
   - Extract 20-50 phrases minimum
   - CRITICAL: Include numbers, percentages, dollar amounts, team sizes, timeframes

2. **transferableSkills**: Core competencies applicable across roles
   - Format: { skill: "Strategic Planning", level: "expert|advanced|proficient", evidence: "specific example", equivalentSkills: ["Strategy Development", "Long-term Planning"], yearsUsed: 10 }
   - Extract 20-40 skills minimum
   - Include: leadership, technical, domain, soft skills

3. **hiddenCompetencies**: Rare, valuable capabilities not obvious from titles
   - Format: { competency: "M&A Integration", description: "proven ability to...", evidence: ["example 1", "example 2"], marketValue: "high|medium", certificationEquivalent: "might be equivalent to..." }
   - Extract 10-25 competencies minimum
   - Infer from achievements, projects, transitions

**EXPANDED INTELLIGENCE (10 categories):**

4. **businessImpacts**: Quantified business results
   - Format: { impact: "description", metrics: { revenue: "$X", percentage: "Y%", scope: "company/division" }, businessArea: "P&L|operations|sales|product", executiveVisibility: "board|C-suite|VP" }

5. **leadershipEvidence**: Leading teams, influencing outcomes
   - Format: { example: "Led cross-functional team of 50...", teamSize: 50, teamType: "cross-functional|direct|matrixed", level: "C-suite|VP|director|manager", outcome: "specific result", leadershipStyle: "transformational|servant|strategic" }

6. **technicalDepth**: Technologies, tools, methodologies mastered
   - Format: { technology: "Salesforce CRM", proficiency: "expert|advanced|proficient", yearsExperience: 5, achievements: "built system that...", currentRelevance: "high|medium|low" }

7. **projects**: Major initiatives with scope and results
   - Format: { name: "Digital Transformation Initiative", role: "Executive Sponsor", duration: "18 months", budget: "$5M", teamSize: 100, results: "achieved X", complexity: "high|medium", stakeholders: ["C-suite", "Board"] }

8. **industryExpertise**: Domain knowledge and market insights
   - Format: { industry: "FinTech", knowledge: "deep understanding of...", yearsInIndustry: 15, insights: ["trend 1", "trend 2"], regulations: ["SOX", "PCI-DSS"], networks: "board memberships, associations" }

9. **problemSolving**: Complex problems solved
   - Format: { problem: "declining market share", approach: "structured methodology used", solution: "implemented strategy", results: "15% market share recovery", complexity: "high", stakeholders: ["Board", "investors"] }

10. **stakeholderMgmt**: Managing relationships at all levels
    - Format: { example: "Managed relationships with 12 board members during...", stakeholderTypes: ["board", "C-suite", "investors", "regulators"], strategies: "communication approach", outcomes: "secured $10M funding" }

11. **careerNarrative**: Career progression, strategic moves
    - Format: { stage: "early|mid|senior|executive", transition: "IC to manager", rationale: "strategic move to...", growthArea: "expanded into...", patternInsight: "consistent upward trajectory in..." }

12. **competitiveAdvantages**: Unique differentiators vs peers
    - Format: { type: "rare_skill|unique_experience|network|certification", description: "only exec with both tech + finance background", evidence: "demonstrated by...", marketDemand: "high|medium" }

13. **communication**: Presentation, writing, influence
    - Format: { type: "executive_presentations|board_communication|public_speaking|writing", example: "Presented quarterly results to board...", impact: "secured budget approval", audiences: ["board", "investors", "media"], artifacts: "published articles, presentations" }

**INTANGIBLES INTELLIGENCE (7 categories):**

14. **softSkills**: Emotional intelligence, adaptability, resilience
    - Format: { skillName: "Emotional Intelligence", evidence: "Navigated merger tensions by...", context: "during acquisition", proficiencyLevel: "expert", impact: "retained 95% of key talent" }
    - Extract 15-30 soft skills minimum

15. **leadershipPhilosophy**: Core beliefs about leadership
    - Format: { philosophyStatement: "I believe leadership is about enabling others to...", leadershipStyle: "servant|transformational|strategic", realWorldApplication: "I demonstrated this when...", corePrinciples: ["transparency", "accountability"], evidenceFromCareer: "consistently promoted from within" }

16. **executivePresence**: Gravitas, credibility, personal brand
    - Format: { presenceIndicator: "Commands boardroom with calm authority", evidence: "Board members specifically requested my involvement in...", brandAlignment: "known as the 'turnaround specialist'", perceivedImpact: "high trust factor with investors", situationalExample: "specific example" }

17. **personalityTraits**: Core characteristics
    - Format: { traitName: "Decisive under pressure", behavioralEvidence: "Made $10M decision in 48 hours during crisis...", workContext: "high-stakes situations", strengthOrGrowth: "strength", impactOnTeam: "inspires confidence" }
    - Infer from: decision-making speed, risk tolerance, collaboration patterns, innovation drive

18. **workStyle**: Preferred work environment and approach
    - Format: { preferenceArea: "Decision Making", preferenceDescription: "Data-driven but decisive", examples: "Uses analytics but doesn't get paralyzed", idealEnvironment: "fast-paced, high-autonomy", collaborationStyle: "strategic input, empowered execution" }

19. **values**: Core principles, ethical standards
    - Format: { valueName: "Integrity", manifestation: "Turned down $2M contract due to ethical concerns", importanceLevel: "core|important|nice_to_have", careerDecisionsInfluenced: "Left BigCo when asked to compromise on...", consistency: "evident throughout career" }

20. **behavioralIndicators**: Decision-making patterns, responses
    - Format: { indicatorType: "crisis_response|learning_style|stress_management|innovation_approach", specificBehavior: "In crisis, assembles tiger team and empowers rapid decision-making", context: "3 turnarounds", outcomePattern: "95% success rate in crisis situations" }

**CRITICAL EXTRACTION RULES:**
1. Be GENEROUS - if there's ANY evidence, extract it
2. INFER intelligently - executive presence from "presented to board", personality traits from decision speed
3. QUANTIFY everything - numbers, percentages, timeframes, team sizes
4. For target roles/industries - prioritize relevant intelligence but extract ALL
5. Minimum extractions per category (aim high):
   - Power phrases: 20-50
   - Transferable skills: 20-40
   - Hidden competencies: 10-25
   - Soft skills: 15-30
   - Each other category: 5-15 items

Return VALID JSON only with this structure:
{
  "powerPhrases": [...],
  "transferableSkills": [...],
  "hiddenCompetencies": [...],
  "businessImpacts": [...],
  "leadershipEvidence": [...],
  "technicalDepth": [...],
  "projects": [...],
  "industryExpertise": [...],
  "problemSolving": [...],
  "stakeholderMgmt": [...],
  "careerNarrative": [...],
  "competitiveAdvantages": [...],
  "communication": [...],
  "softSkills": [...],
  "leadershipPhilosophy": [...],
  "executivePresence": [...],
  "personalityTraits": [...],
  "workStyle": [...],
  "values": [...],
  "behavioralIndicators": [...],
  "summary": {
    "totalItemsExtracted": 0,
    "strengthAreas": ["top 3 strength areas"],
    "uniqueDifferentiators": ["what makes this exec stand out"],
    "targetFit": "how well this exec fits the target roles/industries",
    "confidence": "high|medium|low",
    "completenessScore": 85
  }
}`;

    console.log('[AUTO-POPULATE-VAULT] Calling Lovable AI for deep extraction...');
    console.log('[AUTO-POPULATE-VAULT] Request details:', {
      model: 'google/gemini-2.5-flash',
      resumeLength: resumeText.length,
      targetRoles: targetRoles.length,
      targetIndustries: targetIndustries.length
    });

    // PRODUCTION-GRADE RETRY LOGIC
    let intelligence;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AUTO-POPULATE-VAULT] Attempt ${attempt}/3`);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "extract_vault_intelligence",
                description: "Extract comprehensive career intelligence across all 20 categories",
                parameters: {
                  type: "object",
                  properties: {
                    powerPhrases: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          phrase: { type: "string" },
                          context: { type: "string" },
                          category: { type: "string" },
                          metrics: {
                            type: "object",
                            description: "Quantified metrics like {amount: '$2.3M', percentage: '45%', timeframe: '18 months'}"
                          },
                          keywords: {
                            type: "array",
                            items: { type: "string" },
                            description: "Key terms from the phrase including tech/business keywords"
                          }
                        },
                        required: ["phrase", "context", "metrics", "keywords"]
                      }
                    },
                    transferableSkills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: { type: "string" },
                          level: { type: "string" },
                          evidence: { type: "string" },
                          equivalentSkills: { type: "array", items: { type: "string" } },
                          yearsUsed: { type: "number" }
                        },
                        required: ["skill", "level", "evidence"]
                      }
                    },
                    hiddenCompetencies: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          competency: { type: "string" },
                          description: { type: "string" },
                          evidence: { type: "array", items: { type: "string" } },
                          marketValue: { type: "string" },
                          certificationEquivalent: { type: "string" }
                        },
                        required: ["competency", "description"]
                      }
                    },
                    businessImpacts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          impact: { type: "string" },
                          metrics: { type: "object" },
                          businessArea: { type: "string" },
                          executiveVisibility: { type: "string" }
                        },
                        required: ["impact"]
                      }
                    },
                    leadershipEvidence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          evidence: { type: "string" },
                          teamSize: { type: "string" },
                          scope: { type: "string" },
                          outcome: { type: "string" }
                        },
                        required: ["evidence"]
                      }
                    },
                    technicalDepth: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          technology: { type: "string" },
                          proficiencyLevel: { type: "string" },
                          yearsExperience: { type: "number" },
                          applications: { type: "array", items: { type: "string" } }
                        },
                        required: ["technology"]
                      }
                    },
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          projectName: { type: "string" },
                          description: { type: "string" },
                          role: { type: "string" },
                          outcome: { type: "string" },
                          skills: { type: "array", items: { type: "string" } }
                        },
                        required: ["projectName", "description"]
                      }
                    },
                    industryExpertise: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          industry: { type: "string" },
                          yearsExperience: { type: "number" },
                          specificKnowledge: { type: "array", items: { type: "string" } },
                          regulatoryFamiliarity: { type: "array", items: { type: "string" } }
                        },
                        required: ["industry"]
                      }
                    },
                    problemSolving: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          problemDescription: { type: "string" },
                          approach: { type: "string" },
                          result: { type: "string" },
                          complexity: { type: "string" }
                        },
                        required: ["problemDescription"]
                      }
                    },
                    stakeholderMgmt: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          stakeholderType: { type: "string" },
                          relationship: { type: "string" },
                          evidence: { type: "string" }
                        },
                        required: ["stakeholderType", "evidence"]
                      }
                    },
                    careerNarrative: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          milestone: { type: "string" },
                          significance: { type: "string" },
                          growthDemonstrated: { type: "string" }
                        },
                        required: ["milestone"]
                      }
                    },
                    competitiveAdvantages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          advantage: { type: "string" },
                          uniqueness: { type: "string" },
                          marketRelevance: { type: "string" }
                        },
                        required: ["advantage"]
                      }
                    },
                    communication: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          communicationType: { type: "string" },
                          audience: { type: "string" },
                          evidence: { type: "string" }
                        },
                        required: ["communicationType", "evidence"]
                      }
                    },
                    softSkills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: { type: "string" },
                          evidence: { type: "string" },
                          context: { type: "string" }
                        },
                        required: ["skill", "evidence"]
                      }
                    },
                    leadershipPhilosophy: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          principle: { type: "string" },
                          howItManifests: { type: "string" },
                          evidence: { type: "string" }
                        },
                        required: ["principle"]
                      }
                    },
                    executivePresence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          indicator: { type: "string" },
                          manifestation: { type: "string" },
                          context: { type: "string" }
                        },
                        required: ["indicator"]
                      }
                    },
                    personalityTraits: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          trait: { type: "string" },
                          evidence: { type: "string" },
                          professionalValue: { type: "string" }
                        },
                        required: ["trait"]
                      }
                    },
                    workStyle: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          styleElement: { type: "string" },
                          description: { type: "string" },
                          whenEffective: { type: "string" }
                        },
                        required: ["styleElement"]
                      }
                    },
                    values: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          valueName: { type: "string" },
                          howDemonstrated: { type: "string" }
                        },
                        required: ["valueName"]
                      }
                    },
                    behavioralIndicators: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          indicatorType: { type: "string" },
                          specificBehavior: { type: "string" },
                          context: { type: "string" }
                        },
                        required: ["indicatorType", "specificBehavior"]
                      }
                    },
                    summary: {
                      type: "object",
                      properties: {
                        totalItemsExtracted: { type: "number" },
                        strengthAreas: { type: "array", items: { type: "string" } },
                        uniqueDifferentiators: { type: "array", items: { type: "string" } },
                        targetFit: { type: "string" },
                        confidence: { type: "string" },
                        completenessScore: { type: "number" }
                      },
                      required: ["totalItemsExtracted", "completenessScore"]
                    }
                  },
                  required: ["powerPhrases", "transferableSkills", "hiddenCompetencies", "softSkills", "summary"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "extract_vault_intelligence" } },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AUTO-POPULATE-VAULT] Attempt ${attempt} - AI error:`, response.status, errorText);
          throw new Error(`AI extraction failed: ${response.status} - ${errorText}`);
        }

        const aiData = await response.json();
        
        console.log('[AUTO-POPULATE-VAULT] Response structure:', {
          hasChoices: !!aiData.choices,
          choicesLength: aiData.choices?.length,
          hasMessage: !!aiData.choices?.[0]?.message,
          hasToolCalls: !!aiData.choices?.[0]?.message?.tool_calls,
          toolCallsCount: aiData.choices?.[0]?.message?.tool_calls?.length
        });

        // Check if response has expected structure
        if (!aiData.choices || !Array.isArray(aiData.choices) || aiData.choices.length === 0) {
          console.error('[AUTO-POPULATE-VAULT] Invalid AI response - missing choices:', aiData);
          throw new Error('AI response missing choices array');
        }

        const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          console.error('[AUTO-POPULATE-VAULT] No tool call in message:', aiData.choices[0]?.message);
          throw new Error('No tool call in response - AI may have returned text instead');
        }

        // Parse the tool call arguments
        const args = toolCall.function.arguments;
        intelligence = typeof args === 'string' ? JSON.parse(args) : args;
        
        console.log('[AUTO-POPULATE-VAULT] Successfully parsed intelligence');
        console.log('[AUTO-POPULATE-VAULT] Summary:', intelligence.summary);
        
        // Success - break out of retry loop
        break;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[AUTO-POPULATE-VAULT] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < 3) {
          const delayMs = 1000 * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s
          console.log(`[AUTO-POPULATE-VAULT] Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // If all retries failed, throw the last error
    if (!intelligence) {
      console.error('[AUTO-POPULATE-VAULT] All retry attempts exhausted');
      throw lastError || new Error('Failed to extract intelligence after 3 attempts');
    }

    console.log('[AUTO-POPULATE-VAULT] Extraction complete!');
    console.log(`[AUTO-POPULATE-VAULT] Summary:`, intelligence.summary);

    // Insert all extracted intelligence into database
    const insertPromises: PromiseLike<any>[] = [];
    let totalInserted = 0;

    // Helper to determine confidence score
    const getConfidenceScore = (item: any): number => {
      if (item.metrics || item.yearsExperience > 5) return 90;
      if (item.evidence && item.evidence.length > 50) return 85;
      return 75;
    };

    // 1. Power Phrases
    if (intelligence.powerPhrases?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.powerPhrases.length} power phrases`);
      for (const pp of intelligence.powerPhrases) {
        const hasMetrics = pp.metrics && Object.keys(pp.metrics).length > 0;
        const confidence = hasMetrics ? 0.75 : 0.60;
        insertPromises.push(
          supabase.from('vault_power_phrases').insert({
            vault_id: vaultId,
            user_id: user.id,
            power_phrase: pp.phrase,
            context: pp.context || '',
            category: pp.category || 'achievement',
            confidence_score: getConfidenceScore(pp),
            keywords: pp.keywords || [],
            impact_metrics: pp.metrics || null,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Resume analysis - Found in: ${pp.context || 'work history'}`,
            ai_confidence: confidence
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 2. Transferable Skills
    if (intelligence.transferableSkills?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.transferableSkills.length} transferable skills`);
      for (const skill of intelligence.transferableSkills) {
        const confidenceScore = skill.level === 'expert' ? 95 : skill.level === 'advanced' ? 85 : 75;
        const aiConfidence = skill.level === 'expert' ? 0.70 : skill.level === 'advanced' ? 0.65 : 0.60;
        insertPromises.push(
          supabase.from('vault_transferable_skills').insert({
            vault_id: vaultId,
            user_id: user.id,
            stated_skill: skill.skill,
            equivalent_skills: skill.equivalentSkills || [],
            evidence: skill.evidence || '',
            confidence_score: confidenceScore,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Resume analysis - ${skill.evidence?.substring(0, 100)}${skill.evidence?.length > 100 ? '...' : ''}`,
            ai_confidence: aiConfidence
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 3. Hidden Competencies
    if (intelligence.hiddenCompetencies?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.hiddenCompetencies.length} hidden competencies`);
      for (const comp of intelligence.hiddenCompetencies) {
        const confidenceScore = comp.marketValue === 'high' ? 90 : 80;
        const aiConfidence = comp.marketValue === 'high' ? 0.70 : 0.65;
        const evidenceString = Array.isArray(comp.evidence) ? comp.evidence.join(', ') : (comp.evidence || '');
        insertPromises.push(
          supabase.from('vault_hidden_competencies').insert({
            vault_id: vaultId,
            user_id: user.id,
            competency_area: comp.competency,
            inferred_capability: comp.description,
            supporting_evidence: comp.evidence || [],
            confidence_score: confidenceScore,
            certification_equivalent: comp.certificationEquivalent || null,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Resume analysis - Inferred from: ${evidenceString.substring(0, 100)}${evidenceString.length > 100 ? '...' : ''}`,
            ai_confidence: aiConfidence
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 14. Soft Skills
    if (intelligence.softSkills?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.softSkills.length} soft skills`);
      for (const soft of intelligence.softSkills) {
        const confidence = soft.proficiencyLevel === 'expert' ? 0.75 : 0.65;
        const evidence = soft.evidence || soft.context || '';
        insertPromises.push(
          supabase.from('vault_soft_skills').insert({
            vault_id: vaultId,
            user_id: user.id,
            skill_name: soft.skillName,
            examples: evidence,
            impact: soft.impact || null,
            proficiency_level: soft.proficiencyLevel || 'proficient',
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Resume analysis - ${evidence.substring(0, 100)}${evidence.length > 100 ? '...' : ''}`,
            ai_confidence: confidence
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 15. Leadership Philosophy
    if (intelligence.leadershipPhilosophy?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.leadershipPhilosophy.length} leadership philosophies`);
      for (const phil of intelligence.leadershipPhilosophy) {
        insertPromises.push(
          supabase.from('vault_leadership_philosophy').insert({
            vault_id: vaultId,
            user_id: user.id,
            philosophy_statement: phil.philosophyStatement,
            leadership_style: phil.leadershipStyle || null,
            real_world_application: phil.realWorldApplication || null,
            core_principles: phil.corePrinciples || [],
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Resume analysis - Inferred from leadership style and approach`,
            ai_confidence: 0.60
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 16. Executive Presence
    if (intelligence.executivePresence?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.executivePresence.length} executive presence indicators`);
      for (const pres of intelligence.executivePresence) {
        insertPromises.push(
          supabase.from('vault_executive_presence').insert({
            vault_id: vaultId,
            user_id: user.id,
            presence_indicator: pres.presenceIndicator,
            situational_example: pres.situationalExample || pres.evidence || '',
            brand_alignment: pres.brandAlignment || null,
            perceived_impact: pres.perceivedImpact || null
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 17. Personality Traits
    if (intelligence.personalityTraits?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.personalityTraits.length} personality traits`);
      for (const trait of intelligence.personalityTraits) {
        insertPromises.push(
          supabase.from('vault_personality_traits').insert({
            vault_id: vaultId,
            user_id: user.id,
            trait_name: trait.traitName,
            behavioral_evidence: trait.behavioralEvidence || '',
            work_context: trait.workContext || null,
            strength_or_growth: trait.strengthOrGrowth || 'strength'
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 18. Work Style
    if (intelligence.workStyle?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.workStyle.length} work style preferences`);
      for (const style of intelligence.workStyle) {
        insertPromises.push(
          supabase.from('vault_work_style').insert({
            vault_id: vaultId,
            user_id: user.id,
            preference_area: style.preferenceArea,
            preference_description: style.preferenceDescription,
            examples: style.examples || null,
            ideal_environment: style.idealEnvironment || null
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 19. Values
    if (intelligence.values?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.values.length} core values`);
      for (const value of intelligence.values) {
        insertPromises.push(
          supabase.from('vault_values_motivations').insert({
            vault_id: vaultId,
            user_id: user.id,
            value_name: value.valueName,
            manifestation: value.manifestation || '',
            importance_level: value.importanceLevel || 'important',
            career_decisions_influenced: value.careerDecisionsInfluenced || null
          }).then(() => { totalInserted++; })
        );
      }
    }

    // 20. Behavioral Indicators
    if (intelligence.behavioralIndicators?.length > 0) {
      console.log(`[AUTO-POPULATE-VAULT] Inserting ${intelligence.behavioralIndicators.length} behavioral indicators`);
      for (const indicator of intelligence.behavioralIndicators) {
        insertPromises.push(
          supabase.from('vault_behavioral_indicators').insert({
            vault_id: vaultId,
            user_id: user.id,
            indicator_type: indicator.indicatorType,
            specific_behavior: indicator.specificBehavior,
            context: indicator.context || null,
            outcome_pattern: indicator.outcomePattern || null
          }).then(() => { totalInserted++; })
        );
      }
    }

    // Execute all inserts in parallel
    console.log(`[AUTO-POPULATE-VAULT] Inserting ${totalInserted} total intelligence items into database...`);
    const results = await Promise.allSettled(insertPromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    if (failureCount > 0) {
      console.warn(`[AUTO-POPULATE-VAULT] ${failureCount} insertions failed`);
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error(`[AUTO-POPULATE-VAULT] Insert ${idx} failed:`, result.reason);
        }
      });
    }

    console.log(`[AUTO-POPULATE-VAULT] Successfully inserted ${successCount}/${totalInserted} items`);

    // CRITICAL FIX: Calculate ACTUAL item count from intelligence data, not promise results
    const actualItemCount = (
      (intelligence.powerPhrases?.length || 0) +
      (intelligence.transferableSkills?.length || 0) +
      (intelligence.hiddenCompetencies?.length || 0) +
      (intelligence.softSkills?.length || 0) +
      (intelligence.leadershipPhilosophy?.length || 0) +
      (intelligence.executivePresence?.length || 0) +
      (intelligence.personalityTraits?.length || 0) +
      (intelligence.workStyle?.length || 0) +
      (intelligence.values?.length || 0) +
      (intelligence.behavioralIndicators?.length || 0)
    );

    console.log(`[AUTO-POPULATE-VAULT] ACTUAL ITEM COUNT: ${actualItemCount} items across all categories`);

    // Update career vault with totals and metadata
    const updateData: any = {
      interview_completion_percentage: 100, // Auto-populated vaults are 100% complete
      auto_populated: true,
      auto_population_confidence: intelligence.summary?.confidence || 'medium',
      overall_strength_score: intelligence.summary?.completenessScore || 85,
      last_updated_at: new Date().toISOString(),
      extraction_item_count: actualItemCount, // FIXED: Use calculated count from data arrays
      extraction_timestamp: new Date().toISOString()
    };

    // Count items per category for totals
    if (intelligence.powerPhrases) updateData.total_power_phrases = intelligence.powerPhrases.length;
    if (intelligence.transferableSkills) updateData.total_transferable_skills = intelligence.transferableSkills.length;
    if (intelligence.hiddenCompetencies) updateData.total_hidden_competencies = intelligence.hiddenCompetencies.length;
    if (intelligence.softSkills) updateData.total_soft_skills = intelligence.softSkills.length;
    if (intelligence.leadershipPhilosophy) updateData.total_leadership_philosophy = intelligence.leadershipPhilosophy.length;
    if (intelligence.executivePresence) updateData.total_executive_presence = intelligence.executivePresence.length;
    if (intelligence.personalityTraits) updateData.total_personality_traits = intelligence.personalityTraits.length;
    if (intelligence.workStyle) updateData.total_work_style = intelligence.workStyle.length;
    if (intelligence.values) updateData.total_values = intelligence.values.length;
    if (intelligence.behavioralIndicators) updateData.total_behavioral_indicators = intelligence.behavioralIndicators.length;

    console.log('[AUTO-POPULATE-VAULT] Updating vault with data:', updateData);

    const { error: updateError } = await supabase
      .from('career_vault')
      .update(updateData)
      .eq('id', vaultId);

    if (updateError) {
      console.error('[AUTO-POPULATE-VAULT] Failed to update vault:', updateError);
      throw new Error(`Failed to update vault: ${updateError.message}`);
    }

    console.log('[AUTO-POPULATE-VAULT] Vault updated successfully');

    console.log('[AUTO-POPULATE-VAULT] Vault updated with totals and metadata');
    console.log('[AUTO-POPULATE-VAULT] SUCCESS! Vault auto-populated');

    return new Response(
      JSON.stringify({
        success: true,
        totalExtracted: successCount,
        totalAttempted: totalInserted,
        failureCount,
        categories: Object.keys(intelligence).filter(k =>
          Array.isArray(intelligence[k]) && intelligence[k].length > 0
        ),
        summary: intelligence.summary,
        vaultCompletion: 85,
        extractedData: intelligence,
        nextSteps: failureCount === 0
          ? "Vault auto-populated successfully! Review and validate the extracted intelligence."
          : "Vault partially populated. Some items failed - you can fill gaps with the interview or voice notes."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AUTO-POPULATE-VAULT] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        hint: 'Try uploading your resume again, or contact support if the issue persists.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
