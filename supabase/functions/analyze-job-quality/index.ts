import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobAnalysisRequest {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  location?: string;
  source?: string;
}

interface JobAnalysisResult {
  isContractPosition: boolean;
  contractConfidenceScore: number; // 0-100
  extractedRateMin?: number;
  extractedRateMax?: number;
  extractedDurationMonths?: number;
  qualityScore: number; // 0-100
  qualityScoreDetails: {
    hasDetailedDescription: boolean;
    hasRateInfo: boolean;
    hasDurationInfo: boolean;
    hasRequirements: boolean;
    descriptionLength: number;
    postingRecency: string;
  };
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { jobTitle, jobDescription, company, location, source }: JobAnalysisRequest = await req.json();

    console.log(`Analyzing job: ${jobTitle} from ${company || 'Unknown'}`);

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Analyze this job posting and provide a detailed assessment:

Job Title: ${jobTitle}
Company: ${company || 'Not specified'}
Location: ${location || 'Not specified'}
Source: ${source || 'Unknown'}

Job Description:
${jobDescription}

Please analyze and return a JSON object with the following structure:
{
  "isContractPosition": boolean (true if this is a contract/freelance/1099/temporary position, false if permanent/full-time/W2),
  "contractConfidenceScore": number (0-100, how confident are you this is a contract position),
  "extractedRateMin": number or null (minimum hourly rate in USD if mentioned),
  "extractedRateMax": number or null (maximum hourly rate in USD if mentioned),
  "extractedDurationMonths": number or null (contract duration in months if mentioned),
  "qualityScore": number (0-100, overall job posting quality),
  "qualityScoreDetails": {
    "hasDetailedDescription": boolean,
    "hasRateInfo": boolean,
    "hasDurationInfo": boolean,
    "hasRequirements": boolean,
    "descriptionLength": number (word count),
    "postingRecency": "recent" | "moderate" | "old" | "unknown"
  },
  "reasoning": "Brief explanation of your analysis"
}

Important rules:
- Look for keywords: "contract", "contractor", "freelance", "1099", "temporary", "temp", "project-based", "consulting"
- Permanent indicators: "full-time", "FTE", "W2", "permanent", "employee benefits", "401k", "health insurance"
- Convert annual salaries to hourly rates (divide by 2080)
- Look for duration patterns: "3-6 months", "6 month contract", "1 year project"
- Quality scoring: detailed requirements (25pts), clear rate info (25pts), company info (20pts), recent posting (15pts), clear responsibilities (15pts)`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert job market analyst specializing in contract positions. Analyze job postings accurately and return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    console.log('AI Response:', analysisText);

    // Extract JSON from the response
    let analysis: JobAnalysisResult;
    try {
      // Try to parse directly first
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON object in the text
        const objectMatch = analysisText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          analysis = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      }
    }

    console.log('Parsed analysis:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-job-quality:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});