// supabase/functions/generate-series-posts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---- Schemas (align with frontend types) ----

const OutlineItemSchema = z.object({
  partNumber: z.number(),
  title: z.string(),
  focusStatement: z.string().optional().default(""),
  category: z.string().optional(),
});

const SeriesMetadataSchema = z.object({
  seriesTitle: z.string().min(1),
  audience: z.string().min(1),
  voice: z.enum(["executive", "practitioner", "educator"]),
  platform: z.enum(["LinkedIn", "Blog"]),
});

const WordRangeSchema = z.object({
  min: z.number().int().positive().default(180),
  max: z.number().int().positive().default(260),
});

const RequestSchema = z.object({
  seriesMetadata: SeriesMetadataSchema,
  outline: z.array(OutlineItemSchema).min(1).max(16),
  resumeSummaryShort: z.string().optional().default(""),
  allowedWordRange: WordRangeSchema.optional(),
});

const SeriesPostSchema = z.object({
  postNumber: z.number(),
  title: z.string(),
  body: z.string().min(100),
  hook: z.string(),
  cta: z.string(),
  wordCount: z.number(),
  resumeExamplesUsed: z.array(z.string()).optional(),
});

type OutlineItem = z.infer<typeof OutlineItemSchema>;
type SeriesMetadata = z.infer<typeof SeriesMetadataSchema>;
type SeriesPost = z.infer<typeof SeriesPostSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[generate-series-posts] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      seriesMetadata,
      outline,
      resumeSummaryShort,
      allowedWordRange,
    } = parsed.data;

    const wordMin = allowedWordRange?.min ?? 180;
    const wordMax = allowedWordRange?.max ?? 260;

    const voiceGuidelines: Record<SeriesMetadata["voice"], string> = {
      executive:
        "Strategic perspective. Focus on decision-making, ROI, and organizational impact. Use 'we' and 'our team' to frame outcomes. Assume the reader is a VP-level or above.",
      practitioner:
        "Hands-on, step-by-step guidance. Translate concepts into concrete actions, tools, and frameworks. Ideal for managers and ICs trying to implement improvements.",
      educator:
        "Teaching mindset. Explain concepts clearly, with examples and analogies. Build knowledge across the series, from fundamentals to advanced insights.",
    };

    const platformHints: Record<SeriesMetadata["platform"], string> = {
      LinkedIn:
        "Write in short paragraphs (1–3 sentences). Use white space. Add light structure (numbered lists or bullets) but no markdown headings.",
      Blog:
        "You may use slightly longer paragraphs and more detailed explanations, but keep it scannable.",
    };

    const systemPrompt = `You are an expert content strategist and writer for ${seriesMetadata.platform}, creating a multi-part series.

SERIES:
- Title: ${seriesMetadata.seriesTitle}
- Audience: ${seriesMetadata.audience}
- Voice: ${seriesMetadata.voice}
- Platform: ${seriesMetadata.platform}

VOICE GUIDELINES:
${voiceGuidelines[seriesMetadata.voice]}

PLATFORM HINTS:
${platformHints[seriesMetadata.platform]}

WORD COUNT:
- Each post must be between ${wordMin}-${wordMax} words.
- You must return the word count for each post.

STRUCTURE FOR EACH POST:
1. HOOK (first 1–2 lines)
   - Immediately show why this matters to the reader.
2. BODY
   - Deliver on the promise of the title and focus statement.
   - Use at least one specific example or scenario.
   - Where appropriate, reference concrete metrics, outcomes, or achievements.
3. CTA (Call to Action)
   - End each post with a specific invitation: question, reflection, or next step.

PROFESSIONAL BACKGROUND (USER CONTEXT):
${resumeSummaryShort || "Professional with measurable achievements and experience in their domain."}

Use this background context to add credibility:
- e.g., "In one transformation we led, cycle time dropped 35%..." (you can paraphrase or generalize if needed).

Return only a JSON array of posts, where each post has:
[
  {
    "postNumber": number,
    "title": "Part X title",
    "body": "Full post content (hook + body + CTA) as one string",
    "hook": "First 1–2 lines from the body",
    "cta": "An engagement-driving call to action",
    "wordCount": number,
    "resumeExamplesUsed": ["optional list of examples you drew on"]
  }
]
`;

    const posts: SeriesPost[] = [];
    const batchSize = 4;

    for (let i = 0; i < outline.length; i += batchSize) {
      const batch: OutlineItem[] = outline.slice(i, i + batchSize);

      const userPrompt = `Generate ${batch.length} posts for the following parts of the series.

For each part:
- Use the title and focus statement as your north star.
- Keep each post between ${wordMin}-${wordMax} words.
- Include a clear hook and explicit CTA.
- Use specific, believable examples that match the user's professional background.

PARTS:
${batch
        .map(
          (item) =>
            `Part ${item.partNumber}: ${item.title}
Focus: ${item.focusStatement || "(none specified)"}
Category: ${item.category || "general"}`,
        )
        .join("\n\n")}`;

      const { response, metrics } = await callLovableAI(
        {
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.8,
          max_tokens: 3500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        "generate-series-posts",
        user.id,
      );

      await logAIUsage(metrics);

      const rawContent = response.choices[0]?.message?.content ?? "";
      console.log(`[generate-series-posts] Raw AI response batch ${i / batchSize + 1}:`, rawContent.substring(0, 500));
      
      const parseResult = extractJSON(rawContent);
      
      // Validate required fields
      if (parseResult.success && parseResult.data) {
        const post = parseResult.data;
        if (!post.title || typeof post.title !== 'string') {
          throw new Error('Missing or invalid title');
        }
        if (!post.body || typeof post.body !== 'string' || post.body.length < 100) {
          throw new Error('Missing or invalid body (min 100 chars)');
        }
        if (!post.hook || typeof post.hook !== 'string') {
          throw new Error('Missing or invalid hook');
        }
      }

      const extracted = parseResult.success ? parseResult.data : {};
      
      if (!Array.isArray(extracted)) {
        throw new Error("AI response did not return an array of posts");
      }

      for (const p of extracted) {
        const parsedPost = SeriesPostSchema.safeParse(p);
        if (!parsedPost.success) {
          console.error("Invalid post schema:", parsedPost.error.flatten());
          throw new Error("AI post schema validation failed");
        }
        posts.push(parsedPost.data);
      }
    }

    // Basic sanity: ensure we didn't accidentally produce more posts than outline parts * 2 or something weird
    if (posts.length === 0) {
      throw new Error("No posts were generated");
    }

    return new Response(
      JSON.stringify({
        success: true,
        posts,
        metadata: {
          seriesTitle: seriesMetadata.seriesTitle,
          totalPosts: posts.length,
          voice: seriesMetadata.voice,
          audience: seriesMetadata.audience,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("generate-series-posts error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
