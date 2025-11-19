import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('analyze-ats-score');

  try {
    const body = await req.json();
    const { 
      jobTitle, 
      jobDescription, 
      industry, 
      canonicalHeader, 
      canonicalSections,
      // Legacy fallback
      resumeContent 
    } = body;

    // Handle legacy API or new canonical API
    let resumeText = '';
    
    if (canonicalSections && canonicalHeader) {
      // New canonical format
      resumeText = `HEADER:\n`;
      if (canonicalHeader.fullName) resumeText += `Name: ${canonicalHeader.fullName}\n`;
      if (canonicalHeader.headline) resumeText += `Headline: ${canonicalHeader.headline}\n`;
      if (canonicalHeader.contactLine) resumeText += `Contact: ${canonicalHeader.contactLine}\n`;
      
      resumeText += `\nSECTIONS:\n`;
      for (const section of canonicalSections) {
        resumeText += `\n[${section.heading}]\n`;
        if (section.paragraph) resumeText += `${section.paragraph}\n`;
        for (const bullet of section.bullets) {
          resumeText += `• ${bullet}\n`;
        }
      }
    } else if (resumeContent) {
      // Legacy format
      resumeText = resumeContent;
    } else {
      return new Response(
        JSON.stringify({ error: 'Resume content or canonical sections are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an ATS and resume alignment engine. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:

You receive a job description and a canonical resume (header + sections).
Extract a keyword set with priority tiers:
- "must_have": critical skills, tools, certifications, domains, and titles that strongly predict success.
- "nice_to_have": valuable but not required.
- "industry_standard": common language and patterns used for this role/industry.

Evaluate coverage per section and overall.

Rules:
- DO NOT fabricate content; only evaluate what appears in the resume.
- When a keyword is only partially matched (e.g., "Salesforce" vs. "CRM"), count it as partially covered by including it with importanceScore lowered.
- Score coverage 0–100.
- Keep JSON tight and valid, no extra commentary.

Return JSON matching this structure:
{
  "summary": {
    "overallScore": 85,
    "mustHaveCoverage": 90,
    "niceToHaveCoverage": 75,
    "industryCoverage": 80
  },
  "perSection": [
    {
      "sectionId": "section-1",
      "sectionHeading": "Professional Experience",
      "coverageScore": 85,
      "matchedKeywords": [
        {"phrase": "project management", "priority": "must_have", "importanceScore": 95}
      ],
      "missingKeywords": [
        {"phrase": "Agile", "priority": "must_have", "importanceScore": 90}
      ]
    }
  ],
  "allMatchedKeywords": [...],
  "allMissingKeywords": [...],
  "narrative": "Brief summary of alignment"
}`;

    const userPrompt = `JOB TITLE: ${jobTitle || 'Unknown'}
INDUSTRY: ${industry || 'Unknown'}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Analyze keyword coverage and ATS compatibility.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      'analyze-ats-score'
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    logger.debug('Raw AI response', { preview: rawContent.substring(0, 500) });

    const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON from response with production-grade extraction
    const parseResult = extractJSON(cleanedContent);

    if (!parseResult.success || !parseResult.data) {
      logger.error('JSON parsing failed', {
        error: parseResult.error,
        content: cleanedContent.substring(0, 500)
      });
      throw new Error('Failed to parse JSON from AI response');
    }

    const scoreData = parseResult.data;

    // Validate required fields
    if (!scoreData.summary || typeof scoreData.summary !== 'object') {
      throw new Error('Missing or invalid summary object');
    }
    if (typeof scoreData.summary.overallScore !== 'number') {
      throw new Error('Missing or invalid overallScore');
    }
    if (!Array.isArray(scoreData.perSection)) {
      throw new Error('Missing or invalid perSection array');
    }

    // Ensure proper structure for new format
    const validatedData = {
      summary: {
        overallScore: Math.min(100, Math.max(0, scoreData.summary?.overallScore || scoreData.overallScore || 0)),
        mustHaveCoverage: Math.min(100, Math.max(0, scoreData.summary?.mustHaveCoverage || 0)),
        niceToHaveCoverage: Math.min(100, Math.max(0, scoreData.summary?.niceToHaveCoverage || 0)),
        industryCoverage: Math.min(100, Math.max(0, scoreData.summary?.industryCoverage || 0)),
      },
      perSection: Array.isArray(scoreData.perSection) ? scoreData.perSection : [],
      allMatchedKeywords: Array.isArray(scoreData.allMatchedKeywords) ? scoreData.allMatchedKeywords : [],
      allMissingKeywords: Array.isArray(scoreData.allMissingKeywords) ? scoreData.allMissingKeywords : [],
      narrative: scoreData.narrative || undefined,
      
      // Legacy fields for backwards compatibility
      overallScore: Math.min(100, Math.max(0, scoreData.overallScore || scoreData.summary?.overallScore || 0)),
      keywordMatch: Math.min(100, Math.max(0, scoreData.keywordMatch || 0)),
      formatScore: Math.min(100, Math.max(0, scoreData.formatScore || 0)),
      experienceMatch: Math.min(100, Math.max(0, scoreData.experienceMatch || 0)),
      skillsMatch: Math.min(100, Math.max(0, scoreData.skillsMatch || 0)),
      strengths: Array.isArray(scoreData.strengths) ? scoreData.strengths : [],
      warnings: Array.isArray(scoreData.warnings) ? scoreData.warnings : [],
      recommendations: Array.isArray(scoreData.recommendations) ? scoreData.recommendations : [],
    };

    return new Response(
      JSON.stringify(validatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-ats-score:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
