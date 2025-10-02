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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing job descriptions. Even when job descriptions are poorly written or vague, you can identify the standardized requirements for that profession and industry.

Your task is to analyze job descriptions and extract:
1. The professional title and industry
2. Standardized qualifications for this role/industry (required, preferred, technical skills, soft skills)
3. What a hiring manager is really looking for (priorities, red flags, ideal candidate profile)
4. ATS-friendly keywords that should appear in a resume
5. Compensation range if mentioned

Respond with a JSON object following this structure:
{
  "professionalTitle": "string",
  "industry": "string",
  "standardizedQualifications": {
    "required": ["string"],
    "preferred": ["string"],
    "technical": ["string"],
    "soft": ["string"]
  },
  "hiringManagerPerspective": {
    "keyPriorities": ["string"],
    "redFlags": ["string"],
    "idealCandidate": "string"
  },
  "atsKeywords": ["string"],
  "compensationRange": {
    "min": number,
    "max": number,
    "currency": "USD"
  } or null
}`
          },
          {
            role: 'user',
            content: `Analyze this job description:\n\n${jobDescription}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_job",
              description: "Analyze a job description and extract structured data",
              parameters: {
                type: "object",
                properties: {
                  professionalTitle: { type: "string" },
                  industry: { type: "string" },
                  standardizedQualifications: {
                    type: "object",
                    properties: {
                      required: { type: "array", items: { type: "string" } },
                      preferred: { type: "array", items: { type: "string" } },
                      technical: { type: "array", items: { type: "string" } },
                      soft: { type: "array", items: { type: "string" } }
                    },
                    required: ["required", "preferred", "technical", "soft"],
                    additionalProperties: false
                  },
                  hiringManagerPerspective: {
                    type: "object",
                    properties: {
                      keyPriorities: { type: "array", items: { type: "string" } },
                      redFlags: { type: "array", items: { type: "string" } },
                      idealCandidate: { type: "string" }
                    },
                    required: ["keyPriorities", "redFlags", "idealCandidate"],
                    additionalProperties: false
                  },
                  atsKeywords: { type: "array", items: { type: "string" } },
                  compensationRange: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" },
                      currency: { type: "string" }
                    },
                    nullable: true
                  }
                },
                required: ["professionalTitle", "industry", "standardizedQualifications", "hiringManagerPerspective", "atsKeywords"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_job" } }
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No analysis data returned from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

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
