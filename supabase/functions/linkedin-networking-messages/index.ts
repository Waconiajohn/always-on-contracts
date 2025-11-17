// supabase/functions/linkedin-networking-messages/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.2/mod.ts";

import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("linkedin-networking-messages");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  jobRef: z.string().optional(), // e.g., job id, link or requisition number
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

function createSupabaseClientFromRequest(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  return supabase;
}

async function getCurrentUser(req: Request) {
  const supabase = createSupabaseClientFromRequest(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    logger.error("Auth error or no user", { error });
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  return { supabase, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user } = await getCurrentUser(req);

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      logger.error("Invalid input for linkedin-networking-messages", {
        issues: parsed.error.issues,
      });
      return new Response(
        JSON.stringify({ error: "invalid_input", details: parsed.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { scenario, targetProfile, candidateProfile, constraints } =
      parsed.data;

    const maxWords = constraints?.maxWords ?? 150;
    const tone = constraints?.tone ?? "professional";
    const avoidWords = constraints?.avoid ?? [
      "synergy",
      "paradigm",
      "rockstar",
      "guru",
      "world-class",
      "cutting-edge",
      "game-changing",
    ];

    const scenarioGuidelines: Record<z.infer<typeof NetworkingScenarioSchema>, string> =
      {
        cold_connection:
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
- Respect the max word count: ${maxWords} words.
- Focus on being specific and relevant, not generic or templated.

TARGET PERSON / COMPANY:
- Name: ${targetProfile.name ?? "Not provided"}
- Title: ${targetProfile.title ?? "Not provided"}
- Company: ${targetProfile.company}
- Shared context: ${
      targetProfile.sharedContext ?? "None provided; infer lightly if needed."
    }
- Target job title: ${targetProfile.targetJobTitle ?? "Not specified"}
- Job reference: ${targetProfile.jobRef ?? "Not specified"}

CANDIDATE (USER) SUMMARY:
- Headline: ${candidateProfile.headline ?? "Not provided"}
- Career Vault summary: ${
      candidateProfile.careerVaultSummary ??
      "Not provided; assume experienced professional with relevant background."
    }
- Relevant achievements (for credibility; use at most 1–2 per message):
${
  candidateProfile.relevantAchievements?.length
    ? candidateProfile.relevantAchievements
      .slice(0, 3)
      .map((a, i) => `${i + 1}. ${a}`)
      .join("\n")
    : "None specifically provided; keep achievements generic and plausible."
}

USE OF ACHIEVEMENTS:
- You may reference concrete outcomes (e.g., "led a project that reduced X by Y%") but do NOT fabricate roles or companies.
- If you generalize ("mid-market SaaS company", "Fortune 500 manufacturer"), do so plausibly without naming specifics.

MESSAGE VARIANTS REQUIRED:
Return exactly 3 variants:
1. direct  – straightforward and confident.
2. warm    – more conversational and relational.
3. brief   – ultra-short, under 100 words, even if global maxWords is higher.

CHANNEL:
- If this looks like a first contact or connection request, use channel "connection_request".
- Otherwise use "message" (for LinkedIn DMs) or "inmail" (if it feels like a more formal InMail-style note).

OUTPUT FORMAT (JSON):
{
  "messages": [
    {
      "variant": "direct | warm | brief",
      "channel": "connection_request | message | inmail",
      "subject": "Optional subject line (for InMail/email-like channels)",
      "body": "The exact message text.",
      "rationale": "Why this approach works for the scenario.",
      "followUpSuggestion": "Optional 2nd-touch idea if they do not respond."
    }
  ]
}
`;

    const userPrompt = `
Generate 3 networking message variants for this scenario: ${scenarioText}.

REQUIREMENTS:
- 1 "direct" variant: straightforward and confident.
- 1 "warm" variant: friendlier and more conversational.
- 1 "brief" variant: ultra-short (under 100 words).
- Each must be within ${maxWords} words or less.
- The brief variant must be under 100 words even if ${maxWords} is larger.
- Use subtle references to the target's work, company, or shared context so it doesn't feel generic.
- Use at most 1–2 short achievement references to demonstrate credibility.
`;

    logger.info("Calling Lovable AI for linkedin-networking-messages", {
      userId: user.id,
      scenario,
      company: targetProfile.company,
    });

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
