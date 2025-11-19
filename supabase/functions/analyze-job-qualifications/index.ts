import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

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

    const systemPrompt = `You are an expert at analyzing job descriptions. Extract structured information. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:`;

    const userPrompt = `Analyze this job description:\n\n${jobDescriptionText}`;

    const { response, metrics } = await callLovableAI(
      {
        model: LOVABLE_AI_MODELS.DEFAULT,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      'analyze-job-qualifications'
    );

    await logAIUsage(metrics);

    if (!response.choices?.[0]?.message) {
      console.error('Lovable AI response error:', JSON.stringify(response));
      throw new Error('Invalid AI response');
    }

    // Parse JSON from response content
    const content = response.choices[0].message.content;
    console.log('[analyze-job-qualifications] Raw AI response:', content.substring(0, 500));
    
    const parseResult = extractJSON(content);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[analyze-job-qualifications] JSON parse failed:', parseResult.error);
      console.error('[analyze-job-qualifications] Full response:', content);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const analysis = parseResult.data;

    // Validate required fields
    if (!analysis.professionalTitle || typeof analysis.professionalTitle !== 'string') {
      throw new Error('Missing or invalid professionalTitle');
    }
    if (!analysis.standardizedQualifications || typeof analysis.standardizedQualifications !== 'object') {
      throw new Error('Missing or invalid standardizedQualifications');
    }

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
