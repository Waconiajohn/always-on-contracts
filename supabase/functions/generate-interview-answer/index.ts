import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, purpose, gapAddressed, resumeText, jobDescription } = await req.json();

    if (!question || !resumeText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question and resumeText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert career coach helping a candidate answer interview questions designed to strengthen their resume for a specific job application.

Your task is to generate a helpful, personalized answer based on their existing resume content.

Guidelines:
1. Extract and use specific examples from their resume
2. Include quantifiable achievements and metrics when available
3. Address the specific gap or requirement being asked about
4. Keep the answer concise but substantive (2-4 sentences typically)
5. Write in first person as if the candidate is speaking
6. Be truthful - only reference things that appear in their resume
7. If the resume lacks relevant content, indicate low confidence

Output format - respond with valid JSON only:
{
  "suggestedAnswer": "The answer text here...",
  "confidence": "high" | "medium" | "low",
  "extractedEvidence": ["relevant quote or fact from resume", "another relevant item"],
  "note": "Optional note if confidence is low explaining what's missing"
}`;

    const userPrompt = `Question: ${question}

Purpose of this question: ${purpose || "To understand your experience better"}

Gap Being Addressed: ${gapAddressed || "General qualification"}

===== CANDIDATE'S RESUME =====
${resumeText}
===== END RESUME =====

${jobDescription ? `===== JOB DESCRIPTION =====
${jobDescription}
===== END JOB DESCRIPTION =====` : ""}

Generate a suggested answer the candidate can use or customize. Remember to respond with valid JSON only.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let parsed;
    try {
      // Clean up potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: use the raw content as the answer
      parsed = {
        suggestedAnswer: content,
        confidence: "medium",
        extractedEvidence: [],
      };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-interview-answer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
