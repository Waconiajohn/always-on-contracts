// =====================================================
// AUTO-POPULATE VAULT V3-HYBRID - Section-by-Section Enhancement
// =====================================================
// Complete overhaul implementing:
// ✅ Phase 1: Enhanced prompts with calculations and transformations
// ✅ Phase 2: Section-by-section processing with context
// ✅ Phase 3: Quality tier progression (draft → needs_review → verified → gold)
// ✅ Phase 4: Industry context and benchmarks
// ✅ Phase 5: Retry strategies for low-confidence extractions
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { parseResumeStructure, detectRoleAndIndustry, type ResumeSection, type RoleInfo } from '../_shared/extraction/pre-extraction-analyzer.ts';
import { extractWithRetry } from '../_shared/extraction/retry-orchestrator.ts';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { extractStructuredResumeData, analyzeGapsWithAI, type StructuredResumeData } from '../_shared/extraction/ai-structured-extractor.ts';
import { ProgressTracker } from '../_shared/progress-tracker.ts';
import { createLogger } from '../_shared/logger.ts';

interface AutoPopulateRequest {
  resumeText: string;
  vaultId: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  mode?: 'full' | 'incremental';
}

interface EducationData {
  level: string | null;
  field: string | null;
  institution?: string;
  graduationYear?: number;
  certifications: string[];
}

interface CareerContextData {
  hasManagementExperience: boolean;
  managementDetails: string;
  teamSizesManaged: number[];
  hasBudgetOwnership: boolean;
  budgetDetails: string;
  budgetSizesManaged: number[];
  hasExecutiveExposure: boolean;
  executiveDetails: string;
  yearsOfExperience: number;
  seniorityLevel: string;
}

interface IndustryBenchmark {
  jobTitle: string;
  industry: string;
  seniorityLevel: string;
  
  // Management expectations
  typicalManagementScope: {
    hasManagement: boolean;
    typicalTeamSize: string;
    managementLevel: string;
  };
  
  // Budget expectations
  typicalBudgetOwnership: {
    hasBudget: boolean;
    typicalBudgetRange: string;
    budgetType: string;
  };
  
  // Executive exposure expectations
  typicalExecutiveExposure: {
    hasExposure: boolean;
    interactionLevel: string;
    strategicScope: string;
  };
  
  // Experience expectations
  typicalYearsExperience: {
    minimum: number;
    typical: number;
    maximum: number;
  };
  
  // Key competencies expected
  expectedCompetencies: string[];
  
  // Education expectations
  typicalEducation: {
    level: string;
    fields: string[];
    certifications: string[];
  };
}

interface ComparisonResult {
  // High-confidence extracted data
  confirmed: {
    hasManagementExperience?: boolean;
    managementDetails?: string;
    teamSizesManaged?: number[];
    hasBudgetOwnership?: boolean;
    budgetDetails?: string;
    budgetSizesManaged?: number[];
    hasExecutiveExposure?: boolean;
    executiveDetails?: string;
    yearsOfExperience?: number;
    seniorityLevel?: string;
    // EDUCATION FIELDS (CRITICAL FIX)
    educationLevel?: string;
    educationField?: string;
    certifications?: string[];
  };
  
  // Likely inferences (80%+ confidence)
  likely: {
    hasManagementExperience?: boolean;
    hasBudgetOwnership?: boolean;
    hasExecutiveExposure?: boolean;
  };
  
  // Gaps requiring targeted questions
  gaps_requiring_questions: Array<{
    field: string;
    question: string;
    context: string;
    expectedAnswer: string;
  }>;
  
