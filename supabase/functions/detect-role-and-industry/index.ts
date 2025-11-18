import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { findCompetencyFramework, getDefaultFramework, type CompetencyFramework } from '../_shared/competency-frameworks.ts';

const logger = createLogger('detect-role-and-industry');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, userId } = await req.json();
    
    if (!resumeText) {
      throw new Error("Resume text is required");
    }

    logger.info('Detecting role and industry', { userId });

    // Extract role and industry from resume using AI
    const prompt = `Analyze this resume and extract the PRIMARY job title and industry.

RESUME:
${resumeText}

EXTRACTION RULES:
1. Identify the MOST RECENT or MOST SENIOR role title
2. Normalize the title to a standard industry role (e.g., "Drilling Engineering Supervisor" not "Drilling Engr Supv")
3. Identify the primary industry (Oil & Gas, Technology, Marketing, Finance, Healthcare, etc.)
4. Extract years of experience in this role

Return ONLY valid JSON:
{
  "jobTitle": "Drilling Engineering Supervisor",
  "industry": "Oil & Gas",
  "yearsInRole": 12,
  "seniorityLevel": "senior"
}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing resumes and extracting job titles and industries. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      },
      'detect-role-and-industry',
      userId
    );

    const content = response.choices[0].message.content;
    const extractResult = extractJSON(content);
    
    if (!extractResult.success || !extractResult.data) {
      throw new Error("Failed to extract role information");
    }

    const roleData = extractResult.data;
    
    // Find matching competency framework
    const framework = findCompetencyFramework(roleData.jobTitle, roleData.industry) || getDefaultFramework();
    
    logger.info('Role detected', {
      jobTitle: roleData.jobTitle,
      industry: roleData.industry,
      frameworkMatch: framework.role
    });

    return new Response(
      JSON.stringify({
        success: true,
        roleData: {
          jobTitle: roleData.jobTitle,
          industry: roleData.industry,
          yearsInRole: roleData.yearsInRole,
          seniorityLevel: roleData.seniorityLevel
        },
        framework: {
          role: framework.role,
          industry: framework.industry,
          technicalCompetencies: framework.technicalCompetencies,
          managementBenchmarks: framework.managementBenchmarks,
          educationRequirements: framework.educationRequirements,
          certifications: framework.certifications,
          experienceLevel: framework.experienceLevel
        },
        metrics
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error('Role detection failed', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
