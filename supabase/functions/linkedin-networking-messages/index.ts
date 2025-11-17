// supabase/functions/linkedin-networking-messages/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
          "Brief connection request. Establish authentic common ground. Show specific interest in their work or company. No hard asks.",
        warm_intro:
          "Reference mutual context or connection. Be specific about why you're reaching out. Make a small, easy next step (e.g., quick chat).",
        recruiter_outreach:
          "Highlight 1–2 relevant achievements. Express interest in roles that match your background. Optional: mention availability or location.",
        hiring_manager:
          "Reference a specific team or role. Demonstrate fit with 1–2 concise achievements. Ask for a short conversation or guidance.",
        post_application_followup:
          "Mention the role and application timing. Reaffirm interest. Add one new, relevant point (achievement or qualification). Be respectful, not pushy.",
        thank_you:
          "Reference specific points from the conversation. Express genuine appreciation. Suggest a light next step or simply close politely.",
        informational_interview:
          "Show that you've done your homework about their background. Request a 15–20 minute chat for advice. Acknowledge their time constraints.",
      };

    const scenarioText = scenario.replace(/_/g, " ");

    const systemPrompt = `
You are an expert networking and outreach strategist focused on authentic, professional LinkedIn communication.

SCENARIO: ${scenarioText}
GUIDELINES:
${scenarioGuidelines[scenario]}

TONE & STYLE:
- Tone: ${tone}
- Professional, concise, human.
- Avoid clichés and buzzwords (especially: ${avoidWords.join(", ")}).
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

    logger.info("Generated networking messages", {
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
    logger.error("linkedin-networking-messages failed", {
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
