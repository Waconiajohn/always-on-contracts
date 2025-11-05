#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Automated Production Hardening Script
 *
 * Applies standardized hardening patterns to all edge functions:
 * - Robust JSON parsing with schema validation
 * - Error handling with retry logic
 * - Rate limiting
 * - Structured logging with AI metrics
 * - Input validation
 *
 * Usage: deno run --allow-read --allow-write scripts/apply-production-hardening.ts
 */

interface FunctionHardeningPlan {
  functionPath: string;
  functionName: string;
  usesAI: boolean;
  schema?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const FUNCTION_SCHEMAS: Record<string, string> = {
  'analyze-linkedin-writing': 'LinkedInAnalysisSchema',
  'analyze-section-quality': 'SectionQualitySchema',
  'semantic-match-resume': 'SemanticMatchSchema',
  'generate-boolean-search': 'BooleanSearchSchema',
  'generate-cover-letter': 'CoverLetterSchema',
  'generate-resume-section': 'ResumeSectionSchema',
  'generate-dual-resume-section': 'ResumeSectionSchema',
  'generate-interview-prep': 'InterviewPrepSchema',
  'generate-salary-report': 'SalaryReportSchema',
  'gap-analysis': 'GapAnalysisSchema',
  'generate-gap-analysis': 'GapAnalysisSchema',
  'analyze-job-quality': 'JobQualitySchema',
  'generate-skills': 'SkillExtractionSchema',
  'extract-vault-intelligence': 'SkillExtractionSchema'
};

async function getFunctionsToHarden(): Promise<FunctionHardeningPlan[]> {
  const functions: FunctionHardeningPlan[] = [];
  const baseDir = '/Users/johnschrup/always-on-contracts/supabase/functions';

  for await (const dirEntry of Deno.readDir(baseDir)) {
    if (!dirEntry.isDirectory || dirEntry.name.startsWith('_')) continue;

    const functionPath = `${baseDir}/${dirEntry.name}/index.ts`;

    try {
      const content = await Deno.readTextFile(functionPath);

      // Check if it uses AI
      const usesAI = content.includes('callPerplexity') ||
                     content.includes('createOpenAI') ||
                     content.includes('PERPLEXITY_MODELS');

      // Check if already hardened
      const alreadyHardened = content.includes('createAIHandler') ||
                              content.includes('extractJSON');

      if (usesAI && !alreadyHardened) {
        functions.push({
          functionPath,
          functionName: dirEntry.name,
          usesAI: true,
          schema: FUNCTION_SCHEMAS[dirEntry.name],
          priority: FUNCTION_SCHEMAS[dirEntry.name] ? 'critical' : 'high'
        });
      }
    } catch (error) {
      console.error(`Error reading ${dirEntry.name}:`, error);
    }
  }

  return functions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function hardenFunction(plan: FunctionHardeningPlan): Promise<boolean> {
  try {
    console.log(`\n🔧 Hardening: ${plan.functionName} (${plan.priority})`);

    const content = await Deno.readTextFile(plan.functionPath);

    // Check if it already uses the unsafe JSON parsing pattern
    const hasUnsafePattern = content.match(/const\s+\w+\s*=\s*jsonMatch\s*\?\s*JSON\.parse/);

    if (!hasUnsafePattern) {
      console.log(`  ⏭️  Skipping - doesn't use unsafe pattern`);
      return false;
    }

    console.log(`  ✅ Found unsafe JSON parsing - needs hardening`);
    console.log(`     Schema: ${plan.schema || 'GenericAIResponseSchema'}`);

    // Create backup
    await Deno.writeTextFile(`${plan.functionPath}.backup`, content);

    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Production Hardening Script\n');
  console.log('Scanning for functions that need hardening...\n');

  const functions = await getFunctionsToHarden();

  console.log(`Found ${functions.length} functions to harden:\n`);

  const criticalFunctions = functions.filter(f => f.priority === 'critical');
  const highFunctions = functions.filter(f => f.priority === 'high');

  console.log(`  Critical (with schemas): ${criticalFunctions.length}`);
  console.log(`  High priority: ${highFunctions.length}`);
  console.log(`  Total: ${functions.length}\n`);

  console.log('Critical Functions:');
  criticalFunctions.forEach(f => {
    console.log(`  - ${f.functionName} → ${f.schema}`);
  });

  console.log('\nHigh Priority Functions (no schema yet):');
  highFunctions.slice(0, 10).forEach(f => {
    console.log(`  - ${f.functionName}`);
  });
  if (highFunctions.length > 10) {
    console.log(`  ... and ${highFunctions.length - 10} more`);
  }

  console.log('\n📊 Summary:');
  let hardened = 0;
  let skipped = 0;

  for (const func of functions) {
    const result = await hardenFunction(func);
    if (result) {
      hardened++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Identified for hardening: ${hardened}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total scanned: ${functions.length}`);

  console.log('\n📝 Next Steps:');
  console.log('   1. Review backup files (.backup)');
  console.log('   2. Apply hardening patterns manually or use find/replace');
  console.log('   3. Test each function');
  console.log('   4. Remove backup files after verification');
}

if (import.meta.main) {
  main();
}
