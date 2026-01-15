// =====================================================
// SUGGEST CAREER PATHS - Career Vault 2.0
// =====================================================
// AI-POWERED CAREER INTELLIGENCE
//
// This function uses advanced AI to suggest career paths based on:
// - Your actual experience and skills
// - Market demand and trends
// - Transferability of your background
// - Industry growth patterns
//
// UNIQUE VALUE: Unlike job boards that just match keywords,
// we identify opportunities you might never have considered.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface CareerPathRequest {
  resumeAnalysis: {
    detectedRole: string;
    detectedIndustry: string;
    yearsExperience: number;
    seniorityLevel: string;
    keyAchievements: string[];
  };
  careerDirection: 'stay' | 'pivot' | 'explore';
  currentRole: string;
  currentIndustry: string;
  resumeId?: string;
  resumeText?: string;
}

interface SuggestedRole {
  title: string;
  reasoning: string;
  matchScore: number; // 0-1
  matchBreakdown?: {
    technicalSkills: number; // 0-1
    leadership: number; // 0-1
    industryAlignment: number; // 0-1
  };
  resumeEvidence?: string[]; // Quotes from resume that support this match
  skillsAlignment: string[];
  skillsGap: string[];
  marketDemand: 'high' | 'medium' | 'low';
  salaryPotential: string;
}

interface SuggestedIndustry {
  industry: string;
  reasoning: string;
  transferability: number; // 0-1
  growthTrend: 'growing' | 'stable' | 'declining';
  whyYouMatch: string;
}

