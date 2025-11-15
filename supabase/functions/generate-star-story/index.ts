import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('generate-star-story');

const StarStorySchema = z.object({
  title: z.string(),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
  skills: z.array(z.string()),
  metrics: z.object({
    primaryMetric: z.string(),
    secondaryMetrics: z.array(z.string())
  }),
  industry: z.string(),
  timeframe: z.string(),
  vaultSourced: z.string().optional()
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { rawStory, action = 'generate' } = await req.json();

    logger.info('Starting STAR story generation', { 
      userId: user.id, 
      action, 
      hasRawStory: !!rawStory 
    });

    // Fetch Career Vault intelligence
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-vault-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.intelligence;
    
    if (intelligence) {
      logger.info('Career Vault loaded', {
        projects: intelligence.counts.projects,
        businessImpacts: intelligence.counts.businessImpacts,
        leadershipEvidence: intelligence.counts.leadershipExamples
      });
    }

    // Build Career Vault context
    let vaultContext = '';
    if (intelligence) {
      const projects = intelligence.projects.map((p: any) => 
        `- ${p.project_name}: ${p.role || 'Your role'} | ${p.outcome || p.impact || 'outcome'} | Duration: ${p.duration || 'timeframe'}`
      ).join('\n');

      const businessImpacts = intelligence.businessImpacts.slice(0, 10).map((b: any) => 
        `- ${b.metric_type}: ${b.metric_value} (${b.context || 'achievement'})`
      ).join('\n');

      const leadershipEvidence = intelligence.leadershipEvidence.map((l: any) => 
        `- ${l.evidence_type}: ${l.description} (team: ${l.team_size || 'N/A'}, stakeholders: ${l.stakeholder_types || 'N/A'})`
      ).join('\n');

      const powerPhrases = intelligence.powerPhrases.slice(0, 15).map((p: any) => 
        `"${p.phrase}"`
      ).join(', ');

      vaultContext = `
CAREER VAULT INTELLIGENCE (Ground Your Story in Real Achievements):

REAL PROJECTS (${intelligence.counts.projects} total):
${projects}

QUANTIFIED METRICS (${intelligence.counts.businessImpacts} verified):
${businessImpacts}

LEADERSHIP EVIDENCE (${intelligence.counts.leadershipExamples} examples):
${leadershipEvidence}

POWER PHRASES TO USE (${intelligence.counts.powerPhrases} proven):
${powerPhrases}

**STORY GENERATION MANDATE:**
1. If user's input mentions a project/initiative, check if it matches Career Vault projects - use verified details
2. Always incorporate quantified metrics from Business Impacts - these are REAL numbers, not estimates
3. Reference leadership evidence for team/stakeholder aspects
4. Use power phrases naturally in the narrative
5. Maintain consistency with verified career data

AVOID: Generic placeholders or estimated metrics when Career Vault has verified data
`;
    }

    let prompt = '';
    
    if (action === 'generate') {
      prompt = `ROLE: You are an executive interview coach who has prepared 500+ candidates for behavioral interviews at FAANG, Fortune 500, and executive roles.

USER'S RAW INPUT:
"${rawStory}"

${vaultContext}

TASK: Transform this into a compelling STAR method story that demonstrates executive presence and impact.

${intelligence ? `
**CRITICAL: Leverage Career Vault Intelligence:**
- If the input relates to any project in the Career Vault, use verified details (role, outcome, duration)
- Use exact quantified metrics from Business Impacts (don't estimate)
- Reference leadership evidence for team size and stakeholder management
- Incorporate power phrases naturally
- Ensure all metrics are grounded in verified Career Vault data
` : ''}

STAR FRAMEWORK - STRICT STRUCTURE:

✅ SITUATION (1-2 sentences, ~20-30 words)
PURPOSE: Set stage with just enough context
INCLUDE: Where, when, scale, stakes
${intelligence ? 'USE: Career Vault project context if applicable' : ''}
AVOID: Excessive background, rambling setup
EXAMPLE: "In Q3 2023, our SaaS platform faced 40% customer churn, threatening $2M in annual revenue and team morale."

✅ TASK (1-2 sentences, ~20-30 words)  
PURPOSE: Define YOUR specific responsibility
INCLUDE: Your role, what was assigned to you, success criteria
${intelligence ? 'USE: Career Vault project role if available' : ''}
AVOID: Team goals without your ownership, vague objectives
EXAMPLE: "As Product Lead, I was tasked with identifying root causes and implementing a retention strategy within 8 weeks."

✅ ACTION (2-3 sentences, ~50-70 words)
PURPOSE: Showcase your skills, decisions, and leadership
INCLUDE: Specific steps YOU took, skills used, challenges overcome
${intelligence ? 'USE: Leadership evidence from Career Vault (team size, stakeholder types), power phrases' : ''}
AVOID: "We did" language (use "I led", "I analyzed", "I implemented"), vague actions
EXAMPLE: "I conducted 25 customer interviews to identify pain points, then led a cross-functional team to redesign onboarding. I implemented a proactive customer success program with weekly check-ins and personalized training. When engineering pushback delayed features, I negotiated phased rollout to maintain momentum."

✅ RESULT (1-2 sentences, ~30-40 words)
PURPOSE: Prove measurable impact
INCLUDE: Specific metrics, percentages, dollar amounts, timelines
${intelligence ? 'USE: Exact metrics from Career Vault Business Impacts - these are VERIFIED numbers' : ''}
AVOID: Soft outcomes ("everyone was happy"), unmeasured claims
EXAMPLE: "Churn dropped to 12% within 3 months, saving $1.5M annually. Customer satisfaction scores rose from 6.8 to 8.9/10, and the program became company standard."

ENHANCEMENT RULES:
1. QUANTIFY EVERYTHING: Add numbers, percentages, dollar values, timeframes ${intelligence ? '(prioritize Career Vault verified metrics)' : ''}
2. USE ACTION VERBS: Led, designed, implemented, negotiated, analyzed (not "helped", "worked on")
3. SHOW OWNERSHIP: Emphasize "I" over "we" for interview impact
4. DEMONSTRATE SKILLS: Weave in relevant technical/soft skills naturally
5. PROVE IMPACT: Results must be concrete and measurable ${intelligence ? '(use Career Vault data)' : ''}

COMMON PITFALLS TO AVOID:
❌ Vague outcomes: "It went well" → ✅ "Increased revenue by 23%"
❌ Team language: "We built" → ✅ "I architected and led development"
❌ No metrics: "Improved performance" → ✅ "Reduced load time from 3s to 800ms"
❌ Weak actions: "Helped with" → ✅ "Spearheaded initiative that"
❌ Long-winded setup: Keep Situation tight, focus on Action/Result
${intelligence ? '❌ Generic metrics when Career Vault has verified data' : ''}

Generate a JSON response with this structure:
{
  "title": "Brief compelling title (5-8 words)",
  "situation": "...",
  "task": "...",
  "action": "...",
  "result": "...",
  "skills": ["skill1", "skill2", "skill3"],
  "metrics": {
    "primaryMetric": "X% increase/decrease in Y",
    "secondaryMetrics": ["Additional quantifiable results"]
  },
  "industry": "Industry context",
  "timeframe": "Duration or time period"${intelligence ? ',\n  "vaultSourced": "Brief note on which Career Vault data was used"' : ''}
}`;
    } else if (action === 'refine') {
      prompt = `ROLE: You are an executive interview coach refining a STAR story for maximum interview impact.

CURRENT STAR STORY:
"${rawStory}"

${vaultContext}

REFINEMENT GOALS:
1. SITUATION: Compress to essential context (20-30 words max)
   - Remove fluff, keep scale/stakes
   - Make it immediately clear why this mattered
   ${intelligence ? '- Add verified context from Career Vault projects if missing' : ''}

2. TASK: Sharpen YOUR ownership (20-30 words max)
   - Convert "we were asked" → "I was responsible for"
   - Make success criteria explicit
   ${intelligence ? '- Use Career Vault project role if available' : ''}

3. ACTION: Add specificity and leadership (50-70 words)
   - Replace vague verbs with strong action verbs
   - Quantify where possible (team size, timeline, resources)
   - Show decision-making and obstacle handling
   - Emphasize "I" over "we"
   ${intelligence ? '- Add leadership evidence from Career Vault (team size, stakeholder types)' : ''}
   ${intelligence ? '- Incorporate power phrases naturally' : ''}

4. RESULT: Maximize measurable impact (30-40 words)
   - Add hard metrics if missing
   - Show before/after comparison
   - Include secondary benefits if relevant
   ${intelligence ? '- Use verified metrics from Career Vault Business Impacts' : ''}

${intelligence ? `
**Career Vault Enhancement Strategy:**
- Check if this story relates to Career Vault projects - add verified details
- Replace estimated metrics with Career Vault verified data
- Add leadership evidence specifics (team sizes, stakeholder types)
- Incorporate power phrases for stronger language
` : ''}

QUALITY CHECKLIST:
✅ Every number/metric specific (not "significant" or "many")
✅ Action section shows problem-solving and leadership
✅ Result includes at least 2 quantified outcomes
✅ Word count within guidelines for each section
✅ Story flows naturally but hits all STAR beats
✅ Demonstrates skills relevant to target role
${intelligence ? '✅ Uses Career Vault verified data where available' : ''}

Return the same JSON structure with refined content.`;
    }

    const { response, metrics } = await retryWithBackoff(
      async () => {
        const aiStartTime = Date.now();
        const result = await callPerplexity(
          {
            messages: [
              { 
                role: 'system', 
                content: `You are an executive interview coach who transforms career achievements into compelling STAR method stories. Focus on quantifiable impact, executive presence, and clear ownership. ${intelligence ? 'Leverage Career Vault intelligence to ground stories in verified achievements.' : ''} Always respond with valid JSON matching the requested schema.` 
              },
              { role: 'user', content: prompt }
            ],
            model: selectOptimalModel({
              taskType: 'generation',
              complexity: 'medium',
              estimatedInputTokens: 1500,
              estimatedOutputTokens: 1500
            }),
            temperature: 0.7,
            max_tokens: 1500,
            return_citations: false,
          },
          'generate-star-story',
          user.id
        );

        logger.logAICall({
          model: result.metrics.model,
          inputTokens: result.metrics.input_tokens,
          outputTokens: result.metrics.output_tokens,
          latencyMs: Date.now() - aiStartTime,
          cost: result.metrics.cost_usd,
          success: true
        });

        return result;
      },
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);

    // Parse and validate JSON response
    const extractResult = extractJSON(content, StarStorySchema);
    
    if (!extractResult.success || !extractResult.data) {
      logger.error('Failed to extract STAR story JSON', { error: extractResult.error });
      throw new Error('No valid JSON found in response');
    }

    const starStory = extractResult.data;

    logger.info('STAR story generated successfully', {
      latencyMs: Date.now() - startTime,
      action,
      hasVaultData: !!intelligence
    });

    return new Response(
      JSON.stringify({ 
        starStory,
        vaultUsed: !!intelligence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const aiError = handlePerplexityError(error);
    logger.error('STAR story generation failed', error, {
      code: aiError.code,
      retryable: aiError.retryable
    });

    return new Response(
      JSON.stringify({ 
        error: aiError.userMessage,
        retryable: aiError.retryable
      }),
      {
        status: aiError.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
