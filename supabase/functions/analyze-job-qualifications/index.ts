import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

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

    console.log('Analyzing job description with Perplexity...');

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing job descriptions. Extract structured information using tool calling.'
          },
          {
            role: 'user',
            content: `Analyze this job description:\n\n${jobDescriptionText}`
          }
        ],
        model: selectOptimalModel({
          taskType: 'extraction',
          complexity: 'moderate',
          requiresAccuracy: true,
          outputLength: 'medium'
        }),
      },
      'analyze-job-qualifications'
    );

    await logAIUsage(metrics);

    if (!response.choices?.[0]?.message) {
      console.error('Perplexity response error:', JSON.stringify(response));
      throw new Error('Invalid Perplexity response');
    }

    // Parse JSON from response content since Perplexity doesn't support tool calling
    const content = response.choices[0].message.content;
    console.log('Perplexity response:', content.substring(0, 200));
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    const toolCall = { function: { arguments: JSON.stringify(analysisData) } };
    
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
