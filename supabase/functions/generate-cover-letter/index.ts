import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, jobTitle, companyName, jobDescription, tone, emphasis } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating cover letter for user:', user.id);

    // Build the prompt for AI
    const toneGuidelines: Record<string, string> = {
      professional: "Maintain a formal, business-appropriate tone with polished language.",
      enthusiastic: "Use energetic language that conveys genuine excitement about the opportunity.",
      confident: "Write with assertive, self-assured language that demonstrates expertise.",
      conversational: "Use a warm, personable tone while maintaining professionalism."
    };

    const emphasisGuidelines: Record<string, string> = {
      achievements: "Focus heavily on quantifiable results and accomplishments with specific metrics.",
      skills: "Emphasize technical capabilities, tools, and methodologies mastered.",
      leadership: "Highlight team management, mentoring, and organizational impact.",
      innovation: "Showcase creative problem-solving and transformative initiatives."
    };

    const prompt = `You are an expert executive career coach. Write a compelling cover letter based on:

RESUME CONTENT:
${resumeContent}

JOB DETAILS:
- Title: ${jobTitle || 'Not specified'}
- Company: ${companyName || 'Not specified'}
- Description: ${jobDescription}

STYLE REQUIREMENTS:
- Tone: ${tone} - ${toneGuidelines[tone] || 'Professional'}
- Emphasis: ${emphasis} - ${emphasisGuidelines[emphasis] || 'Balanced approach'}

REQUIREMENTS:
1. Date at top (use format: Month DD, YYYY)
2. Professional salutation (Dear Hiring Manager or use name if found in job description)
3. Opening paragraph: Express interest and briefly state why you're a strong fit
4. 2-3 body paragraphs:
   - Highlight 2-3 most relevant achievements from resume
   - Connect experience to specific job requirements
   - Show understanding of company's mission/values
   - Include specific metrics and results
5. Closing paragraph: Express enthusiasm and request interview
6. Professional signature block

CRITICAL GUIDELINES:
- Keep total length to 3-4 paragraphs (under 400 words)
- Use specific examples from the resume
- Match keywords from job description naturally
- Avoid generic phrases like "I believe I would be a great fit"
- Demonstrate research about the company
- Show passion for the specific role and company
- End with clear call-to-action

Format as plain text with proper spacing between paragraphs.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert executive career coach specializing in creating compelling cover letters that get interviews. You understand how to position senior leaders for their next role.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.8,
        max_tokens: 1200,
        return_citations: false,
      },
      'generate-cover-letter',
      user.id
    );

    await logAIUsage(metrics);

    const coverLetter = cleanCitations(response.choices[0].message.content);

    console.log('Cover letter generated successfully');

    // Save to database
    try {
      await supabase.from('cover_letters').insert({
        user_id: user.id,
        job_title: jobTitle,
        company_name: companyName,
        content: coverLetter,
        tone: tone,
        emphasis: emphasis,
        job_description: jobDescription
      });
    } catch (saveError) {
      console.error('Error saving cover letter:', saveError);
      // Don't fail the request if saving fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        coverLetter,
        metadata: {
          tone,
          emphasis,
          wordCount: coverLetter.split(/\s+/).length,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-cover-letter function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
