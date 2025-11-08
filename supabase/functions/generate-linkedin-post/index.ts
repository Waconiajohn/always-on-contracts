import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('generate-linkedin-post');

const LinkedInPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  hashtags: z.array(z.string()),
  postType: z.string(),
  estimatedEngagement: z.string(),
  hookStrength: z.string(),
  improvementTips: z.array(z.string())
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
    const {
      topic, 
      tone, 
      postType, 
      targetAudience, 
      keyPoints, 
      userProfile,
      seriesId,
      partNumber,
      totalParts,
      focusStatement,
      seriesTitle 
    } = await req.json();

    logger.info('Starting LinkedIn post generation', { 
      topic, 
      tone, 
      postType,
      hasSeries: !!seriesId 
    });

    // Build series context if applicable
    let seriesContext = '';
    if (seriesId && partNumber && totalParts) {
      seriesContext = `
SERIES CONTEXT:
- This is Part ${partNumber} of ${totalParts} in series: "${seriesTitle || topic}"
- Focus for this part: ${focusStatement}
${partNumber > 1 ? `- Reference Part ${partNumber - 1} briefly if relevant (e.g., "In Part ${partNumber - 1}, we covered...")` : ''}
${partNumber < totalParts ? `- Tease Part ${partNumber + 1} subtly (e.g., "Next, we'll explore...")` : ''}

CRITICAL FOR SERIES POSTS:
- Keep to 240-260 words MAXIMUM
- Discuss ONLY ONE concept (the focus statement)
- Use conversational tone with contractions (you'll, we're, it's)
- Start with a PROBLEM/CHALLENGE that commonly occurs
- End with a specific question for readers
- NO jargon: avoid "utilize," "leverage," "synergy," "holistic," "implement"
- Use executive vocabulary: cost, margin, deadlines, systems, staff, results
- Acknowledge trade-offs and limitations (no universal solutions)
- Max 18 words per sentence
`;
    }

    // Elite LinkedIn content strategist persona
    const systemPrompt = `You are an elite LinkedIn content strategist with 15+ years of experience building executive thought leadership for Fortune 500 leaders.
${seriesContext}

CORE EXPERTISE:
- Viral content psychology and engagement mechanics
- LinkedIn algorithm optimization (2025 standards)
- Executive personal branding and storytelling
- Data-driven content frameworks

CONTENT FRAMEWORK (Hook → Value → Story → CTA):
1. HOOK (First 150 chars): Arrest scrolling with pattern interruption
   - Provocative question or bold statement
   - Contrarian perspective or surprising statistic
   - Personal vulnerability or "I was wrong about..."

2. VALUE DELIVERY (Body):
   - Lead with insights, not introductions
   - Use white space aggressively (1-2 sentence paragraphs)
   - Include 2-3 actionable takeaways
   - Quantify impact whenever possible

3. STORY ELEMENT:
   - Personal anecdote (authentic, vulnerable)
   - Client success transformation
   - Industry trend analysis with implications

4. CALL-TO-ACTION:
   - Engagement question (not generic "thoughts?")
   - Direct invitation to conversation
   - Value-add offer (resource, framework, connection)

TONE CALIBRATION:
- Professional: Authoritative but approachable, data-backed
- Conversational: Relatable storytelling, casual language
- Inspirational: Emotional connection, vision-focused
- Educational: Teaching frameworks, step-by-step insights

OUTPUT REQUIREMENTS:
- Thought Leadership: 800-1300 words (multi-paragraph deep dive)
- Short Post: 50-200 words (punchy, single insight)
- Industry Commentary: 400-700 words (trend analysis + implications)
- Personal Story: 300-600 words (narrative-driven with lesson)

ENGAGEMENT OPTIMIZATION:
- Use emojis strategically (1-3 max, avoid overuse)
- Include line breaks every 1-2 sentences
- Ask ONE specific question in CTA
- Hashtags: 3-5 relevant, mix popular + niche
- Tag format: #IndustryTerm NOT #random #spam

FORBIDDEN ELEMENTS:
- Generic openings ("I've been thinking about...")
- Clickbait without substance
- Excessive self-promotion
- Corporate jargon without translation
- More than 5 hashtags

${seriesId ? 'FOR SERIES POSTS: Every post MUST acknowledge a common failure/challenge. Use phrases like "this usually backfires," "teams struggle because," "I\'ve seen this fail when"' : ''}

Return JSON with:
{
  "title": "Brief post title/theme",
  "content": "Full LinkedIn post text with line breaks",
  "hashtags": ["Industry1", "Topic2", "Niche3"],
  "postType": "thought-leadership | short-post | industry-commentary | personal-story",
  "estimatedEngagement": "Predicted engagement level: low/medium/high/viral with reasoning",
  "hookStrength": "Score 1-10 with justification",
  "improvementTips": ["Tip 1", "Tip 2"]
}`;

    const userPrompt = `Generate a LinkedIn post with these parameters:

TOPIC: ${topic}
TONE: ${tone}
POST TYPE: ${postType}
TARGET AUDIENCE: ${targetAudience}
KEY POINTS TO COVER: ${keyPoints?.join(', ') || 'Use your expertise'}

${userProfile ? `
USER'S VAULT INTELLIGENCE (USE FOR AUTHENTICITY):

