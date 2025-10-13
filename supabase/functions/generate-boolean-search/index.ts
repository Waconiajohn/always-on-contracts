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
    const { jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      throw new Error('Please provide a job description (at least 20 characters)');
    }

    const systemPrompt = `You are a Boolean search expert. Extract 5-10 job title variations from the provided job description.

Instructions:
1. Identify the core job title and common variations
2. Include seniority levels (Senior, Principal, Lead, Director, VP, Chief)
3. Include related titles in the same field
4. Focus on titles that would appear in job postings
5. Return ONLY a JSON object with this exact structure:

{
  "titles": ["Title 1", "Title 2", "Title 3", ...],
  "linkedInString": "title:(\"Title 1\" OR \"Title 2\" OR \"Title 3\")",
  "indeedString": "\"Title 1\" OR \"Title 2\" OR \"Title 3\"",
  "googleJobsString": "Title 1 OR Title 2 OR Title 3"
}

Example:
Input: "Looking for a Senior Product Manager with AI/ML experience..."
Output:
{
  "titles": ["Product Manager", "Senior Product Manager", "VP Product", "Chief Product Officer", "AI Product Manager", "Technical Product Manager", "Product Lead", "Director of Product"],
  "linkedInString": "title:(\"Product Manager\" OR \"Senior Product Manager\" OR \"VP Product\" OR \"Chief Product Officer\" OR \"AI Product Manager\" OR \"Technical Product Manager\" OR \"Product Lead\" OR \"Director of Product\")",
  "indeedString": "\"Product Manager\" OR \"Senior Product Manager\" OR \"VP Product\" OR \"Chief Product Officer\" OR \"AI Product Manager\" OR \"Technical Product Manager\" OR \"Product Lead\" OR \"Director of Product\"",
  "googleJobsString": "Product Manager OR Senior Product Manager OR VP Product OR Chief Product Officer OR AI Product Manager OR Technical Product Manager OR Product Lead OR Director of Product"
}`;

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
          { role: 'user', content: `Extract job titles from this description:\n\n${jobDescription}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate Boolean search');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Boolean search generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