interface CareerPathResponse {
  suggestedRoles: SuggestedRole[];
  suggestedIndustries: SuggestedIndustry[];
  marketInsights: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('[suggest-career-paths] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const body: CareerPathRequest = await req.json();
    const {
      resumeAnalysis,
      careerDirection,
      currentRole,
      currentIndustry,
      resumeId,
      resumeText: providedResumeText
    } = body;

    console.log('🚀 Generating career path suggestions:', {
      direction: careerDirection,
      currentRole,
      seniority: resumeAnalysis.seniorityLevel,
      hasResumeId: !!resumeId,
      hasResumeText: !!providedResumeText
    });

    // For "stay" direction, fetch full resume text for deeper analysis
    let fullResumeText = providedResumeText;
    if (careerDirection === 'stay' && !fullResumeText && resumeId) {
      const { data: resume } = await supabaseClient
        .from('career_vault')
        .select('resume_raw_text')
        .eq('id', resumeId)
        .single();
      
      fullResumeText = resume?.resume_raw_text;
      console.log('📄 Fetched resume text from Master Resume:', !!fullResumeText);
    }

    // Build context-aware prompt based on career direction
    let systemPrompt = '';
    let userPrompt = '';

    if (careerDirection === 'stay') {
      systemPrompt = `You are an elite executive career strategist specializing in SAME-FIELD ADVANCEMENT.

Your task: Analyze the FULL RESUME to suggest roles and industries that represent natural progression within their field.

CRITICAL: You have access to the complete resume. Use SPECIFIC DETAILS from it to:
1. Identify exact technical skills, tools, and methodologies they've used
2. Spot industry-specific experience and certifications
3. Find leadership indicators (team sizes, budget managed, cross-functional work)
4. Detect specialized expertise that makes them uniquely qualified

FOCUS ON:
- Next-level roles based on ACTUAL experience depth (not just title)
- Industry specializations they've already touched (even tangentially)
- Roles where their specific skill combination is rare and valuable
- Companies/sectors that pay premium for their exact background

IMPORTANT: For INDUSTRIES, be SPECIFIC:
- Don't just say "Technology" - suggest "Cloud Infrastructure" or "SaaS B2B"
- Not "Healthcare" - "MedTech Devices" or "Healthcare IT"
- Not "Finance" - "Investment Banking" or "FinTech Payments"
- Extract ANY industry they've worked in or served as clients

Return 6-8 role suggestions and 4-6 industry suggestions, all ranked by fit.`;

      userPrompt = `CURRENT POSITION:
Role: ${currentRole}
Industry: ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years

${fullResumeText ? `FULL RESUME TEXT FOR DEEP ANALYSIS:
${fullResumeText}

INSTRUCTIONS: 
- Mine this resume for SPECIFIC skills, tools, industries, and experience
- Suggest roles that leverage their ACTUAL proven capabilities
- For industries, identify EVERY sector they've touched (even as clients/vendors)
- Be specific with industry suggestions - no generic categories
- Extract concrete evidence from the resume to support each suggestion` : `KEY ACHIEVEMENTS:
${resumeAnalysis.keyAchievements.slice(0, 5).join('\n')}

INSTRUCTIONS:
- Use these achievements to infer career advancement opportunities
- Suggest specific roles that build on proven accomplishments`}

Analyze deeply and suggest career paths that maximize their unique background.`;

    } else if (careerDirection === 'pivot') {
      systemPrompt = `You are an elite executive career strategist specializing in CAREER TRANSITIONS and PIVOTS.

Your task: Analyze the FULL RESUME to identify adjacent roles and industries where their skills are HIGHLY TRANSFERABLE.

CRITICAL: You have access to the complete resume. Use SPECIFIC DETAILS from it to:
1. Identify transferable technical and soft skills
2. Spot cross-industry experience patterns (vendors, clients, partnerships)
3. Find emerging fields where their unique background is valuable
4. Detect underrated pivot opportunities with high demand

FOCUS ON:
- Cross-industry moves (e.g., Oil & Gas → Renewable Energy, Finance → FinTech)
- Cross-functional pivots (e.g., Engineering → Product Management, Operations → Consulting)
- Emerging fields where their experience is rare and valuable
- Adjacent markets they've touched through clients, vendors, or projects
- Roles where their skill combination creates unique competitive advantage

IMPORTANT: For INDUSTRIES, be SPECIFIC:
- Don't say "Technology" - say "Cloud Infrastructure" or "Cybersecurity SaaS"
- Not "Healthcare" - "Digital Health Platforms" or "Medical Device Innovation"
- Not "Finance" - "Crypto/Blockchain" or "Embedded Finance"
- Extract ANY adjacent industry they've interacted with (clients, suppliers, partners)

BE CREATIVE but REALISTIC. Base pivots on actual resume evidence.

Return 6-8 role suggestions and 4-6 industry suggestions, all with clear transferability reasoning.`;

      userPrompt = `CURRENT POSITION:
Role: ${currentRole}
Industry: ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years

${fullResumeText ? `FULL RESUME TEXT FOR DEEP ANALYSIS:
${fullResumeText}

INSTRUCTIONS: 
- Mine this resume for SPECIFIC skills and experiences that transfer to adjacent fields
- Identify every industry/sector they've touched (even indirectly through clients, vendors, projects)
- Suggest roles that leverage their ACTUAL proven capabilities in new contexts
- For industries, identify specific sectors or market segments (no generic categories)
- Show clear transferability paths with concrete evidence from their background` : `KEY ACHIEVEMENTS:
${resumeAnalysis.keyAchievements.slice(0, 5).join('\n')}

INSTRUCTIONS:
- Use these achievements to infer transferable skills and pivot opportunities
- Suggest specific roles and industries that build on proven accomplishments in new directions`}

Suggest realistic career pivot opportunities with clear transferability reasoning.`;

    } else { // explore
      systemPrompt = `You are an elite executive career strategist specializing in CAREER EXPLORATION and OPPORTUNITY DISCOVERY.

Your task: Analyze the FULL RESUME to present a DIVERSE portfolio of career options spanning multiple paths.

CRITICAL: You have access to the complete resume. Use SPECIFIC DETAILS from it to:
1. Identify advancement opportunities in their current field
2. Spot adjacent pivot possibilities based on transferable skills
3. Find bold career changes where their unique background creates unexpected opportunities
4. Detect entrepreneurial or consulting paths based on their expertise

PORTFOLIO STRUCTURE:
- Advancement in current field (2-3 options) - next-level roles based on ACTUAL experience depth
- Adjacent pivots (3-4 options) - cross-industry or cross-functional moves with clear transferability
- Bold career changes (2-3 options) - creative opportunities that leverage their unique background
- Entrepreneurial/consultant paths (1-2 options) - areas where they could build a practice or business

IMPORTANT: For INDUSTRIES, be SPECIFIC:
- Don't say "Consulting" - say "Energy Transition Advisory" or "Supply Chain Optimization"
- Not "Entrepreneurship" - "SaaS for [their industry]" or "[Specific] Coaching Practice"
- Extract their domain expertise and suggest specific niches or markets

BE BOLD but GROUNDED IN EVIDENCE. Show them possibilities they haven't considered, but base suggestions on their actual background.

Return 8-12 suggestions that span the complete opportunity landscape, with clear reasoning for each path.`;

      userPrompt = `CURRENT POSITION:
Role: ${currentRole}
Industry: ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years

${fullResumeText ? `FULL RESUME TEXT FOR DEEP ANALYSIS:
${fullResumeText}

INSTRUCTIONS: 
- Mine this resume for SPECIFIC skills, domain expertise, and unique experiences
- Show advancement, pivots, bold changes, AND entrepreneurial paths
- Suggest roles/paths that leverage their ACTUAL background in creative ways
- For industries, identify specific niches or markets where they could thrive
- Be creative but ground every suggestion in concrete evidence from their resume
- Show them opportunities they likely haven't considered` : `KEY BACKGROUND:
${resumeAnalysis.keyAchievements.slice(0, 5).join('\n')}

INSTRUCTIONS:
- Use this background to infer diverse career possibilities
- Span the full range: advancement, pivots, bold changes, entrepreneurial paths
- Be creative in showing opportunities they might not have considered`}

Present a DIVERSE portfolio of career possibilities across all paths.`;
    }

    // Call Lovable AI
    const { response: aiData, metrics: aiMetrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

RETURN VALID JSON ONLY:
{
  "suggestedRoles": [
    {
      "title": "VP of Engineering",
      "reasoning": "Natural progression from Director role with strong technical leadership",
      "matchScore": 0.95,
      "matchBreakdown": {
        "technicalSkills": 0.98,
        "leadership": 0.95,
        "industryAlignment": 0.92
      },
      "resumeEvidence": [
        "$350M budget management demonstrates executive-level financial responsibility",
        "Led team across 3-4 rigs shows multi-site leadership capability",
        "20% BHA failure reduction proves operational excellence"
      ],
      "skillsAlignment": ["Technical leadership", "Team scaling", "Architecture"],
      "skillsGap": ["Board-level communication", "P&L management"],
      "marketDemand": "high",
      "salaryPotential": "$200-300K"
    }
  ],
  "suggestedIndustries": [
    {
      "industry": "FinTech",
      "reasoning": "Financial services background + tech skills = high demand",
      "transferability": 0.9,
      "growthTrend": "growing",
      "whyYouMatch": "Regulatory expertise and technical depth are rare combination"
    }
  ],
  "marketInsights": "2-3 sentence summary of current market trends relevant to this person"
}

CRITICAL: For each role, EXTRACT 2-3 SPECIFIC QUOTES from the user's achievements that prove the match. Use exact phrases or numbers from their background.

NO MARKDOWN. ONLY JSON.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      },
      'suggest-career-paths',
      user.id
    );

    await logAIUsage(aiMetrics);

    const aiContent = aiData.choices[0].message.content;

    let suggestions: CareerPathResponse;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid format');
    }

    console.log('✅ Career paths generated:', {
      roles: suggestions.suggestedRoles.length,
      industries: suggestions.suggestedIndustries.length,
    });

    // Return with marketing messaging
    return new Response(
      JSON.stringify({
        success: true,
        data: suggestions,
        meta: {
          message: `🎯 AI-Powered Career Intelligence: We've analyzed ${suggestions.suggestedRoles.length} role opportunities and ${suggestions.suggestedIndustries.length} industry paths tailored to your background.`,
          uniqueValue: 'Unlike generic job boards, our AI identifies opportunities based on deep analysis of your transferable skills and market demand—not just keyword matching.',
          confidenceNote: `Match scores indicate how well your background aligns. Scores above 0.8 are excellent fits; above 0.6 are worth exploring.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in suggest-career-paths:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'We encountered an issue generating career suggestions. Please try again.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
