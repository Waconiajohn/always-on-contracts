import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    const { jobDescription, opportunityId } = await req.json();
    
    let jobDescriptionText = jobDescription;
    
    // If opportunityId is provided, fetch the job description from database
    if (opportunityId && !jobDescription) {
      console.log('Fetching job description for opportunity:', opportunityId);
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('job_opportunities')
        .select('job_description')
        .eq('id', opportunityId)
        .single();
      
      if (error || !data) {
        throw new Error('Failed to fetch job opportunity');
      }
      
      jobDescriptionText = data.job_description;
    }
    
    if (!jobDescriptionText || jobDescriptionText.length < 50) {
      throw new Error('Job description must be at least 50 characters');
    }

    console.log('Analyzing job description with Lovable AI...');

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
            content: 'You are an expert at analyzing job descriptions. Use the analyze_job tool to extract structured information.'
          },
          {
            role: 'user',
            content: `Analyze this job description:\n\n${jobDescriptionText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_job",
              description: "Extract structured information from a job description",
              parameters: {
                type: "object",
                properties: {
                  professionalTitle: { type: "string", description: "The job title" },
                  industry: { type: "string", description: "The industry" },
                  standardizedQualifications: {
                    type: "object",
                    properties: {
                      required: { type: "array", items: { type: "string" }, description: "Required qualifications" },
                      preferred: { type: "array", items: { type: "string" }, description: "Preferred qualifications" },
                      technical: { type: "array", items: { type: "string" }, description: "Technical skills" },
                      soft: { type: "array", items: { type: "string" }, description: "Soft skills" }
                    },
                    required: ["required", "preferred", "technical", "soft"]
                  },
                  hiringManagerPerspective: {
                    type: "object",
                    properties: {
                      keyPriorities: { type: "array", items: { type: "string" } },
                      redFlags: { type: "array", items: { type: "string" } },
                      idealCandidate: { type: "string" }
                    },
                    required: ["keyPriorities", "redFlags", "idealCandidate"]
                  },
                  atsKeywords: { type: "array", items: { type: "string" }, description: "Important ATS keywords" },
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
                required: ["professionalTitle", "industry", "standardizedQualifications", "hiringManagerPerspective", "atsKeywords", "compensationRange"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_job" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Rate limit exceeded. Please try again in a moment.",
            errorCode: "RATE_LIMIT"
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "AI credits exhausted. Please add more credits to your workspace.",
            errorCode: "CREDITS_EXHAUSTED"
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));
    
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
