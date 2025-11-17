import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { generateShortVaultSummary, formatSummaryForPrompt } from '../_shared/vault-summary.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seriesMetadata, outline, allowedWordRange } = await req.json();

    // Validation
    if (!seriesMetadata || !outline || outline.length === 0) {
      throw new Error('Series metadata and outline are required');
    }

    if (outline.length > 16) {
      throw new Error('Maximum series length is 16 posts');
    }

    // Auth with JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Generate SHORT vault summary (not full analysis)
    const vaultSummary = await generateShortVaultSummary(supabase, user.id);
    console.log(`[Series Posts] Using ${vaultSummary.wordCount}-word vault summary`);

    const wordMin = allowedWordRange?.min || 180;
    const wordMax = allowedWordRange?.max || 260;

    const voiceGuidelines: Record<string, string> = {
      executive: 'Strategic perspective. Organizational impact. Use "we" and "our team". Focus on ROI and decisions.',
      practitioner: 'Tactical how-to. Step-by-step. Use "you should". Include tools and processes. Actionable.',
      educator: 'Teaching mindset. Explain concepts. Use analogies. Build knowledge progressively. Mentor tone.'
    };

    const systemPrompt = `You are an expert LinkedIn content creator for ${seriesMetadata.voice}-level posts.

VOICE: ${voiceGuidelines[seriesMetadata.voice]}

CONTENT REQUIREMENTS:
- Word count: ${wordMin}-${wordMax} words per post
- Platform: ${seriesMetadata.platform}
- Audience: ${seriesMetadata.audience}
- Series: ${seriesMetadata.seriesTitle}

${formatSummaryForPrompt(vaultSummary)}

STRUCTURE:
1. **Hook** (1-2 lines): Grab attention immediately
2. **Body**: Deliver value
   - Use vault achievements for credibility
   - Include 1 specific example per post
   - No generic advice
3. **CTA**: Engagement question

BANNED WORDS:
synergy, holistic, leverage, paradigm, rockstar, guru, world-class, cutting-edge, revolutionary

Return JSON array:
[
  {
    "postNumber": 1,
    "title": "Part 1: [Title]",
    "body": "Full post text...",
    "hook": "First 1-2 lines",
    "cta": "Engagement question",
    "wordCount": 245,
    "vaultExamplesUsed": ["achievement from vault"]
  }
]`;

    const posts = [];

    // Generate in batches of 4 to avoid timeout
    const batchSize = 4;
    for (let i = 0; i < outline.length; i += batchSize) {
      const batch = outline.slice(i, i + batchSize);
      
      const userPrompt = `Generate posts for parts ${i + 1} to ${Math.min(i + batchSize, outline.length)}:

${batch.map((item: any) => `
Part ${item.partNumber}: ${item.title}
Focus: ${item.focusStatement}
`).join('\n')}

Each post must be ${wordMin}-${wordMax} words with vault-based example.`;

      console.log(`Generating posts ${i + 1} to ${Math.min(i + batchSize, outline.length)}`);

      const { response, metrics } = await callLovableAI(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.8,
          max_tokens: 3000
        },
        'generate-series-posts',
        user.id
      );

      await logAIUsage(metrics);

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const batchPosts = JSON.parse(jsonMatch[0]);
        posts.push(...batchPosts);
      }
    }

    console.log(`Generated ${posts.length} posts for series "${seriesMetadata.seriesTitle}"`);

    return new Response(
      JSON.stringify({
        success: true,
        posts,
        metadata: {
          seriesTitle: seriesMetadata.seriesTitle,
          totalPosts: posts.length,
          voice: seriesMetadata.voice
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Series Posts Error]:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
