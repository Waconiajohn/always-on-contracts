import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hiring Manager Final Polish
 * 
 * The ultimate step: AI becomes a hyper-critical hiring manager who:
 * 1. Reviews the resume from their specific persona perspective
 * 2. Provides one-click refinements with projected score impact
 * 3. Iterates until "DEFINITELY would hire"
 * 4. Uses Perplexity for real-time market intelligence
 */

interface HiringManagerPersona {
  name: string;
  title: string;
  yearsHiring: number;
  companyType: string;
  petPeeves: string[];
  whatImpressesThem: string[];
  communicationStyle: string;
}

function generatePersona(jobTitle: string, industry: string): HiringManagerPersona {
  const personas: Record<string, Partial<HiringManagerPersona>> = {
    product: {
      name: 'Sarah Chen',
      title: 'VP of Product',
      petPeeves: ['Generic summaries', 'Buzzwords without proof', 'No quantified impact'],
      whatImpressesThem: ['Specific revenue metrics', 'Unique frameworks', 'Strategic thinking evidence']
    },
    engineering: {
      name: 'Marcus Rodriguez',
      title: 'Engineering Director',
      petPeeves: ['Vague tech descriptions', 'No scale metrics', 'Missing architecture decisions'],
      whatImpressesThem: ['System design examples', 'Performance improvements', 'Open source contributions']
    },
    sales: {
      name: 'Jennifer Thompson',
      title: 'VP of Sales',
      petPeeves: ['No quota attainment', 'Missing deal sizes', 'Vague relationship building'],
      whatImpressesThem: ['Specific revenue numbers', 'Client logos', 'Sales cycle metrics']
    },
    marketing: {
      name: 'David Park',
      title: 'CMO',
      petPeeves: ['No campaign ROI', 'Generic brand statements', 'Missing growth metrics'],
      whatImpressesThem: ['Acquisition costs', 'Conversion rates', 'Brand impact stories']
    },
    operations: {
      name: 'Rachel Williams',
      title: 'COO',
      petPeeves: ['No efficiency gains', 'Vague process improvements', 'Missing scale'],
      whatImpressesThem: ['Cost savings', 'Process automation', 'Team scalability']
    }
  };

  // Detect persona type from job title
  const lowerTitle = jobTitle.toLowerCase();
  let personaType = 'operations';
  if (lowerTitle.includes('product') || lowerTitle.includes('pm')) personaType = 'product';
  else if (lowerTitle.includes('engineer') || lowerTitle.includes('developer') || lowerTitle.includes('software')) personaType = 'engineering';
  else if (lowerTitle.includes('sales') || lowerTitle.includes('account')) personaType = 'sales';
  else if (lowerTitle.includes('marketing') || lowerTitle.includes('growth') || lowerTitle.includes('brand')) personaType = 'marketing';

  const base = personas[personaType] || personas.operations;

  return {
    name: base.name || 'Alex Johnson',
    title: base.title || 'Hiring Manager',
    yearsHiring: 12 + Math.floor(Math.random() * 8),
    companyType: `$${100 + Math.floor(Math.random() * 400)}M ${industry} company`,
    petPeeves: base.petPeeves || ['Generic content', 'No metrics', 'Unclear impact'],
    whatImpressesThem: base.whatImpressesThem || ['Specific achievements', 'Clear progression', 'Relevant experience'],
    communicationStyle: 'Direct but constructive, uses real examples from experience'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      resumeContent, 
      jobDescription, 
      jobTitle, 
      industry,
      currentScore,
      industryBenchmark 
    } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    // Generate persona
    const persona = generatePersona(jobTitle || 'Professional', industry || 'Technology');

    const systemPrompt = `You are ${persona.name}, ${persona.title} at a ${persona.companyType}. You've been hiring for ${persona.yearsHiring} years and have seen thousands of resumes.

YOUR PERSONALITY:
- Communication style: ${persona.communicationStyle}
- Pet peeves: ${persona.petPeeves.join(', ')}
- What impresses you: ${persona.whatImpressesThem.join(', ')}

YOUR TASK: Review this resume with brutal honesty but constructive feedback. You're not trying to be mean - you're trying to help this candidate actually get hired.

For each issue you find, you MUST provide:
1. The exact current text that's problematic
2. A specific rewritten version that would work better
3. Why the change matters (from a hiring manager's perspective)
4. Estimated score impact

SCORING GUIDE:
- "DEFINITELY would interview" = 85+ score, strong match, minor polish only
- "PROBABLY would interview" = 70-84 score, good foundation, needs some work
- "MAYBE would interview" = 55-69 score, potential but significant gaps
- "UNLIKELY to interview" = 40-54 score, major issues to address
- "WOULD NOT interview" = <40 score, fundamental problems

Return ONLY valid JSON:
{
  "verdict": {
    "would_interview": "definitely|probably|maybe|unlikely|no",
    "confidence": 0-100,
    "overall_impression": "Your honest assessment in first person",
    "first_impression_seconds": "What I noticed in first 6 seconds"
  },
  "persona": {
    "name": "${persona.name}",
    "title": "${persona.title}",
    "years_hiring": ${persona.yearsHiring},
    "harsh_truth": "The thing I wasn't going to say but you need to hear"
  },
  "refinements": [
    {
      "id": "ref-1",
      "section": "Professional Summary|Experience|Skills|etc",
      "severity": "critical|high|medium|low",
      "current_text": "Exact text from resume",
      "suggested_fix": "Better version",
      "hiring_manager_perspective": "Why this matters to me",
      "score_impact": "+X pts",
      "apply_action": "one_click"
    }
  ],
  "strengths": [
    {
      "what": "Something strong",
      "why_it_matters": "Why this would make me take notice"
    }
  ],
  "deal_breakers": ["Any absolute no-go issues"],
  "missing_elements": ["Things I expected to see but didn't"],
  "projected_after_fixes": {
    "would_interview": "definitely|probably|maybe|unlikely|no",
    "score": 0-100,
    "message": "What I'd think after these changes"
  }
}`;

    const userPrompt = `JOB: ${jobTitle || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}
CURRENT SCORE: ${currentScore || 'Unknown'}/100

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeContent}

${industryBenchmark ? `INDUSTRY CONTEXT: This role typically requires: ${JSON.stringify(industryBenchmark)}` : ''}

Review this resume as if a recruiter just handed it to you. Be thorough, be honest, and provide actionable fixes.`;

    let reviewData;

    // Try Perplexity first for real-time market context
    if (perplexityApiKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (perplexityResponse.ok) {
          const data = await perplexityResponse.json();
          const reviewText = data.choices?.[0]?.message?.content;
          if (reviewText) {
            const cleanedContent = reviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            reviewData = JSON.parse(cleanedContent);
          }
        }
      } catch (perplexityError) {
        console.log('Perplexity failed, falling back to Lovable AI:', perplexityError);
      }
    }

    // Fallback to Lovable AI if Perplexity fails
    if (!reviewData) {
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableApiKey) {
        throw new Error('No AI API keys configured');
      }

      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!lovableResponse.ok) {
        throw new Error(`AI API error: ${lovableResponse.status}`);
      }

      const data = await lovableResponse.json();
      const reviewText = data.choices?.[0]?.message?.content;
      const cleanedContent = reviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      reviewData = JSON.parse(cleanedContent);
    }

    // Validate and structure response
    if (!reviewData.verdict) {
      throw new Error('Invalid review data structure');
    }

    // Add score calculations if not present
    if (!reviewData.projected_after_fixes?.score && reviewData.refinements?.length) {
      const totalImpact = reviewData.refinements.reduce((acc: number, r: any) => {
        const impact = parseInt(r.score_impact?.replace(/[^0-9]/g, '') || '0');
        return acc + impact;
      }, 0);
      
      reviewData.projected_after_fixes = {
        ...reviewData.projected_after_fixes,
        score: Math.min(100, (currentScore || 50) + totalImpact)
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        review: reviewData,
        persona,
        reviewed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hiring-manager-final-polish:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
