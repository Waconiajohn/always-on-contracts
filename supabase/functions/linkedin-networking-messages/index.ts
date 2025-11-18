// supabase/functions/linkedin-networking-messages/index.ts
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

// ---- Schemas (align with frontend) ----

const NetworkingScenarioSchema = z.enum([
  "cold_connection",
  "warm_intro",
  "recruiter_outreach",
  "hiring_manager",
  "post_application_followup",
  "thank_you",
  "informational_interview",
]);

const TargetProfileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  company: z.string().min(1),
  sharedContext: z.string().optional(),
  targetJobTitle: z.string().optional(),
  jobRef: z.string().optional(),
});

const CandidateProfileSchema = z.object({
  headline: z.string().optional(),
  careerVaultSummary: z.string().optional(),
  relevantAchievements: z.array(z.string()).optional(),
});

const ConstraintsSchema = z.object({
  maxWords: z.number().int().positive().default(150),
  tone: z.string().default("professional"),
  avoid: z.array(z.string()).optional(),
});

const RequestSchema = z.object({
  scenario: NetworkingScenarioSchema,
  targetProfile: TargetProfileSchema,
  candidateProfile: CandidateProfileSchema,
  constraints: ConstraintsSchema.optional(),
});

const NetworkingMessageSchema = z.object({
  variant: z.string(),
  channel: z.string(),
  subject: z.string().optional(),
  body: z.string().min(20).max(600),
  rationale: z.string().optional(),
  followUpSuggestion: z.string().optional(),
});

type NetworkingScenario = z.infer<typeof NetworkingScenarioSchema>;
type NetworkingMessage = z.infer<typeof NetworkingMessageSchema>;

const scenarioGuidelines: Record<NetworkingScenario, string> = {
  cold_connection:
    "Short, specific, and respectful connection request. Establish common ground, show genuine interest, and avoid a hard ask in the first message.",
  warm_intro:
    "Reference the mutual connection or shared context explicitly. Signal why this person is worth talking to and suggest a low-commitment next step.",
  recruiter_outreach:
    "Highlight 1–2 highly relevant achievements. Express interest in appropriate roles. Make it easy for them to understand your fit and invite a quick conversation.",
  hiring_manager:
    "Reference a specific role or team, show that you've done your homework, and tie 1–2 achievements directly to their business outcomes. Include a clear but polite ask.",
  post_application_followup:
    "Reference the application, reiterate your interest, and add a new insight or detail. Make the follow-up feel value-adding, not nagging.",
  thank_you:
    "Express sincere appreciation and reference specific parts of the conversation. Suggest a concrete next step, but do not pressure.",
  informational_interview:
    "Show you have researched their background. Ask for a short call (15–20 minutes) with clear purpose. Make it easy for them to say yes or gently decline.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

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
      scenario,
      targetProfile,
      candidateProfile,
      constraints = { maxWords: 150, tone: "professional", avoid: [] },
    } = parsed.data;

    const maxWords = constraints.maxWords ?? 150;
    const tone = constraints.tone ?? "professional";
    const avoidWords = constraints.avoid ?? [];

    const avoidString = avoidWords.length ? avoidWords.join(", ") : "none specified";

    const scenarioText = scenario.replace(/_/g, " ");

    const systemPrompt = `You are an expert networking and outreach copywriter focused on authentic, high-response LinkedIn messages.

SCENARIO: ${scenarioText}
GUIDELINES:
${scenarioGuidelines[scenario]}

GLOBAL PRINCIPLES:
- Max length: ${maxWords} words per message.
- Tone: ${tone}. Human, specific, and respectful.
- Avoid buzzwords and fluff. NEVER use these words: ${avoidString}.
- Write as if you are a thoughtful professional, not a template.

TARGET PERSON:
- Name: ${targetProfile.name || "(not provided)"}
- Title: ${targetProfile.title || "(not provided)"}
- Company: ${targetProfile.company}
- Shared context: ${targetProfile.sharedContext || "(none provided)"}
- Role of interest: ${targetProfile.targetJobTitle || "(not specified)"}

CANDIDATE (SENDER) PROFILE:
- Headline: ${candidateProfile.headline || "(not provided)"}
- Career Vault Summary: ${candidateProfile.careerVaultSummary || "Professional with relevant experience"}

RELEVANT ACHIEVEMENTS:
${(candidateProfile.relevantAchievements || [])
  .map((a, i) => `${i + 1}. ${a}`)
  .join("\n") || "(none listed)"}

MESSAGE DESIGN:
- Reference at least ONE specific detail about the target (company, role, work, or shared context).
- Reference at least ONE concrete achievement or pattern from the candidate (lightly, not bragging).
- End with a low-pressure CTA that makes it easy to respond.
- Messages must sound like they were written one-off, not mass-blasted.

DESIRED OUTPUT:
Return JSON with:
{
  "messages": [
    {
      "variant": "direct" | "warm" | "brief",
      "channel": "connection_request" | "inmail" | "message",
      "subject": "optional short subject line",
      "body": "the actual message text",
      "rationale": "why this approach is effective",
      "followUpSuggestion": "optional idea for a follow-up note"
    }
  ]
}

Only return JSON.`;

    const userPrompt = `Generate THREE message variants for this outreach:
1. "direct" – more straightforward and confident.
2. "warm" – more conversational and relationship-focused.
3. "brief" – ultra-concise (ideally under 100 words).

All three should:
- Be grounded in the scenario.
- Use the candidate's achievements sparingly but credibly.
- Make a clear, low-pressure ask.

Ensure each message is under ${maxWords} words.`;

    const { response, metrics } = await callLovableAI(
      {
        model: LOVABLE_AI_MODELS.DEFAULT,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      },
      "linkedin-networking-messages",
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI_GENERATION_FAILED");
    }

    const extracted = extractJSON(content);
    const json = extracted.success ? extracted.data : {};
    const messages = Array.isArray(json?.messages) ? json.messages : [];

    console.log("Generated networking messages", {
      userId: user.id,
      scenario,
      count: messages.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messages,
        metadata: {
          scenario,
          tone,
          maxWords,
          targetCompany: targetProfile.company,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("linkedin-networking-messages failed", {
      error: error?.message,
    });
    const code = error?.message === "AUTHENTICATION_REQUIRED"
      ? 401
      : 500;

    return new Response(
      JSON.stringify({
        error: error?.message || "AI_GENERATION_FAILED",
      }),
      {
        status: code,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
