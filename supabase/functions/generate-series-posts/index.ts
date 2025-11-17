import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seriesMetadata, outline, careerVaultSummaryShort, allowedWordRange } = await req.json();

    if (!seriesMetadata || !outline || outline.length === 0) {
      throw new Error('Series metadata and outline are required');
    }

    if (outline.length > 16) {
      throw new Error('Maximum series length is 16 posts');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const wordMin = allowedWordRange?.min || 180;
    const wordMax = allowedWordRange?.max || 260;

    const voiceGuidelines: Record<string, string> = {
      executive: 'Strategic perspective. Focus on organizational impact, ROI, and leadership decisions. Use "we" and "our team" more than "I".',
      practitioner: 'Tactical how-to. Step-by-step guidance. Use concrete examples, tools, and processes.',
      educator: 'Teaching mindset. Explain concepts clearly, with analogies and progressive structure.'
    };

    const vaultSummaryBlock = careerVaultSummaryShort
      ? `CAREER VAULT SUMMARY (SHORT):\n${careerVaultSummaryShort}\n`
      : "CAREER VAULT SUMMARY: Not provided. Use generic but realistic examples.";

    const systemPrompt = `You are an expert LinkedIn content creator specializing in multi-part series.

SERIES CONTEXT:
- Title: ${seriesMetadata.seriesTitle}
- Audience: ${seriesMetadata.audience}
- Voice: ${seriesMetadata.voice}
- Platform: ${seriesMetadata.platform}
- Word count per post: ${wordMin}-${wordMax} words

VOICE GUIDELINES:
${voiceGuidelines[seriesMetadata.voice]}

STRUCTURE FOR EACH POST:
1. Hook (first 1–2 lines) - grab attention.
2. Body - deliver on promise; 2–3 sentence paragraphs; practical and specific.
3. CTA - a simple, authentic question or next step.

${vaultSummaryBlock}

RULES:
- Use Career Vault summary for credibility and examples, anonymized as needed.
- Do NOT invent employers or confidential details.
- Use numbers only if plausible for such roles; if unsupported, stay qualitative.
- Avoid hype words: "rockstar", "guru", "world-class", "cutting-edge", "game-changing".
- Each post must be self-contained and ready to publish.
- Respect word count strictly.

OUTPUT FORMAT (JSON array):
[
  {
    "postNumber": 1,
    "title": "Full post title",
    "body": "Full post content with hook and CTA.",
    "hook": "First 1–2 lines",
    "cta": "Closing call to action",
    "wordCount": 220,
    "vaultExamplesUsed": ["vault-based example description"]
  }
]`;

    const posts: any[] = [];
    const batchSize = 4;

    for (let i = 0; i < outline.length; i += batchSize) {
      const batch = outline.slice(i, i + batchSize);
      
      const userPrompt = `Generate LinkedIn posts for these series parts:

PARTS:
${batch.map((item: any) => 
  `Part ${item.partNumber}: ${item.title}
Focus: ${item.focusStatement}
Category: ${item.category ?? "general"}`
).join('\n\n')}

REQUIREMENTS:
- ${wordMin}-${wordMax} words per post.
- Use specified voice and audience.
- Include: strong hook, practical body, call to action.
- Weave in one anonymized Career Vault example when possible.`;

      console.log(`[Series Posts] Generating batch ${i + 1} to ${Math.min(i + batchSize, outline.length)}`);

      const { response, metrics } = await callLovableAI(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.8,
          max_tokens: 3200,
          response_format: { type: 'json_object' }
        },
        'generate-series-posts',
        user.id
      );

      await logAIUsage(metrics);

      const content = response.choices[0].message.content;
      const extracted = extractJSON(content);

      if (!extracted.success) {
        console.error('[Series Posts] JSON parse failed');
        throw new Error('Failed to parse AI response');
      }

      const json = extracted.data;
      if (!Array.isArray(json)) {
        console.error('[Series Posts] Expected array, got:', typeof json);
        throw new Error('Invalid AI response format');
      }

      posts.push(...json);
    }

    console.log(`[Series Posts] Generated ${posts.length} posts for "${seriesMetadata.seriesTitle}"`);

    return new Response(
      JSON.stringify({
        success: true,
        posts,
        metadata: {
          seriesTitle: seriesMetadata.seriesTitle,
          totalPosts: posts.length,
          voice: seriesMetadata.voice,
          audience: seriesMetadata.audience,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Series Posts] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
