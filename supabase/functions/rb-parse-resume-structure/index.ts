import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI } from "../_shared/lovableAI.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Parsed resume structure interface matching UI expectations
interface ParsedResume {
  header?: {
    fullName?: string;
    headline?: string;
    contactLine?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: string;
  skills?: string[] | {
    hard_skills?: string[];
    tools?: string[];
    domain?: string[];
    soft_skills?: string[];
  };
  experience?: Array<{
    job_title?: string;
    company?: string;
    dates?: string;
    location?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    date?: string;
    year?: string;
  }>;
  certifications?: string[];
}

const PARSE_PROMPT = `You are an expert resume parser. Extract structured sections from this resume text.

RESUME TEXT:
{resume_text}

Return ONLY valid JSON matching this exact structure:
{
  "header": {
    "fullName": "The person's full name",
    "headline": "Professional headline/title if present",
    "contactLine": "Combined contact info line",
    "email": "email@example.com",
    "phone": "(123) 456-7890",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username"
  },
  "summary": "The professional summary or objective paragraph",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "job_title": "Job Title",
      "company": "Company Name",
      "dates": "Jan 2020 - Present",
      "location": "City, State",
      "bullets": [
        "Achievement or responsibility 1",
        "Achievement or responsibility 2"
      ]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "date": "2020"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"]
}

IMPORTANT RULES:
1. Extract ONLY what is explicitly in the resume - do not invent information
2. If a section is not present, omit it or use null
3. For experience bullets, preserve the exact wording
4. Skills can be a flat array or categorized object based on resume structure
5. Return ONLY the JSON object, no markdown code blocks or explanations`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[rb-parse-resume-structure] Missing or invalid auth header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[rb-parse-resume-structure] Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { project_id } = await req.json();
    
    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[rb-parse-resume-structure] Processing project: ${project_id}`);

    // Load the resume document
    const { data: doc, error: docError } = await supabase
      .from('rb_documents')
      .select('id, raw_text, parsed_json')
      .eq('project_id', project_id)
      .eq('doc_type', 'resume')
      .maybeSingle();

    if (docError) {
      console.error('[rb-parse-resume-structure] DB error:', docError);
      throw new Error(`Database error: ${docError.message}`);
    }

    if (!doc) {
      return new Response(
        JSON.stringify({ success: false, error: 'No resume document found for this project' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if already parsed
    if (doc.parsed_json) {
      console.log('[rb-parse-resume-structure] Resume already has parsed_json, skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Already parsed', parsed: doc.parsed_json }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doc.raw_text || doc.raw_text.trim().length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume has insufficient text content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[rb-parse-resume-structure] Parsing ${doc.raw_text.length} chars`);

    // Call AI to parse the resume structure
    const prompt = PARSE_PROMPT.replace('{resume_text}', doc.raw_text);
    
    const response = await callLovableAI(
      [
        { role: 'system', content: 'You are an expert resume parser. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      'google/gemini-3-flash-preview',
      { temperature: 0, max_tokens: 4000 }
    );

    const rawContent = response.choices?.[0]?.message?.content || '';
    console.log(`[rb-parse-resume-structure] AI response length: ${rawContent.length}`);

    // Clean and parse the JSON response
    let cleanedContent = rawContent.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let parsed: ParsedResume;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error('[rb-parse-resume-structure] JSON parse error:', parseErr);
      console.error('[rb-parse-resume-structure] Raw content:', cleanedContent.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed structure');
    }

    console.log(`[rb-parse-resume-structure] Parsed successfully. Experience count: ${parsed.experience?.length || 0}`);

    // Update the document with parsed JSON
    const { error: updateError } = await supabase
      .from('rb_documents')
      .update({ parsed_json: parsed })
      .eq('id', doc.id);

    if (updateError) {
      console.error('[rb-parse-resume-structure] Update error:', updateError);
      throw new Error(`Failed to save parsed data: ${updateError.message}`);
    }

    console.log('[rb-parse-resume-structure] Successfully saved parsed_json');

    return new Response(
      JSON.stringify({
        success: true,
        parsed,
        sections: {
          hasHeader: !!parsed.header,
          hasSummary: !!parsed.summary,
          skillsCount: Array.isArray(parsed.skills) ? parsed.skills.length : 0,
          experienceCount: parsed.experience?.length || 0,
          educationCount: parsed.education?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[rb-parse-resume-structure] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to parse resume structure'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