Leadership Philosophy:
${userProfile.leadershipPhilosophy ? `- ${userProfile.leadershipPhilosophy.philosophy_statement}
  LinkedIn Angle: ${userProfile.leadershipPhilosophy.linkedin_angle}
  Industry Fit: ${userProfile.leadershipPhilosophy.alignment_with_industry_norms}` : 'None'}

Top Soft Skill for Post:
${userProfile.topSoftSkill ? `- ${userProfile.topSoftSkill.skill_name}
  Post Type Suggestion: ${userProfile.topSoftSkill.linkedin_post_type || 'professional_insight'}
  Industry Relevance: ${JSON.stringify(userProfile.topSoftSkill.industry_relevance || {})}` : 'None'}

Executive Presence Signal:
${userProfile.executivePresence ? `- ${userProfile.executivePresence.presence_indicator}
  Credibility Boost: ${userProfile.executivePresence.linkedin_credibility_boost}
  Role Fit: ${userProfile.executivePresence.role_fit_assessment}` : 'None'}

Top Achievement to Reference:
${userProfile.topAchievement ? `- ${userProfile.topAchievement.power_phrase || userProfile.topAchievement.phrase}` : 'None'}

CRITICAL: Use these REAL, VERIFIED vault items to create authentic content. Don't make up generic examples - reference their actual leadership philosophy, achievements, and presence indicators.
` : ''}

Apply the content framework rigorously. Optimize for LinkedIn algorithm (favor authentic engagement over vanity metrics).`;

    const { response, metrics } = await retryWithBackoff(
      async () => {
        const aiStartTime = Date.now();
        const result = await callPerplexity(
          {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            model: selectOptimalModel({
              taskType: 'generation',
              complexityLevel: 'medium',
              requiresCreativity: true,
              outputLength: 'long'
            }),
            temperature: 0.8,
            max_tokens: 2000,
            return_citations: false,
          },
          'generate-linkedin-post'
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

    const generatedContent = cleanCitations(response.choices[0].message.content);

    // Parse JSON from response with production-grade extraction
    let parsedContent;
    const parseResult = extractJSON(generatedContent, LinkedInPostSchema);

    if (parseResult.success && parseResult.data) {
      parsedContent = parseResult.data;
      logger.info('Successfully validated LinkedIn post');
    } else {
      logger.warn('JSON parsing or schema validation failed', {
        error: parseResult.error
      });

      // Fallback: Try without schema validation
      const basicParseResult = extractJSON(generatedContent);
      if (basicParseResult.success && basicParseResult.data) {
        parsedContent = basicParseResult.data;
        logger.info('Used basic parsing without schema validation');
      } else {
        // Final fallback
        parsedContent = {
          title: topic,
          content: generatedContent,
          hashtags: [],
          postType: postType,
          estimatedEngagement: 'medium',
          hookStrength: '7',
          improvementTips: []
        };
        logger.warn('Using fallback content structure');
      }
    }

    logger.info('LinkedIn post generated successfully', { 
      latencyMs: Date.now() - startTime,
      contentLength: parsedContent.content.length 
    });

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const aiError = handlePerplexityError(error);
    logger.error('LinkedIn post generation failed', error, {
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
