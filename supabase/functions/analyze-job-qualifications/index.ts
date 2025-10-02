import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobAnalysisResult {
  success: boolean;
  professionalTitle: string;
  industry: string;
  standardizedQualifications: {
    required: string[];
    preferred: string[];
    technical: string[];
    soft: string[];
  };
  hiringManagerPerspective: {
    keyPriorities: string[];
    redFlags: string[];
    idealCandidate: string;
  };
  atsKeywords: string[];
  compensationRange: {
    min: number;
    max: number;
    currency: string;
  } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { jobDescription } = await req.json();

    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('Job description must be at least 50 characters');
    }

    console.log('Analyzing job description...');

    const response = await fetch('https://gateway.ai.cloudflare.com/v1/b8610e58b86f9d6e14e7c1c313e8c9e0/lovable/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing job descriptions. Extract and return a JSON object with the following structure:

{
  "professionalTitle": "the job title",
  "industry": "the industry",
  "standardizedQualifications": {
    "required": ["list of required qualifications"],
    "preferred": ["list of preferred qualifications"],
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"]
  },
  "hiringManagerPerspective": {
    "keyPriorities": ["what matters most to the hiring manager"],
    "redFlags": ["what would disqualify a candidate"],
    "idealCandidate": "description of the ideal candidate"
  },
  "atsKeywords": ["important keywords for ATS"],
  "compensationRange": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  }
}

If compensation is not mentioned, set compensationRange to null.`
          },
          {
            role: 'user',
            content: `Analyze this job description and return ONLY valid JSON:\n\n${jobDescription}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exceeded. Please add more credits.");
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No analysis data returned from AI');
    }

    const analysis = JSON.parse(content);

    const result: JobAnalysisResult = {
      success: true,
      ...analysis
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-job-qualifications function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
