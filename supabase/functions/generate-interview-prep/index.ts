import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractArray } from '../_shared/json-parser.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('generate-interview-prep');

// Response validation schema
const InterviewQuestionSchema = z.object({
  id: z.string(),
  category: z.enum(['behavioral', 'technical', 'situational', 'leadership']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question: z.string(),
  context: z.string(),
  tips: z.array(z.string()),
  vaultSuggestions: z.array(z.string()).optional(),
  starFramework: z.object({
    situation: z.string(),
    task: z.string(),
    action: z.string(),
    result: z.string()
  }).optional()
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
    const { resumeContent, jobTitle, jobDescription, vaultIntelligence } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    logger.info('Starting interview prep generation', { 
      userId: user.id, 
      hasVault: !!vaultIntelligence 
    });

    const prompt = `You are an expert executive career coach specializing in interview preparation. Generate a comprehensive set of interview questions based on:

RESUME CONTENT:
${resumeContent}

JOB DETAILS:
- Title: ${jobTitle || 'Not specified'}
- Description: ${jobDescription}

${vaultIntelligence ? `
CAREER VAULT INTELLIGENCE:
The candidate has the following verified strengths in their vault:

Power Phrases:
${vaultIntelligence.powerPhrases?.slice(0, 5).map((p: any) => `- ${p.power_phrase || p.phrase}`).join('\n') || 'None'}

Key Competencies:
${vaultIntelligence.competencies?.slice(0, 5).map((c: any) => `- ${c.competency_area || c.inferred_capability}`).join('\n') || 'None'}

Soft Skills:
${vaultIntelligence.softSkills?.slice(0, 5).map((s: any) => `- ${s.skill_name}`).join('\n') || 'None'}

Personality Traits:
${vaultIntelligence.personalityTraits?.slice(0, 3).map((t: any) => `- ${t.trait_name}`).join('\n') || 'None'}

Use these vault items to generate more personalized questions and suggest STAR story answers.
` : ''}

Generate 8-10 interview questions that:
1. Mix behavioral, technical, situational, and leadership questions
2. Are specifically tailored to the candidate's experience and the target role
3. Vary in difficulty (easy, medium, hard)
4. Cover key competencies mentioned in the job description
${vaultIntelligence ? '5. Leverage the verified vault intelligence to suggest specific examples from their career' : ''}

For each question, provide:
- category: behavioral | technical | situational | leadership
- difficulty: easy | medium | hard
- question: The actual interview question
- context: Why this question is being asked (1-2 sentences)
- tips: Array of 3-4 specific tips for answering this question effectively
${vaultIntelligence ? '- vaultSuggestions: Array of specific vault items (power phrases, competencies) the candidate can reference in their answer' : ''}
- starFramework (optional, for behavioral/situational questions):
  - situation: Guidance on what situation details to include
  - task: What task/responsibility to clarify
  - action: What actions to emphasize
  - result: What results/metrics to highlight

CRITICAL REQUIREMENTS:
- Questions should reflect actual interview scenarios for this role level
- Mix expected questions with curveball questions
- Include questions that test both hard skills and soft skills
- Ensure questions allow candidate to showcase resume achievements
- Make questions specific to the industry and role
${vaultIntelligence ? '- When suggesting answers, reference specific vault items to make them more concrete' : ''}

Return as JSON array with this structure:
[
  {
    "id": "1",
    "category": "leadership",
    "difficulty": "hard",
    "question": "...",
    "context": "...",
    "tips": ["...", "...", "..."],
    ${vaultIntelligence ? '"vaultSuggestions": ["Power Phrase: Increased revenue by 40%", "Competency: Strategic planning"],' : ''}
    "starFramework": {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..."
    }
  }
]`;

    const { response, metrics } = await retryWithBackoff(
      async () => {
        const aiStartTime = Date.now();
        const result = await callPerplexity(
          {
            messages: [
              {
                role: 'system',
                content: 'You are an expert executive interview coach with 20+ years of experience preparing senior leaders for high-stakes interviews. You understand what hiring committees look for and how to position candidates effectively. Return valid JSON only.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            model: selectOptimalModel({
              taskType: 'generation',
              complexityLevel: 'medium',
              requiresCreativity: true,
              requiresReasoning: true
            }),
            temperature: 0.7,
            max_tokens: 2000,
            return_citations: false,
          },
          'generate-interview-prep',
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

    // Use robust array extraction with schema validation
    const questionsText = cleanCitations(response.choices[0].message.content);
    const extractResult = extractArray(questionsText, InterviewQuestionSchema);
    
    let questions;
    if (extractResult.success) {
      questions = extractResult.data;
      logger.info('Successfully validated interview questions', { count: questions.length });
    } else {
      logger.warn('Schema validation failed, using fallback parsing', {
        error: extractResult.error
      });
      // Fallback parsing with safe extraction
      const basicParseResult = extractJSON(questionsText);
      if (basicParseResult.success && Array.isArray(basicParseResult.data)) {
        questions = basicParseResult.data;
      } else {
        logger.error('Fallback parsing also failed', {
          error: basicParseResult.error
        });
        questions = [];
      }
    }

    logger.info('Interview prep generated successfully', {
      questionCount: questions.length,
      latencyMs: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({
        success: true,
        questions,
        metadata: {
          questionCount: questions.length,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const aiError = handlePerplexityError(error);
    logger.error('Interview prep generation failed', error, {
      code: aiError.code,
      retryable: aiError.retryable
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: aiError.userMessage,
        retryable: aiError.retryable
      }),
      {
        status: aiError.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
