import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobRequirement {
  category: 'required' | 'preferred' | 'nice-to-have';
  type: 'skill' | 'experience' | 'education' | 'certification' | 'soft-skill' | 'tool' | 'domain-knowledge';
  requirement: string;
  keywords: string[];
  yearsExperience?: number;
  importance: number; // 1-10
  atsKeyword: boolean;
}

interface IndustryStandard {
  standard: string;
  category: string;
  expectedLevel: string;
  commonInTopPerformers: boolean;
  source: 'industry-research' | 'profession-benchmark';
}

interface AnalysisResult {
  success: boolean;
  jobRequirements: {
    required: JobRequirement[];
    preferred: JobRequirement[];
    niceToHave: JobRequirement[];
  };
  industryStandards: IndustryStandard[];
  professionBenchmarks: IndustryStandard[];
  atsKeywords: {
    critical: string[];
    important: string[];
    bonus: string[];
  };
  roleProfile: {
    title: string;
    level: 'entry' | 'mid' | 'senior' | 'executive' | 'c-level';
    industry: string;
    function: string;
  };
  gapAnalysis: {
    commonlyMissing: string[];
    differentiators: string[];
    riskAreas: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jobDescription, jobTitle, companyName, industry } = await req.json();

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing job requirements for:', jobTitle);

    // PHASE 1: Extract requirements from job description using Lovable AI
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    const jdAnalysisPrompt = `Analyze this job description and extract detailed requirements:

JOB TITLE: ${jobTitle || 'Not specified'}
COMPANY: ${companyName || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

Extract and categorize:
1. REQUIRED qualifications (must-haves)
2. PREFERRED qualifications (strong preference)
3. NICE-TO-HAVE qualifications (bonus)

For each requirement, identify:
- Exact category (skill/experience/education/certification/soft-skill/tool/domain-knowledge)
- Specific keywords for ATS
- Years of experience if mentioned
- Importance level (1-10)
- Whether it's ATS-critical

Also identify:
- Role level (entry/mid/senior/executive/c-level)
- Primary function/department
- Industry classification

Return ONLY valid JSON with this structure:
{
  "requirements": {
    "required": [{"type": "skill", "requirement": "...", "keywords": ["..."], "yearsExperience": 5, "importance": 9, "atsKeyword": true}],
    "preferred": [...],
    "niceToHave": [...]
  },
  "roleProfile": {
    "title": "Senior Product Manager",
    "level": "senior",
    "industry": "Technology",
    "function": "Product"
  },
  "atsKeywords": {
    "critical": ["leadership", "agile"],
    "important": ["stakeholder management"],
    "bonus": ["certification"]
  }
}`;

    let jdAnalysis: any = {
      requirements: { required: [], preferred: [], niceToHave: [] },
      roleProfile: { title: jobTitle || 'Unknown', level: 'mid', industry: industry || 'Unknown', function: 'General' },
      atsKeywords: { critical: [], important: [], bonus: [] }
    };

    if (lovableKey) {
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: jdAnalysisPrompt }],
          temperature: 0.3,
          max_tokens: 2048
        })
      });

      if (lovableResponse.ok) {
        const lovableData = await lovableResponse.json();
        const textContent = lovableData.choices?.[0]?.message?.content || '{}';
        const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        jdAnalysis = JSON.parse(cleanedText);
      }
    }

    // PHASE 2: Get industry standards using Perplexity
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    const industryPrompt = `What are the current industry standards and expectations for a ${jdAnalysis.roleProfile.title} role in the ${jdAnalysis.roleProfile.industry} industry?

Focus on:
1. Standard skills and competencies expected at ${jdAnalysis.roleProfile.level} level
2. Common tools and technologies
3. Typical experience requirements
4. Industry certifications or credentials
5. Emerging trends in this role

Provide specific, actionable standards that top candidates typically have.

Return ONLY valid JSON:
{
  "industryStandards": [
    {"standard": "...", "category": "skill", "expectedLevel": "expert", "commonInTopPerformers": true, "source": "industry-research"}
  ]
}`;

    let industryStandards: IndustryStandard[] = [];

    if (perplexityKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{
              role: 'user',
              content: industryPrompt
            }],
            temperature: 0.3,
            max_tokens: 2000
          })
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const content = perplexityData.choices?.[0]?.message?.content || '{}';
          const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanedContent);
          industryStandards = parsed.industryStandards || [];
        }
      } catch (error) {
        console.error('Perplexity error:', error);
      }
    }

    // PHASE 3: Get profession benchmarks using Gemini
    const benchmarkPrompt = `What do the TOP 10% of ${jdAnalysis.roleProfile.title} professionals have that sets them apart?

Analyze benchmark qualifications for elite performers:
1. Advanced skills and specialized expertise
2. Unique combinations of experience
3. Leadership and influence capabilities
4. Innovation and thought leadership
5. Strategic competencies beyond basic job requirements

These are the differentiators that make someone a STANDOUT candidate, not just qualified.

Return ONLY valid JSON:
{
  "professionBenchmarks": [
    {"standard": "...", "category": "skill", "expectedLevel": "expert", "commonInTopPerformers": true, "source": "profession-benchmark"}
  ],
  "differentiators": ["...", "..."],
  "gapAnalysis": {
    "commonlyMissing": ["skills most candidates lack"],
    "riskAreas": ["areas that can disqualify candidates"]
  }
}`;

    let professionBenchmarks: IndustryStandard[] = [];
    let differentiators: string[] = [];
    let gapAnalysis: any = { commonlyMissing: [], riskAreas: [] };

    if (lovableKey) {
      const benchmarkResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: benchmarkPrompt }],
          temperature: 0.4,
          max_tokens: 2048
        })
      });

      if (benchmarkResponse.ok) {
        const benchmarkData = await benchmarkResponse.json();
        const textContent = benchmarkData.choices?.[0]?.message?.content || '{}';
        const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        professionBenchmarks = parsed.professionBenchmarks || [];
        differentiators = parsed.differentiators || [];
        gapAnalysis = parsed.gapAnalysis || { commonlyMissing: [], riskAreas: [] };
      }
    }

    const result: AnalysisResult = {
      success: true,
      jobRequirements: {
        required: jdAnalysis.requirements.required.map((r: any) => ({ ...r, category: 'required' as const })),
        preferred: jdAnalysis.requirements.preferred.map((r: any) => ({ ...r, category: 'preferred' as const })),
        niceToHave: jdAnalysis.requirements.niceToHave.map((r: any) => ({ ...r, category: 'nice-to-have' as const }))
      },
      industryStandards,
      professionBenchmarks,
      atsKeywords: jdAnalysis.atsKeywords,
      roleProfile: jdAnalysis.roleProfile,
      gapAnalysis: {
        commonlyMissing: gapAnalysis.commonlyMissing || [],
        differentiators: differentiators,
        riskAreas: gapAnalysis.riskAreas || []
      }
    };

    console.log('Analysis complete:', {
      required: result.jobRequirements.required.length,
      preferred: result.jobRequirements.preferred.length,
      industryStandards: result.industryStandards.length,
      professionBenchmarks: result.professionBenchmarks.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-job-requirements:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        jobRequirements: { required: [], preferred: [], niceToHave: [] },
        industryStandards: [],
        professionBenchmarks: [],
        atsKeywords: { critical: [], important: [], bonus: [] },
        roleProfile: { title: '', level: 'mid', industry: '', function: '' },
        gapAnalysis: { commonlyMissing: [], differentiators: [], riskAreas: [] }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
