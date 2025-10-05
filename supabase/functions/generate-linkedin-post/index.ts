import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, postType, targetAudience, keyPoints, userProfile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Elite LinkedIn content strategist persona
    const systemPrompt = `You are an elite LinkedIn content strategist with 15+ years of experience building executive thought leadership for Fortune 500 leaders.

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
${userProfile ? `\nUSER PROFILE: ${JSON.stringify(userProfile)}` : ''}

Apply the content framework rigorously. Optimize for LinkedIn algorithm (favor authentic engagement over vanity metrics).`;

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse JSON from response
    let parsedContent;
    try {
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : generatedContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      parsedContent = {
        title: topic,
        content: generatedContent,
        hashtags: [],
        postType: postType,
        estimatedEngagement: 'medium',
        hookStrength: '7',
        improvementTips: []
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-linkedin-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});