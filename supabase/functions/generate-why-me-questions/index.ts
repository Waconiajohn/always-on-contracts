import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();

    const prompt = `Generate 3-5 specific, thoughtful questions to help an executive articulate their achievements in the category of "${category}".

The questions should:
- Help extract specific, measurable results
- Encourage storytelling about challenges overcome
- Focus on leadership impact and strategic thinking
- Draw out unique differentiators

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert executive career coach. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: PERPLEXITY_MODELS.SMALL,
        temperature: 0.7,
        max_tokens: 600,
        return_citations: false,
      },
      'generate-why-me-questions'
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-why-me-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