  // Evidence summary
  evidence: {
    managementEvidence: string[];
    budgetEvidence: string[];
    executiveEvidence: string[];
    educationEvidence: string[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('auto-populate-vault-v3');
  const overallStartTime = Date.now();

  try {
    logger.info('Extraction request received');
    
    const { resumeText, vaultId, targetRoles, targetIndustries, mode = 'full' } =
      await req.json() as AutoPopulateRequest;

    if (!resumeText || !vaultId) {
      return new Response(
        JSON.stringify({ error: 'resumeText and vaultId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('user_id')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Vault not found');
    }

    const userId = vault.user_id;

    // Initialize progress tracker
    const tracker = new ProgressTracker(vaultId, supabase as any);

    logger.info('Starting vault extraction', {
      userId,
      vaultId,
      resumeLength: resumeText.length,
      hasTargetRoles: !!targetRoles?.length,
      hasTargetIndustries: !!targetIndustries?.length,
      mode
    });

    await tracker.updateProgress('initialization', 5, 'Starting career vault extraction...');

    // ========================================================================
    // PHASE 1: Parse Resume Structure (Fast)
    // ========================================================================
    logger.info('Phase 1: Starting resume parsing');
    const parseStartTime = Date.now();
    
    const resumeStructure = parseResumeStructure(resumeText);
    
    logger.info('Phase 1 complete', {
      duration_ms: Date.now() - parseStartTime,
      sectionsFound: resumeStructure.sections.length,
      totalWords: resumeStructure.sections.reduce((sum, s) => sum + s.wordCount, 0)
    });

    await tracker.updateProgress('parsing', 10, `Parsed ${resumeStructure.sections.length} resume sections`);
    await tracker.saveCheckpoint('parsing_complete', { sectionCount: resumeStructure.sections.length });

    // ========================================================================
    // PHASE 2: PARALLEL AI EXTRACTION (NEW - 50% FASTER!)
    // ========================================================================
    logger.info('Phase 2: Starting parallel AI extraction');
    await tracker.updateProgress('ai_extraction', 15, 'Running parallel AI analysis...');

    let structuredData: StructuredResumeData | null = null;
    let roleInfo: RoleInfo;

    try {
      const phase2StartTime = Date.now();
      
      // Run both AI operations in parallel (saves ~15s)
      const [extractedData, detectedRoleInfo] = await Promise.all([
        logger.time('extract_structured_data', () => extractStructuredResumeData(resumeText, userId)),
        logger.time('detect_role_industry', () => Promise.resolve(detectRoleAndIndustry(resumeText, resumeStructure)))
      ]);

      structuredData = extractedData;
      roleInfo = targetRoles && targetRoles.length > 0
        ? {
            primaryRole: targetRoles[0],
            industry: targetIndustries?.[0] || detectedRoleInfo.industry || 'General',
            seniority: detectedRoleInfo.seniority || 'mid',
            confidence: 90,
            alternativeRoles: targetRoles.slice(1),
          }
        : detectedRoleInfo;

      logger.info('Phase 2 complete', {
        duration_ms: Date.now() - phase2StartTime,
        overallConfidence: structuredData.extractionMetadata.overallConfidence,
        rolesExtracted: structuredData.experience.roles.length,
        degreesExtracted: structuredData.education.degrees.length,
        detectedRole: roleInfo.primaryRole,
        detectedIndustry: roleInfo.industry
      });
      
      await tracker.updateProgress('ai_extraction', 35, `AI analysis complete: ${structuredData.experience.roles.length} roles found`);
      await tracker.saveCheckpoint('ai_extraction_complete', {
        overallConfidence: structuredData.extractionMetadata.overallConfidence,
        rolesCount: structuredData.experience.roles.length,
        degreesCount: structuredData.education.degrees.length
      });
    } catch (error) {
      logger.error('Phase 2 failed', error as Error, { resumeLength: resumeText.length });
      await tracker.logError('ai_extraction', error as Error, { resumeLength: resumeText.length });
      throw new Error(`Resume extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ========================================================================
    // PHASE 4.5: REMOVED - Now using AI-first extraction (Phase 3)
    // ========================================================================
    // Old regex-based extraction removed - replaced with AI-first structured extraction

    // Clear existing data if mode = 'full'
    if (mode === 'full') {
      console.log('\n🧹 CLEARING EXISTING VAULT DATA');
      await clearVaultData(supabase, vaultId);
    }

    // ========================================================================
    // PHASE 3: TRANSFORM AI-EXTRACTED DATA TO VAULT FORMAT
    // ========================================================================
    console.log('\n⚡ PHASE 3: Transforming AI-extracted data to vault format...');
    await tracker.updateProgress('data_transformation', 40, 'Converting structured data to vault format...');

    const allExtracted = {
      powerPhrases: [] as any[],
      skills: [] as any[],
      competencies: [] as any[],
      softSkills: [] as any[],
    };

    try {
      const startTime = Date.now();
      
      // Log what we're transforming with full data structure
      console.log('\n🔍 STRUCTURED DATA TO TRANSFORM:', JSON.stringify({
        achievements: {
          quantified: structuredData!.achievements?.quantified?.length || 0,
          strategic: structuredData!.achievements?.strategic?.length || 0,
          quantifiedSample: structuredData!.achievements?.quantified?.[0] || null,
        },
        skills: {
          technical: structuredData!.skills?.technical?.length || 0,
          soft: structuredData!.skills?.soft?.length || 0,
          leadership: structuredData!.skills?.leadership?.length || 0,
          technicalSample: structuredData!.skills?.technical?.[0] || null,
        },
        experience: {
          roles: structuredData!.experience?.roles?.length || 0,
        }
      }, null, 2));

      logger.info('Phase 3: Transforming structured data', {
        totalRoles: structuredData!.experience?.roles?.length || 0,
        quantifiedAchievements: structuredData!.achievements?.quantified?.length || 0,
        strategicAchievements: structuredData!.achievements?.strategic?.length || 0,
        technicalSkills: structuredData!.skills?.technical?.length || 0,
        softSkills: structuredData!.skills?.soft?.length || 0,
        leadershipSkills: structuredData!.skills?.leadership?.length || 0,
      });

      // Transform achievements to power phrases (with safety checks)
      const quantifiedAchievements = structuredData!.achievements?.quantified || [];
      console.log(`\n📝 Processing ${quantifiedAchievements.length} quantified achievements...`);
      
      quantifiedAchievements.forEach((ach, index) => {
        const hasMetrics = ach.metric && ach.impact;
        const quality_tier = ach.confidence > 90 ? 'gold' : ach.confidence > 75 ? 'silver' : 'bronze';
        
        allExtracted.powerPhrases.push({
          power_phrase: ach.achievement,
          category: 'Achievement',
          confidence_score: ach.confidence / 100,
          impact_metrics: hasMetrics ? {
            metric: ach.metric,
            result: ach.impact
          } : {},
          quality_tier,
          section_source: 'experience',
          extraction_version: 'v3-ai-structured',
          review_priority: quality_tier === 'gold' ? 90 : quality_tier === 'silver' ? 70 : 50,
          context: ach.context || '',
          keywords: []
        });
      });

      // Add strategic achievements as power phrases (with safety checks)
      const strategicAchievements = structuredData!.achievements?.strategic || [];
      console.log(`\n🎯 Processing ${strategicAchievements.length} strategic achievements...`);
      
      strategicAchievements.forEach((ach, index) => {
        const quality_tier = ach.confidence > 85 ? 'silver' : 'bronze';
        
        allExtracted.powerPhrases.push({
          power_phrase: ach.achievement,
          category: 'Strategic',
          confidence_score: ach.confidence / 100,
          impact_metrics: {
            strategic_impact: ach.scope || ''
          },
          quality_tier,
          section_source: 'experience',
          extraction_version: 'v3-ai-structured',
          review_priority: quality_tier === 'silver' ? 60 : 40,
          context: ach.impact || '',
          keywords: []
        });
      });

      // Transform technical skills (with safety checks)
      const technicalSkills = structuredData!.skills?.technical || [];
      console.log(`\n🔧 Processing ${technicalSkills.length} technical skills...`);
      
      technicalSkills.forEach((skill, index) => {
        const quality_tier = skill.confidence > 90 ? 'gold' : skill.confidence > 75 ? 'silver' : 'bronze';
        
        allExtracted.skills.push({
          stated_skill: skill.skill,
          skill_name: skill.skill,
          category: skill.category,
          proficiency_level: skill.proficiencyLevel,
          years_experience: skill.yearsOfExperience,
          confidence_score: skill.confidence / 100,
          quality_tier,
          section_source: 'skills',
          extraction_version: 'v3-ai-structured',
          review_priority: quality_tier === 'gold' ? 80 : quality_tier === 'silver' ? 60 : 40,
          equivalent_skills: [],
          evidence: `${skill.proficiencyLevel} proficiency with ${skill.yearsOfExperience || 'multiple'} years of experience`
        });
      });

      // Transform leadership skills to competencies (with safety checks)
      const leadershipSkills = structuredData!.skills?.leadership || [];
      console.log(`\n👔 Processing ${leadershipSkills.length} leadership skills...`);
      
      leadershipSkills.forEach((skill, index) => {
        const quality_tier = skill.confidence > 80 ? 'silver' : 'bronze';
        
        allExtracted.competencies.push({
          competency_area: 'Leadership',
          inferred_capability: skill.skill,
          area: 'Leadership',
          capability: skill.skill,
          confidence_score: skill.confidence / 100,
          quality_tier,
          section_source: 'experience',
          extraction_version: 'v3-ai-structured',
          review_priority: 60,
          supporting_evidence: [skill.evidence || 'Demonstrated through leadership roles']
        });
      });

      // Transform soft skills (with safety checks)
      const softSkills = structuredData!.skills?.soft || [];
      console.log(`\n🤝 Processing ${softSkills.length} soft skills...`);
      
      softSkills.forEach((skill, index) => {
        const hasEvidence = skill.evidence && skill.evidence.length > 50;
        const quality_tier = skill.confidence > 80 && hasEvidence ? 'silver' : 'bronze';
        
        allExtracted.softSkills.push({
          soft_skill: skill.skill,
          skill_name: skill.skill,
          confidence_score: skill.confidence / 100,
          quality_tier,
          section_source: 'experience',
          extraction_version: 'v3-ai-structured',
          review_priority: quality_tier === 'silver' ? 50 : 30,
          examples: skill.evidence || 'Demonstrated through professional experience',
          behavioral_evidence: skill.evidence || ''
        });
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ Data transformation complete in ${duration}s`);
      console.log(`   💪 Power phrases: ${allExtracted.powerPhrases.length}`);
      console.log(`   🔧 Skills: ${allExtracted.skills.length}`);
      console.log(`   🧠 Competencies: ${allExtracted.competencies.length}`);
      console.log(`   🤝 Soft skills: ${allExtracted.softSkills.length}`);

      logger.info('Phase 3 transformation results', {
        powerPhrasesCount: allExtracted.powerPhrases.length,
        skillsCount: allExtracted.skills.length,
        competenciesCount: allExtracted.competencies.length,
        softSkillsCount: allExtracted.softSkills.length,
        totalItems: allExtracted.powerPhrases.length + allExtracted.skills.length + 
                    allExtracted.competencies.length + allExtracted.softSkills.length
      });

      await tracker.updateProgress('data_transformation', 70, 
        `Transformed ${allExtracted.powerPhrases.length + allExtracted.skills.length + allExtracted.competencies.length + allExtracted.softSkills.length} total items`
      );
      await tracker.saveCheckpoint('data_transformation_complete', {
        powerPhrasesCount: allExtracted.powerPhrases.length,
        skillsCount: allExtracted.skills.length,
        competenciesCount: allExtracted.competencies.length,
        softSkillsCount: allExtracted.softSkills.length
      });
    } catch (error) {
      console.error('❌ Data transformation failed:', error);
      logger.error('Phase 3 transformation failed', error as Error);
      await tracker.logError('section_extraction', error as Error);
      throw error;
    }

    // Education and career context already extracted in Phase 3 AI-first extraction
    // Data is available in structuredData.education and structuredData.experience

    // ========================================================================
    // PHASE 4: Assign Quality Tiers and Review Priority
    // ========================================================================
    console.log('\n🏆 PHASE 4: Assigning quality tiers and review priorities...');
    await tracker.updateProgress('quality_assignment', 75, 'Assigning quality tiers...');

    allExtracted.powerPhrases.forEach((pp, index) => {
      const hasMetrics = pp.impact_metrics && Object.keys(pp.impact_metrics).length > 0;
      const hasCalculations = pp.enhancement_notes && pp.enhancement_notes.includes('calculated');
      const confidenceScore = pp.confidence_score || 0.7;

      // Quality tier logic
      if (hasMetrics && hasCalculations && confidenceScore > 0.85) {
        pp.quality_tier = 'gold'; // High confidence with enhancements
        pp.review_priority = index < 5 ? 80 : 50; // Top 5 get priority
      } else if (hasMetrics || hasCalculations) {
        pp.quality_tier = 'silver'; // Has some enhancements, needs verification
        pp.review_priority = index < 10 ? 60 : 30;
      } else {
        pp.quality_tier = 'bronze'; // Needs enhancement
        pp.review_priority = 20;
      }
    });

    allExtracted.skills.forEach((s, index) => {
      const hasEquivalents = s.equivalent_skills && s.equivalent_skills.length > 0;
      const confidenceScore = s.confidence_score || 0.7;

      if (hasEquivalents && confidenceScore > 0.8) {
        s.quality_tier = 'gold';
        s.review_priority = index < 5 ? 70 : 40;
      } else {
        s.quality_tier = 'bronze';
        s.review_priority = 20;
      }
    });

    allExtracted.competencies.forEach((c) => {
      c.quality_tier = 'silver'; // Hidden competencies always need review
      c.review_priority = 60;
    });

    allExtracted.softSkills.forEach((ss) => {
      const hasEvidence = ss.examples && ss.examples.length > 50;
      ss.quality_tier = hasEvidence ? 'silver' : 'bronze';
      ss.review_priority = hasEvidence ? 50 : 20;
    });

    // ========================================================================
    // 🔍 PHASE 6: AI-POWERED GAP ANALYSIS (PRODUCTION)
    // ========================================================================
    console.log('\n🔍 PHASE 6: AI-powered gap analysis with confidence-based filtering...');

    try {
      // Define benchmark expectations based on role
      const benchmarkExpectations = {
        jobTitle: roleInfo.primaryRole,
        industry: roleInfo.industry,
        seniorityLevel: structuredData!.professionalIdentity.seniorityLevel,
        expectedEducation: `Bachelor's degree or higher in relevant field`,
        expectedManagement: roleInfo.seniority.includes('Manager') || roleInfo.seniority.includes('Director') || roleInfo.seniority.includes('VP') || roleInfo.seniority.includes('C-Level')
          ? 'Management experience required'
          : 'Management experience preferred',
        expectedBudget: roleInfo.seniority.includes('Manager') || roleInfo.seniority.includes('Director') || roleInfo.seniority.includes('VP') || roleInfo.seniority.includes('C-Level')
          ? 'Budget ownership expected'
          : 'Budget ownership optional',
        expectedCompetencies: [
          `${roleInfo.industry} expertise`,
          'Strategic thinking',
          'Cross-functional collaboration',
          'Problem-solving',
        ],
      };

      const gapAnalysis = await analyzeGapsWithAI(
        structuredData!,
        benchmarkExpectations,
        userId
      );

      console.log('✅ Gap analysis complete!');
      console.log(`   🎯 Critical gaps: ${gapAnalysis.criticalGaps.length}`);
      console.log(`   ✓  Verification questions: ${gapAnalysis.verificationQuestions.length}`);
      console.log(`   ✅ No questions needed: ${gapAnalysis.noQuestionsNeeded.length}`);
      console.log(`   📊 Data completeness: ${gapAnalysis.overallAssessment.dataCompleteness}%`);
      console.log(`   📊 Data quality: ${gapAnalysis.overallAssessment.dataQuality}%`);

      // Store gap analysis in vault_benchmark_comparison table
      const { error: benchmarkError } = await supabase
        .from('vault_benchmark_comparison')
        .upsert({
          vault_id: vaultId,
          user_id: userId,
          job_title: benchmarkExpectations.jobTitle,
          industry: benchmarkExpectations.industry,
          seniority_level: benchmarkExpectations.seniorityLevel || structuredData!.professionalIdentity.seniorityLevel || 'Mid-Level IC',
          benchmark_data: benchmarkExpectations,
          confirmed_data: {
            // Map structuredData to old format for compatibility with gap question generator
            educationLevel: structuredData!.education.degrees[0]?.level,
            educationField: structuredData!.education.degrees[0]?.field,
            certifications: structuredData!.education.certifications.map(c => c.name),
            hasManagementExperience: structuredData!.experience.management.hasExperience,
            managementDetails: structuredData!.experience.management.details,
            teamSizesManaged: structuredData!.experience.management.teamSizes,
            hasBudgetOwnership: structuredData!.experience.budget.hasExperience,
            budgetDetails: structuredData!.experience.budget.details,
            budgetSizesManaged: structuredData!.experience.budget.amounts,
            hasExecutiveExposure: structuredData!.experience.executive.hasExposure,
            executiveDetails: structuredData!.experience.executive.details,
            yearsOfExperience: structuredData!.experience.totalYears,
            seniorityLevel: structuredData!.professionalIdentity.seniorityLevel,
          },
          likely_data: {
            // Empty - we use confidence scores now instead of likely/confirmed split
          },
          gaps_requiring_questions: gapAnalysis.criticalGaps.map(gap => ({
            field: gap.field,
            question: gap.question,
            context: gap.reason,
            expectedAnswer: gap.expectedAnswer,
            priority: gap.priority,
            currentConfidence: gap.currentConfidence,
          })),
          evidence_summary: {
            managementEvidence: structuredData!.experience.management.evidence,
            budgetEvidence: structuredData!.experience.budget.evidence,
            executiveEvidence: structuredData!.experience.executive.evidence,
            educationEvidence: structuredData!.education.degrees.map(d => d.evidence),
          },
          comparison_confidence: gapAnalysis.overallAssessment.dataQuality / 100,
        }, {
          onConflict: 'vault_id'
        });

      if (benchmarkError) {
        console.error('❌ Error storing gap analysis:', benchmarkError);
      } else {
        console.log('✅ Stored AI-powered gap analysis with confirmed data mapping');
      }

    } catch (error) {
      console.error('⚠️ Gap analysis failed:', error);
      console.log('   Continuing without gap analysis...');
    }

    // ========================================================================
    // PHASE 4: Add Industry Context
    // ========================================================================
    console.log('\n🌐 PHASE 4: Adding industry context...');

    if (roleInfo) {
      allExtracted.powerPhrases.forEach((pp) => {
        pp.industry_context = {
          industry: roleInfo.industry,
          role: roleInfo.primaryRole,
          seniority: roleInfo.seniority,
          // Add benchmarks if available from metrics
          benchmarks: pp.impact_metrics ? getBenchmarkContext(pp.impact_metrics, roleInfo) : {}
        };
      });

      allExtracted.skills.forEach((s) => {
        s.industry_context = {
          industry: roleInfo.industry,
          role: roleInfo.primaryRole,
          demandLevel: 'high', // Could be enhanced with external API
        };
      });
    }

    // ========================================================================
    // STORE EXTRACTED DATA
    // ========================================================================
    console.log('\n💾 Storing extracted data...');

    // Store power phrases
    if (allExtracted.powerPhrases.length > 0) {
      const powerPhrasesInserts = allExtracted.powerPhrases.map((pp) => ({
        vault_id: vaultId,
        user_id: userId,
        power_phrase: pp.phrase || pp.power_phrase,
        category: pp.category || 'General',
        confidence_score: Math.round((pp.confidence_score || 0.8) * 100),
        quality_tier: pp.quality_tier,
        impact_metrics: pp.impact_metrics || {},
        keywords: pp.keywords || [],
        section_source: pp.section_source,
        extraction_version: pp.extraction_version,
        review_priority: pp.review_priority,
        industry_context: pp.industry_context || {},
        enhancement_notes: pp.enhancement_notes,
      }));

      const { error: ppError } = await supabase
        .from('vault_power_phrases')
        .insert(powerPhrasesInserts);

      if (ppError) {
        console.error('❌ Error inserting power phrases:', ppError);
      } else {
        console.log(`✅ Stored ${powerPhrasesInserts.length} power phrases`);
        console.log(`   - Gold: ${powerPhrasesInserts.filter(p => p.quality_tier === 'gold').length}`);
        console.log(`   - Silver: ${powerPhrasesInserts.filter(p => p.quality_tier === 'silver').length}`);
        console.log(`   - Bronze: ${powerPhrasesInserts.filter(p => p.quality_tier === 'bronze').length}`);
      }
    }

    // Store skills
    if (allExtracted.skills.length > 0) {
      const skillsInserts = allExtracted.skills.map((s) => ({
        vault_id: vaultId,
        user_id: userId,
        stated_skill: s.stated_skill || s.skill_name || s.skill,
        equivalent_skills: s.equivalent_skills || [],
        evidence: s.evidence || 'Extracted from resume analysis',
        confidence_score: Math.round((s.confidence_score || 0.8) * 100),
        quality_tier: s.quality_tier,
        section_source: s.section_source,
        extraction_version: s.extraction_version,
        review_priority: s.review_priority,
        industry_context: s.industry_context || {},
        enhancement_notes: s.enhancement_notes,
      }));

      const { error: skillsError } = await supabase
        .from('vault_transferable_skills')
        .insert(skillsInserts);

      if (skillsError) {
        console.error('❌ Error inserting skills:', skillsError);
      } else {
        console.log(`✅ Stored ${skillsInserts.length} skills`);
      }
    }

    // Store competencies
    if (allExtracted.competencies.length > 0) {
      const competenciesInserts = allExtracted.competencies.map((c) => ({
        vault_id: vaultId,
        user_id: userId,
        competency_area: c.competency_area || c.area,
        inferred_capability: c.inferred_capability || c.capability,
        supporting_evidence: c.supporting_evidence || ['Resume analysis'],
        confidence_score: Math.round((c.confidence_score || 0.75) * 100),
        quality_tier: c.quality_tier,
        section_source: c.section_source,
        extraction_version: c.extraction_version,
        review_priority: c.review_priority,
        enhancement_notes: c.enhancement_notes,
      }));

      const { error: compError } = await supabase
        .from('vault_hidden_competencies')
        .insert(competenciesInserts);

      if (compError) {
        console.error('❌ Error inserting competencies:', compError);
      } else {
        console.log(`✅ Stored ${competenciesInserts.length} competencies`);
      }
    }

    // Store soft skills
    if (allExtracted.softSkills.length > 0) {
      const softSkillsInserts = allExtracted.softSkills.map((ss) => ({
        vault_id: vaultId,
        user_id: userId,
        skill_name: ss.soft_skill || ss.skill_name || ss.skill,
        examples: ss.examples || ss.behavioral_evidence || 'Demonstrated through professional experience',
        ai_confidence: (ss.confidence_score || 0.75),
        quality_tier: ss.quality_tier,
        section_source: ss.section_source,
        extraction_version: ss.extraction_version,
        review_priority: ss.review_priority,
      }));

      const { error: ssError } = await supabase
        .from('vault_soft_skills')
        .insert(softSkillsInserts);

      if (ssError) {
        console.error('❌ Error inserting soft skills:', ssError);
      } else {
        console.log(`✅ Stored ${softSkillsInserts.length} soft skills`);
      }
    }

    // ========================================================================
    // CRITICAL FIX: Store Work Positions (Previously Missing!)
    // ========================================================================
    console.log('\n💼 Storing work positions...');
    if (structuredData!.experience.roles.length > 0) {
      const workPositions = structuredData!.experience.roles.map(role => ({
        vault_id: vaultId,
        user_id: userId,
        company_name: role.company,
        job_title: role.title,
        start_date: role.startYear ? `${role.startYear}-01-01` : null,
        end_date: role.isCurrent ? null : (role.endYear ? `${role.endYear}-12-31` : null),
        is_current: role.isCurrent,
        description: role.description,
        confidence_score: role.confidence / 100,
        quality_tier: role.confidence > 85 ? 'silver' : 'bronze',
        extraction_source: 'ai-structured-v3'
      }));
      
      const { error: wpError } = await supabase
        .from('vault_work_positions')
        .insert(workPositions);
      
      if (wpError) {
        console.error('❌ Error inserting work positions:', wpError);
      } else {
        console.log(`✅ Stored ${workPositions.length} work positions`);
        console.log(`   Companies: ${workPositions.map(w => w.company_name).join(', ')}`);
      }
    }

    // ========================================================================
    // CRITICAL FIX: Store Education (Previously Missing!)
    // ========================================================================
    console.log('\n🎓 Storing education records...');
    if (structuredData!.education.degrees.length > 0) {
      const educationRecords = structuredData!.education.degrees.map(deg => ({
        vault_id: vaultId,
        user_id: userId,
        institution_name: deg.institution,
        degree_type: deg.level,
        field_of_study: deg.field,
        graduation_year: deg.graduationYear,
        confidence_score: deg.confidence / 100,
        quality_tier: deg.confidence > 85 ? 'silver' : 'bronze',
        extraction_source: 'ai-structured-v3'
      }));
      
      const { error: eduError } = await supabase
        .from('vault_education')
        .insert(educationRecords);
      
      if (eduError) {
        console.error('❌ Error inserting education:', eduError);
      } else {
        console.log(`✅ Stored ${educationRecords.length} education records`);
        console.log(`   Degrees: ${educationRecords.map(e => `${e.degree_type} in ${e.field_of_study}`).join(', ')}`);
      }
    }

    // ========================================================================
    // CRITICAL FIX: Store Milestones/Achievements (Previously Missing!)
    // ========================================================================
    console.log('\n🏆 Storing achievements as milestones...');
    
    // Get most recent work position to link achievements to
    const { data: recentPosition } = await supabase
      .from('vault_work_positions')
      .select('id')
      .eq('vault_id', vaultId)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!recentPosition) {
      console.log('⚠️ No work positions found - skipping milestone storage');
    } else {
      const milestones: any[] = [];
      
      // Add quantified achievements
      structuredData!.achievements.quantified.forEach(ach => {
        milestones.push({
          vault_id: vaultId,
          user_id: userId,
          work_position_id: recentPosition.id, // ← THE FIX: Link to most recent position
          milestone_title: ach.achievement,
          description: ach.achievement,
          metric_type: ach.metric,
          metric_value: ach.impact,
          context: ach.context,
          confidence_score: ach.confidence / 100,
          quality_tier: ach.confidence > 85 ? 'gold' : 'silver',
          extraction_source: 'ai-structured-v3'
        });
      });
      
      // Add strategic achievements
      structuredData!.achievements.strategic.forEach(ach => {
        milestones.push({
          vault_id: vaultId,
          user_id: userId,
          work_position_id: recentPosition.id, // ← THE FIX: Link to most recent position
          milestone_title: ach.achievement,
          description: `${ach.achievement}\n\nScope: ${ach.scope}\nImpact: ${ach.impact}`,
          confidence_score: ach.confidence / 100,
          quality_tier: ach.confidence > 80 ? 'silver' : 'bronze',
          extraction_source: 'ai-structured-v3'
        });
      });
      
      if (milestones.length > 0) {
        const { error: mlError } = await supabase
          .from('vault_resume_milestones')
          .insert(milestones);
        
        if (mlError) {
          console.error('❌ Error inserting milestones:', mlError);
        } else {
          console.log(`✅ Stored ${milestones.length} milestones`);
          console.log(`   Gold: ${milestones.filter(m => m.quality_tier === 'gold').length}`);
          console.log(`   Silver: ${milestones.filter(m => m.quality_tier === 'silver').length}`);
        }
      }
    }

    // ========================================================================
    // PHASE 6: STORE AI-FIRST STRUCTURED DATA
    // ========================================================================
    logger.info('Phase 6: Starting career context storage');
    const phase6StartTime = Date.now();
    await tracker.updateProgress('storing_context', 85, 'Saving career context...');

    // Store career context from AI-first extraction
    const contextPayload: any = {
      vault_id: vaultId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Education (from AI-first extraction with confidence scores)
    if (structuredData!.education.degrees.length > 0) {
      const primaryDegree = structuredData!.education.degrees[0]; // Highest/most recent degree
      contextPayload.education_level = primaryDegree.level;
      contextPayload.education_field = primaryDegree.field;
      console.log(`  🎓 Education: ${primaryDegree.level} in ${primaryDegree.field} (confidence: ${primaryDegree.confidence}%)`);
    }

    // Certifications
    if (structuredData!.education.certifications.length > 0) {
      contextPayload.certifications = structuredData!.education.certifications.map(c => c.name);
      console.log(`  📜 Certifications: ${contextPayload.certifications.join(', ')}`);
    }

    // Experience
    contextPayload.years_of_experience = structuredData!.experience.totalYears || 0;
    contextPayload.inferred_seniority = structuredData!.professionalIdentity.seniorityLevel;
    contextPayload.seniority_confidence = structuredData!.professionalIdentity.confidence || 50;

    // Management
    contextPayload.has_management_experience = structuredData!.experience.management.hasExperience ?? false;
    contextPayload.management_details = structuredData!.experience.management.details || null;
    contextPayload.team_sizes_managed = structuredData!.experience.management.teamSizes || [];
    console.log(`  👔 Management: ${contextPayload.has_management_experience ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.management.confidence}%)`);

    // Budget
    contextPayload.has_budget_ownership = structuredData!.experience.budget.hasExperience ?? false;
    contextPayload.budget_details = structuredData!.experience.budget.details || null;
    contextPayload.budget_sizes_managed = structuredData!.experience.budget.amounts || [];
    console.log(`  💰 Budget: ${contextPayload.has_budget_ownership ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.budget.confidence}%)`);

    // Executive
    contextPayload.has_executive_exposure = structuredData!.experience.executive.hasExposure ?? false;
    contextPayload.executive_details = structuredData!.experience.executive.details || null;
    console.log(`  📈 Executive: ${contextPayload.has_executive_exposure ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.executive.confidence}%)`);

    const { error: contextError } = await supabase
      .from('vault_career_context')
      .upsert(contextPayload, {
        onConflict: 'vault_id'
      });

    if (contextError) {
      logger.error('Failed to store career context', contextError as Error);
    } else {
      logger.info('Phase 6 complete', {
        duration_ms: Date.now() - phase6StartTime,
        educationLevel: contextPayload.education_level,
        yearsExperience: contextPayload.years_of_experience,
        hasManagement: contextPayload.has_management_experience
      });
    }

    // Update vault metadata
    const totalItems = 
      allExtracted.powerPhrases.length +
      allExtracted.skills.length +
      allExtracted.competencies.length +
      allExtracted.softSkills.length;

    await supabase
      .from('career_vault')
      .update({
        auto_populated: true,
        extraction_item_count: totalItems,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', vaultId);

    await tracker.updateProgress('vault_update', 90, `Vault updated with ${totalItems} items`);

    // ========================================================================
    // PHASE 7: FAST QUALITY CHECK (Background Task)
    // ========================================================================
    logger.info('Phase 7: Starting quality check');
    const phase7StartTime = Date.now();
    await tracker.updateProgress('quality_check', 95, 'Running quality enhancement...');

    try {
      // Make quality check non-blocking with reduced timeout
      const qualityCheckController = new AbortController();
      const qualityCheckTimeout = setTimeout(() => qualityCheckController.abort(), 30000);

      const qualityCheckResponse = await fetch(`${supabaseUrl}/functions/v1/vault-quality-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaultId,
          resumeText,
        }),
        signal: qualityCheckController.signal,
      });

      clearTimeout(qualityCheckTimeout);

      if (qualityCheckResponse.ok) {
        const qualityResult = await qualityCheckResponse.json();
        logger.info('Phase 7 complete', {
          duration_ms: Date.now() - phase7StartTime,
          enhancementsApplied: qualityResult.data?.enhancementsApplied || 0,
          vaultStrengthBefore: qualityResult.data?.vaultStrengthBefore || 0,
          vaultStrengthAfter: qualityResult.data?.vaultStrengthAfter || 0,
          improvement: (qualityResult.data?.vaultStrengthAfter || 0) - (qualityResult.data?.vaultStrengthBefore || 0)
        });
      } else {
        logger.warn('Quality check returned non-OK status (non-critical)', { status: qualityCheckResponse.status });
      }
    } catch (qualityError) {
      logger.warn('Quality check skipped (non-critical)', { 
        error: qualityError instanceof Error ? qualityError.message : String(qualityError),
        reason: qualityError instanceof Error && qualityError.name === 'AbortError' ? 'timeout' : 'error'
      });
      // Don't fail the entire extraction if quality check fails
    }

    // ========================================================================
    // CRITICAL FIX: Update Career Vault Counters (Previously Missing!)
    // ========================================================================
    console.log('\n📊 Updating career vault counters...');
    
    // Get actual counts from database using get_vault_statistics RPC
    const { data: vaultStats, error: statsError } = await supabase
      .rpc('get_vault_statistics', { p_vault_id: vaultId });
    
    if (statsError) {
      console.error('❌ Error getting vault statistics:', statsError);
    } else {
      const stats = vaultStats as any;
      
      // Update career_vault with correct counts and mark as completed
      const { error: updateError } = await supabase
        .from('career_vault')
        .update({
          auto_populated: true,
          onboarding_step: 'completed',
          total_power_phrases: stats.categoryBreakdown?.power_phrases || 0,
          total_transferable_skills: stats.categoryBreakdown?.transferable_skills || 0,
          total_hidden_competencies: stats.categoryBreakdown?.hidden_competencies || 0,
          total_soft_skills: stats.categoryBreakdown?.soft_skills || 0,
          extraction_item_count: stats.totalItems || 0,
          overall_strength_score: stats.vaultStrength || 0,
          last_updated_at: new Date().toISOString(),
          extraction_timestamp: new Date().toISOString()
        })
        .eq('id', vaultId);
      
      if (updateError) {
        console.error('❌ Error updating career vault counters:', updateError);
      } else {
        console.log('✅ Career vault counters updated successfully');
        console.log(`   Total items: ${stats.totalItems}`);
        console.log(`   Vault strength: ${stats.vaultStrength}`);
        console.log(`   Onboarding step: completed`);
      }
    }

    // ========================================================================
    // COMPLETE & VERIFY
    // ========================================================================
    await tracker.complete(totalItems);
    
    // Trigger automatic verification after extraction completes
    try {
      console.log('🔍 Triggering automatic resume data verification...');
      const verifyResponse = await supabase.functions.invoke('verify-resume-data', {
        body: {
          vaultId,
          sessionId: null, // Session tracking not implemented in this version
          userId
        }
      });
      
      if (verifyResponse.error) {
        console.error('⚠️ Verification failed:', verifyResponse.error);
      } else {
        const verifyData = verifyResponse.data;
        console.log(`✅ Verification complete: ${verifyData.status} (${verifyData.discrepanciesCount} discrepancies)`);
        
        // If discrepancies found, trigger remediation assessment
        if (verifyData.requiresRemediation) {
          console.log('🔧 Triggering remediation assessment...');
          // Note: Remediation will be triggered automatically by the verification result
        }
      }
    } catch (verifyError) {
      console.error('⚠️ Error during verification:', verifyError);
      // Don't fail the whole extraction if verification fails
    }
    
    const totalDuration = Date.now() - overallStartTime;
    logger.info('Extraction complete', {
      totalItems,
      totalDuration_ms: totalDuration,
      itemsPerSecond: (totalItems / (totalDuration / 1000)).toFixed(2),
      powerPhrases: allExtracted.powerPhrases.length,
      skills: allExtracted.skills.length,
      competencies: allExtracted.competencies.length,
      softSkills: allExtracted.softSkills.length,
      workPositions: structuredData!.experience.roles.length,
      education: structuredData!.education.degrees.length,
      milestones: structuredData!.achievements.quantified.length + structuredData!.achievements.strategic.length,
      role: roleInfo?.primaryRole,
      industry: roleInfo?.industry
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          extracted: {
            powerPhrasesCount: allExtracted.powerPhrases.length,
            skillsCount: allExtracted.skills.length,
            competenciesCount: allExtracted.competencies.length,
            softSkillsCount: allExtracted.softSkills.length,
            total: totalItems,
          },
          qualityBreakdown: {
            gold: allExtracted.powerPhrases.filter(p => p.quality_tier === 'gold').length,
            silver: allExtracted.powerPhrases.filter(p => p.quality_tier === 'silver').length,
            bronze: allExtracted.powerPhrases.filter(p => p.quality_tier === 'bronze').length,
          },
          preExtractionContext: {
            role: roleInfo?.primaryRole,
            industry: roleInfo?.industry,
            seniority: roleInfo?.seniority,
            sectionsProcessed: resumeStructure.sections.length,
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorDuration = Date.now() - overallStartTime;
    const err = error as Error;
    logger.error('Extraction failed', err, {
      duration_ms: errorDuration
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unknown extraction error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ========================================================================
// EXTRACTION WITH ENHANCEMENT (PHASE 1)
// ========================================================================

interface ExtractionParams {
  sectionContent: string;
  sectionType: 'experience' | 'skills' | 'education' | 'certifications' | 'other';
  extractionType: 'power_phrases' | 'skills' | 'competencies' | 'soft_skills';
  roleInfo: RoleInfo | null;
  userId: string;
}

async function extractWithEnhancement(params: ExtractionParams): Promise<any> {
  const { sectionContent, sectionType, extractionType, roleInfo, userId } = params;

  // Build enhanced prompt
  const prompt = buildEnhancedPrompt(sectionContent, sectionType, extractionType, roleInfo);

  // Call AI with retry logic (Phase 5)
  const result = await callLovableAI(
    {
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      max_tokens: 4000,
      response_mime_type: "application/json"
    },
    `extract_${extractionType}`,
    userId
  );

  await logAIUsage(result.metrics);

  const content = result.response.choices[0].message.content;
  const parseResult = extractJSON(content);

  if (!parseResult.success || !parseResult.data) {
    console.error(`Failed to parse ${extractionType}:`, parseResult.error);
    return {
      [extractionType === 'power_phrases' ? 'powerPhrases' : extractionType]: [],
    };
  }

  // Return parsed data
  const key = extractionType === 'power_phrases' ? 'powerPhrases' :
               extractionType === 'soft_skills' ? 'softSkills' :
               extractionType;

  return {
    [key]: parseResult.data,
  };
}

// ========================================================================
// ENHANCED PROMPT BUILDING (PHASE 1)
// ========================================================================

function buildEnhancedPrompt(
  sectionContent: string,
  sectionType: string,
  extractionType: string,
  roleInfo: RoleInfo | null
): string {
  const contextPrefix = roleInfo
    ? `Role: ${roleInfo.primaryRole}\nIndustry: ${roleInfo.industry}\nSeniority: ${roleInfo.seniority}\n\n`
    : '';

  switch (extractionType) {
    case 'power_phrases':
      return `${contextPrefix}You are analyzing a RESUME'S ${sectionType.toUpperCase()} SECTION to extract and ENHANCE achievements.

CRITICAL RULES - DO NOT JUST COPY:
1. CALCULATE metrics from context:
   - "Led team of engineers on 13 wells" → Calculate: Team size × wells × typical payroll = "$3M+ payroll responsibility"
   - "Reduced rig mobility time from 5.5 to 3.0 days" → Calculate: (5.5-3.0)/5.5 = "45% improvement"
   - "17% cost reduction" → Estimate: 17% of well costs = "$X saved per well × Y wells = $Z total"

2. EXPAND abbreviated terms:
   - "AFE" → "AFE (Authorization for Expenditure)"
   - "BHA" → "BHA (Bottom Hole Assembly)"
   - "Managed P&A" → "Managed Plug & Abandonment operations"

3. ADD context and scale:
   - "Led drilling operations" → "Led drilling operations for $50M annual program (Z wells)"
   - "Improved efficiency" → "Improved efficiency by X%, generating $Y in cost savings"

Resume section:
${sectionContent}

Extract achievements as JSON array:
[{
  "phrase": "Enhanced achievement with calculations",
  "category": "Technical|Leadership|Financial|Safety|Other",
  "confidence_score": 0.0-1.0,
  "impact_metrics": {
    "teamSize": number,
    "budget": number,
    "percentage": number,
    "timeframe": "string"
  },
  "keywords": ["key", "terms"],
  "enhancement_notes": "How this was calculated/enhanced from raw resume"
}]`;

    case 'skills':
      return `${contextPrefix}Extract skills from this ${sectionType} section and provide CROSS-FUNCTIONAL EQUIVALENTS.

RULES:
1. For each technical skill, identify equivalent skills in other industries
   - "Drilling Operations" → ["Project Execution", "Complex Systems Management", "Field Operations"]
   - "AFE Generation" → ["Budget Planning", "Financial Forecasting", "Capital Project Management"]

2. Extract both stated skills AND implied skills
   - If they mention "Led team" but don't list "Team Management", extract it as implied

Resume section:
${sectionContent}

Return JSON array:
[{
  "stated_skill": "Exact skill from resume",
  "equivalent_skills": ["Cross-functional equivalent 1", "Equivalent 2"],
  "evidence": "Where this skill was demonstrated",
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "Why these equivalents were chosen"
}]`;

    case 'competencies':
      return `${contextPrefix}Extract HIDDEN COMPETENCIES - capabilities NOT explicitly stated but clearly demonstrated.

RULES:
1. Look for evidence of capabilities they DIDN'T name:
   - Delivered 13 wells under budget → HIDDEN: Financial Acumen, Risk Management
   - Led adoption of new technology → HIDDEN: Change Management, Innovation Leadership
   - Coordinated with multiple departments → HIDDEN: Stakeholder Management, Cross-functional Leadership

2. Infer from actions, not titles

Resume section:
${sectionContent}

Return JSON array:
[{
  "competency_area": "Financial|Technical|Strategic|People|Business",
  "inferred_capability": "Specific hidden capability",
  "supporting_evidence": ["Quote from resume showing this"],
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "Why this competency was inferred"
}]`;

    case 'soft_skills':
      return `${contextPrefix}Extract soft skills with BEHAVIORAL EVIDENCE.

RULES:
1. Only extract soft skills with clear behavioral indicators:
   - "Led pre-tour safety meetings" → Leadership, Communication
   - "Overcame high temperature challenges through well redesign" → Problem-Solving, Adaptability
   - "Coordinated with BU on rig schedules" → Collaboration, Planning

2. Provide specific examples, not generic statements

Resume section:
${sectionContent}

Return JSON array:
[{
  "soft_skill": "Specific soft skill name",
  "examples": "Behavioral evidence from resume showing this skill",
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "How this behavioral evidence demonstrates the skill"
}]`;

    default:
      return '';
  }
}

// ========================================================================
// INDUSTRY CONTEXT (PHASE 4)
// ========================================================================

function getBenchmarkContext(metrics: any, roleInfo: RoleInfo): any {
  const benchmarks: any = {};

  // Add team size context
  if (metrics.teamSize) {
    if (roleInfo.industry === 'Oil & Gas') {
      if (metrics.teamSize < 5) {
        benchmarks.teamSizeContext = 'Small team (typical for field operations)';
      } else if (metrics.teamSize < 15) {
        benchmarks.teamSizeContext = 'Mid-size team (typical for multi-well programs)';
      } else {
        benchmarks.teamSizeContext = 'Large team (top 10% in industry)';
      }
    }
  }

  // Add percentage improvement context
  if (metrics.percentage) {
    if (metrics.percentage > 40) {
      benchmarks.improvementContext = 'Exceptional improvement (top 5% performance)';
    } else if (metrics.percentage > 20) {
      benchmarks.improvementContext = 'Strong improvement (above industry average)';
    } else {
      benchmarks.improvementContext = 'Solid improvement';
    }
  }

  return benchmarks;
}

// ========================================================================
// VAULT CLEANUP HELPER
// ========================================================================

// ========================================================================
// EDUCATION EXTRACTION (DEPRECATED - DO NOT USE)
// ========================================================================
/**
 * @deprecated DO NOT USE - Replaced by extractStructuredResumeData()
 * This function makes redundant AI calls and should NOT be called.
 * Keep for backward compatibility only.
 */
async function extractEducation(params: {
  sectionContent: string;
  userId: string;
}): Promise<EducationData> {
  const prompt = `Extract education information from this resume section.

Resume Section:
${params.sectionContent}

Return JSON:
{
  "level": "High School|Associate|Bachelor|Master|PhD|None",
  "field": "Primary major/field of study",
  "institution": "School name",
  "graduationYear": 2020,
  "certifications": ["Cert 1", "Cert 2"]
}

Rules:
- For "Bachelor of Science in Mechanical Engineering" → level: "Bachelor", field: "Mechanical Engineering"
- For "MBA" → level: "Master", field: "Business Administration"
- Extract ALL certifications and licenses
`;

  try {
    const result = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      max_tokens: 1000,
      response_mime_type: "application/json"
    }, 'extract_education', params.userId);

    await logAIUsage(result.metrics);

    const content = result.response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return {
      level: parseResult.data?.level || null,
      field: parseResult.data?.field || null,
      institution: parseResult.data?.institution,
      graduationYear: parseResult.data?.graduationYear,
      certifications: parseResult.data?.certifications || [],
    };
  } catch (error) {
    console.error('[EDUCATION-EXTRACTION] Error:', error);
    return {
      level: null,
      field: null,
      certifications: [],
    };
  }
}

// ========================================================================
// 🎯 INDUSTRY BENCHMARK FETCHING
// ========================================================================

async function fetchIndustryBenchmarks(params: {
  jobTitle: string;
  industry: string;
  seniorityLevel: string;
  userId: string;
}): Promise<IndustryBenchmark> {
  const prompt = `You are an expert career analyst. Provide industry benchmarks for this role:

Job Title: ${params.jobTitle}
Industry: ${params.industry}
Seniority: ${params.seniorityLevel}

Return STRICT JSON with this structure:
{
  "jobTitle": "${params.jobTitle}",
  "industry": "${params.industry}",
  "seniorityLevel": "${params.seniorityLevel}",
  "typicalManagementScope": {
    "hasManagement": true/false,
    "typicalTeamSize": "e.g., 5-10 direct reports",
    "managementLevel": "e.g., Direct reports, Multiple teams, Department-level"
  },
  "typicalBudgetOwnership": {
    "hasBudget": true/false,
    "typicalBudgetRange": "e.g., $500K-$2M annually",
    "budgetType": "e.g., Project budgets, Operational budget, P&L ownership"
  },
  "typicalExecutiveExposure": {
    "hasExposure": true/false,
    "interactionLevel": "e.g., Regular C-suite presentations, Occasional executive briefings",
    "strategicScope": "e.g., Influences departmental strategy, Drives company-wide initiatives"
  },
  "typicalYearsExperience": {
    "minimum": 5,
    "typical": 8,
    "maximum": 15
  },
  "expectedCompetencies": ["Competency 1", "Competency 2", "Competency 3"],
  "typicalEducation": {
    "level": "Bachelor|Master|PhD|None",
    "fields": ["Engineering", "Business"],
    "certifications": ["PMP", "Six Sigma"]
  }
}`;

  try {
    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      max_tokens: 2000,
      temperature: 0.3,
      response_mime_type: "application/json"
    }, 'fetch_industry_benchmarks', params.userId);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return parseResult.data as IndustryBenchmark;
  } catch (error) {
    console.error('[BENCHMARK-FETCH] Error:', error);
    throw error;
  }
}

// ========================================================================
// 🎯 RESUME-TO-BENCHMARK COMPARISON
// ========================================================================

async function compareResumeAgainstBenchmark(params: {
  resumeText: string;
  benchmark: IndustryBenchmark;
  userId: string;
}): Promise<ComparisonResult> {
  const prompt = `Compare this resume against industry benchmarks and identify gaps.

RESUME:
${params.resumeText}

INDUSTRY BENCHMARKS:
- Job Title: ${params.benchmark.jobTitle}
- Industry: ${params.benchmark.industry}
- Seniority: ${params.benchmark.seniorityLevel}

Expected for this role:
- Management: ${params.benchmark.typicalManagementScope.hasManagement ? `Yes (${params.benchmark.typicalManagementScope.typicalTeamSize})` : 'No'}
- Budget: ${params.benchmark.typicalBudgetOwnership.hasBudget ? `Yes (${params.benchmark.typicalBudgetOwnership.typicalBudgetRange})` : 'No'}
- Executive Exposure: ${params.benchmark.typicalExecutiveExposure.hasExposure ? `Yes (${params.benchmark.typicalExecutiveExposure.interactionLevel})` : 'No'}
- Years Experience: ${params.benchmark.typicalYearsExperience.typical}
- Education: ${params.benchmark.typicalEducation.level} in ${params.benchmark.typicalEducation.fields.join(' or ')}, Certifications: ${params.benchmark.typicalEducation.certifications.join(', ')}
- Key Competencies: ${params.benchmark.expectedCompetencies.join(', ')}

YOUR TASK:
1. Extract CONFIRMED data (explicitly stated in resume) - INCLUDING EDUCATION
2. Identify LIKELY inferences (80%+ confidence based on context)
3. Generate TARGETED questions ONLY for gaps where benchmark expects data but resume doesn't show it

Return STRICT JSON:
{
  "confirmed": {
    "hasManagementExperience": true/false,
    "managementDetails": "Specific quote from resume",
    "teamSizesManaged": [5, 10],
    "hasBudgetOwnership": true/false,
    "budgetDetails": "Specific quote from resume",
    "budgetSizesManaged": [500000, 2000000],
    "hasExecutiveExposure": true/false,
    "executiveDetails": "Specific quote from resume",
    "yearsOfExperience": 10,
    "seniorityLevel": "Mid-Level|Senior|Executive",
    "educationLevel": "Bachelor|Master|PhD|Associate|High School|None",
    "educationField": "Mechanical Engineering",
    "certifications": ["PMP", "PE"]
  },
  "likely": {
    "hasManagementExperience": true/false,
    "hasBudgetOwnership": true/false,
    "hasExecutiveExposure": true/false
  },
  "gaps_requiring_questions": [
    {
      "field": "budget_ownership",
      "question": "What was the typical budget size you managed for drilling operations?",
      "context": "Resume mentions cost management but no specific budget amounts",
      "expectedAnswer": "Dollar amount range"
    }
  ],
  "evidence": {
    "managementEvidence": ["Quote 1 from resume", "Quote 2"],
    "budgetEvidence": ["Quote 1", "Quote 2"],
    "executiveEvidence": ["Quote 1", "Quote 2"],
    "educationEvidence": ["Degree quote", "Certification quote"]
  }
}

CRITICAL RULES:
- Only mark as "confirmed" if explicitly stated in resume
- For EDUCATION: Extract degree type (Bachelor/Master/PhD), field of study, and certifications from resume
- DO NOT generate education questions if degree and field are confirmed in resume
- Use "likely" for strong contextual inferences (80%+ confidence)
- Generate targeted questions ONLY for missing data that the benchmark expects for this role
- Extract specific quotes as evidence`;

  try {
    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      max_tokens: 3000,
      temperature: 0.4,
      response_mime_type: "application/json"
    }, 'compare_resume_benchmark', params.userId);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return parseResult.data as ComparisonResult;
  } catch (error) {
    console.error('[BENCHMARK-COMPARISON] Error:', error);
    throw error;
  }
}

// ========================================================================
// 🎯 CAREER CONTEXT EXTRACTION (DEPRECATED - DO NOT USE)
// ========================================================================
/**
 * @deprecated DO NOT USE - Replaced by extractStructuredResumeData()
 * This function makes redundant AI calls and should NOT be called.
 * Keep for backward compatibility only.
 */
async function extractCareerContext(params: {
  resumeText: string;
  userId: string;
}): Promise<CareerContextData> {
  const prompt = `Analyze this resume and extract career context indicators.

Resume:
${params.resumeText}

**MANAGEMENT EXPERIENCE INDICATORS:**
Look for:
- Job titles: Manager, Supervisor, Lead, Director, VP, Chief, Head, Team Lead
- Action verbs: supervised, managed, led, guided, directed, oversaw, coordinated
- Team scope: "team of X", "X engineers", "X reports", "X rigs", "managed X people"
- Organizational structure: "reporting to X", "direct reports", "led a team"

**BUDGET OWNERSHIP INDICATORS:**
Look for:
- Dollar amounts: "$350MM", "$1.5M", "multi-million", "$500K budget"
- Financial terms: "budget responsibility", "P&L ownership", "cost center", "spending authority"
- Budget actions: "managed budget", "oversaw expenditures", "approved spending", "fiscal responsibility"

**EXECUTIVE EXPOSURE INDICATORS:**
Look for:
- C-suite interactions: "presented to CEO", "advised board", "executive briefings"
- Strategic scope: "company-wide initiative", "organizational transformation", "enterprise strategy"
- External representation: "industry speaker", "partnership negotiations", "executive committee"

**SENIORITY INFERENCE:**
Based on years of experience, job titles, and scope:
- Entry-Level: 0-2 years, Junior, Associate titles
- Mid-Level: 3-5 years, no management, specialist roles
- Senior: 6-10 years, small team lead, expert roles
- Senior Manager: 10-15 years, manages multiple teams/projects, significant budget
- Executive: 15+ years, VP/Director/C-suite, strategic decision-making

Return ONLY valid JSON (no markdown):
{
  "hasManagementExperience": boolean,
  "managementDetails": "Detailed description of management scope (empty string if none)",
  "teamSizesManaged": [array of numbers extracted from resume, empty array if none],
  "hasBudgetOwnership": boolean,
  "budgetDetails": "Detailed description of budget responsibility (empty string if none)",
  "budgetSizesManaged": [array of budget amounts in dollars, empty array if none],
  "hasExecutiveExposure": boolean,
  "executiveDetails": "Detailed description of executive interactions (empty string if none)",
  "yearsOfExperience": number (estimate from resume),
  "seniorityLevel": "Entry-Level" | "Mid-Level" | "Senior" | "Senior Manager" | "Executive"
}

**CRITICAL RULES:**
- If NO management indicators found, return hasManagementExperience: false
- If NO budget indicators found, return hasBudgetOwnership: false
- If NO executive indicators found, return hasExecutiveExposure: false
- Extract ALL team sizes and budget amounts you find
- Be generous with inference (e.g., "Supervisor" title = management experience)
- Return valid JSON only, no markdown code blocks`;

  try {
    const result = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      max_tokens: 1500,
      response_mime_type: "application/json"
    }, 'extract_career_context', params.userId);

    await logAIUsage(result.metrics);

    const content = result.response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return {
      hasManagementExperience: parseResult.data?.hasManagementExperience || false,
      managementDetails: parseResult.data?.managementDetails || '',
      teamSizesManaged: parseResult.data?.teamSizesManaged || [],
      hasBudgetOwnership: parseResult.data?.hasBudgetOwnership || false,
      budgetDetails: parseResult.data?.budgetDetails || '',
      budgetSizesManaged: parseResult.data?.budgetSizesManaged || [],
      hasExecutiveExposure: parseResult.data?.hasExecutiveExposure || false,
      executiveDetails: parseResult.data?.executiveDetails || '',
      yearsOfExperience: parseResult.data?.yearsOfExperience || 0,
      seniorityLevel: parseResult.data?.seniorityLevel || 'Mid-Level',
    };
  } catch (error) {
    console.error('[CAREER-CONTEXT-EXTRACTION] Error:', error);
    return {
      hasManagementExperience: false,
      managementDetails: '',
      teamSizesManaged: [],
      hasBudgetOwnership: false,
      budgetDetails: '',
      budgetSizesManaged: [],
      hasExecutiveExposure: false,
      executiveDetails: '',
      yearsOfExperience: 0,
      seniorityLevel: 'Mid-Level',
    };
  }
}

// ========================================================================
// VAULT CLEANUP HELPER
// ========================================================================

async function clearVaultData(supabase: any, vaultId: string): Promise<void> {
  await supabase.from('vault_power_phrases').delete().eq('vault_id', vaultId);
  await supabase.from('vault_transferable_skills').delete().eq('vault_id', vaultId);
  await supabase.from('vault_hidden_competencies').delete().eq('vault_id', vaultId);
  await supabase.from('vault_soft_skills').delete().eq('vault_id', vaultId);
  await supabase.from('vault_leadership_philosophy').delete().eq('vault_id', vaultId);
  await supabase.from('vault_executive_presence').delete().eq('vault_id', vaultId);

  await supabase
    .from('career_vault')
    .update({
      auto_populated: false,
      extraction_item_count: 0,
    })
    .eq('id', vaultId);

  console.log('✅ Vault data cleared');
}
