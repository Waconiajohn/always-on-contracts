import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationResult {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
  parsedData?: any;
  missingData?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    // Support both old and new parameter names for backwards compatibility
    const resumeId = body.resumeId || body.vaultId;
    const sessionId = body.sessionId;
    const userId = body.userId;

    if (!resumeId || !userId) {
      throw new Error('resumeId and userId are required');
    }

    console.log(`[VERIFY-RESUME-DATA] Starting verification for resume: ${resumeId}`);

    // Fetch all relevant data
    const [resumeRes, workRes, eduRes, milestonesRes] = await Promise.all([
      supabase.from('career_vault').select('resume_raw_text, user_id').eq('id', resumeId).single(),
      supabase.from('vault_work_positions').select('*').eq('vault_id', resumeId),
      supabase.from('vault_education').select('*').eq('vault_id', resumeId),
      supabase.from('vault_resume_milestones').select(`
        *,
        work_position:vault_work_positions!work_position_id (
          id,
          company_name,
          job_title,
          start_date,
          end_date,
          is_current
        )
      `).eq('vault_id', resumeId)
    ]);

    if (resumeRes.error) throw resumeRes.error;
    const resume = resumeRes.data.resume_raw_text || '';
    const verificationResults: VerificationResult[] = [];
    let discrepanciesCount = 0;

    // Verification 1: Resume Text Exists
    if (!resume || resume.length < 100) {
      verificationResults.push({
        category: 'Resume Source',
        status: 'fail',
        message: 'Original resume text missing or too short',
        details: `Resume length: ${resume?.length || 0} characters (minimum 100 required)`
      });
      discrepanciesCount++;
    } else {
      verificationResults.push({
        category: 'Resume Source',
        status: 'pass',
        message: 'Original resume text found',
        details: `${resume.length} characters stored`
      });
    }

    // Verification 2: Work Experience Extraction
    const workPositions = workRes.data || [];
    const workKeywords = ['experience', 'position', 'role', 'company', 'employer', 'work history'];
    const hasWorkSection = workKeywords.some(kw => resume.toLowerCase().includes(kw));
    
    if (hasWorkSection && workPositions.length === 0) {
      verificationResults.push({
        category: 'Work Experience',
        status: 'fail',
        message: 'Resume mentions work experience but none extracted',
        details: 'Resume contains work-related keywords but no positions were parsed into database',
        missingData: ['work_positions']
      });
      discrepanciesCount++;
    } else if (workPositions.length > 0) {
      const companies = workPositions.map(wp => wp.company_name).filter(Boolean);
      const companiesInResume = companies.filter(c => 
        resume.toLowerCase().includes(c.toLowerCase())
      );
      
      const status = companiesInResume.length === companies.length ? 'pass' : 'warning';
      if (status === 'warning') discrepanciesCount++;
      
      verificationResults.push({
        category: 'Work Experience',
        status,
        message: `${workPositions.length} positions extracted`,
        details: `${companiesInResume.length}/${companies.length} company names verified in original resume`,
        parsedData: workPositions
      });
    } else {
      verificationResults.push({
        category: 'Work Experience',
        status: 'warning',
        message: 'No work experience found',
        details: 'Neither in resume text nor in database'
      });
      discrepanciesCount++;
    }

    // Verification 3: Education Extraction
    const education = eduRes.data || [];
    const eduKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
    const hasEduSection = eduKeywords.some(kw => resume.toLowerCase().includes(kw));
    
    if (hasEduSection && education.length === 0) {
      verificationResults.push({
        category: 'Education',
        status: 'fail',
        message: 'Resume mentions education but none extracted',
        details: 'Resume contains education keywords but no degrees were parsed',
        missingData: ['education']
      });
      discrepanciesCount++;
    } else if (education.length > 0) {
      const institutions = education.map(e => e.institution_name).filter(Boolean);
      const institutionsInResume = institutions.filter(inst => 
        resume.toLowerCase().includes(inst.toLowerCase())
      );
      
      const status = institutionsInResume.length === institutions.length ? 'pass' : 'warning';
      if (status === 'warning') discrepanciesCount++;
      
      verificationResults.push({
        category: 'Education',
        status,
        message: `${education.length} education records extracted`,
        details: `${institutionsInResume.length}/${institutions.length} institutions verified in original resume`,
        parsedData: education
      });
    } else {
      verificationResults.push({
        category: 'Education',
        status: 'warning',
        message: 'No education records found',
        details: 'Neither in resume text nor in database'
      });
      discrepanciesCount++;
    }

    // Verification 4: Milestones/Achievements
    const milestones = milestonesRes.data || [];
    const achievementKeywords = ['achievement', 'accomplishment', 'milestone', 'award', 'recognition'];
    const hasAchievements = achievementKeywords.some(kw => resume.toLowerCase().includes(kw));
    
    if (milestones.length > 0) {
      verificationResults.push({
        category: 'Milestones',
        status: 'pass',
        message: `${milestones.length} milestones extracted`,
        details: `Successfully parsed career milestones from resume`,
        parsedData: milestones
      });
    } else if (hasAchievements) {
      verificationResults.push({
        category: 'Milestones',
        status: 'warning',
        message: 'Achievements mentioned but not fully extracted',
        details: 'Resume contains achievement keywords but milestones table is empty',
        missingData: ['milestones']
      });
      discrepanciesCount++;
    } else {
      verificationResults.push({
        category: 'Milestones',
        status: 'pass',
        message: 'No explicit milestones section',
        details: 'Resume does not have a dedicated achievements section'
      });
    }

    // Verification 5: Data Completeness
    const totalStructuredItems = workPositions.length + education.length + milestones.length;
    if (totalStructuredItems === 0) {
      verificationResults.push({
        category: 'Overall Completeness',
        status: 'fail',
        message: 'No structured data extracted from resume',
        details: 'Critical: Resume text exists but no work, education, or milestones were parsed'
      });
      discrepanciesCount++;
    } else if (totalStructuredItems < 3) {
      verificationResults.push({
        category: 'Overall Completeness',
        status: 'warning',
        message: 'Limited structured data extracted',
        details: `Only ${totalStructuredItems} total items across all structured tables`
      });
      discrepanciesCount++;
    } else {
      verificationResults.push({
        category: 'Overall Completeness',
        status: 'pass',
        message: 'Adequate structured data extraction',
        details: `${totalStructuredItems} items successfully parsed and stored`
      });
    }

    // Determine overall status
    const failCount = verificationResults.filter(r => r.status === 'fail').length;
    const warnCount = verificationResults.filter(r => r.status === 'warning').length;
    const overallStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warning' : 'pass';

    // Save verification results
    const { error: saveError } = await supabase
      .from('resume_verification_results')
      .insert({
        vault_id: resumeId,
        user_id: userId,
        session_id: sessionId,
        verification_status: overallStatus,
        results: verificationResults,
        discrepancies_found: discrepanciesCount,
        auto_remediation_attempted: false,
        remediation_status: discrepanciesCount > 0 ? 'pending' : null
      });

    if (saveError) {
      console.error('[VERIFY-RESUME-DATA] Error saving results:', saveError);
    }

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'resume_verification',
      description: `Resume verification completed: ${overallStatus} (${discrepanciesCount} discrepancies)`,
      metadata: {
        resume_id: resumeId,
        session_id: sessionId,
        status: overallStatus,
        discrepancies: discrepanciesCount
      }
    });

    console.log(`[VERIFY-RESUME-DATA] Verification complete for resume ${resumeId}: ${overallStatus} (${discrepanciesCount} discrepancies)`);

    return new Response(
      JSON.stringify({
        success: true,
        status: overallStatus,
        results: verificationResults,
        discrepanciesCount,
        requiresRemediation: discrepanciesCount > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('[VERIFY-RESUME-DATA] Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
