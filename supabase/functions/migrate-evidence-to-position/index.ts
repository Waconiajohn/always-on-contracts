import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI } from "../_shared/lovableAI.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalBullet, 
      originalContext, 
      targetContext, 
      requirement 
    } = await req.json();

    if (!originalBullet || !originalContext || !targetContext || !requirement) {
      throw new Error('Missing required fields');
    }

    const systemPrompt = `You are an expert resume writer specializing in contextualizing achievements across different roles.

Your task is to take an achievement from one job and rewrite it for a different job context while:
1. Maintaining the core achievement and impact
2. Adjusting the language and framing to fit the new role
3. Keeping it truthful - don't invent new facts
4. Making it relevant to the target requirement
5. Preserving quantifiable metrics where applicable

Return ONLY the new bullet point text, nothing else.`;

    const userPrompt = `Original Achievement:
"${originalBullet}"

Original Context:
- Job Title: ${originalContext.jobTitle}
- Company: ${originalContext.company}
- Period: ${originalContext.dateRange}

Target Context:
- Job Title: ${targetContext.jobTitle}
- Company: ${targetContext.company}
- Period: ${targetContext.dateRange}

Target Requirement:
"${requirement}"

Rewrite this achievement to fit the target job context while addressing the requirement. Keep the core facts but adjust the framing and emphasis.`;

    const response = await callLovableAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      "google/gemini-2.5-flash",
      { temperature: 0.7, max_tokens: 300 }
    );

    const newBullet = response.choices[0]?.message?.content?.trim();

    if (!newBullet) {
      throw new Error('Failed to generate new bullet');
    }

    return new Response(
      JSON.stringify({ newBullet }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
