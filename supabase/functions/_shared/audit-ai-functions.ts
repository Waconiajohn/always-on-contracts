/**
 * AI Function Audit Script
 * 
 * Scans all edge functions that use AI and generates a compliance report.
 * Checks adherence to ai-prompt-standards.md requirements.
 * 
 * Usage: Run this manually to audit current state of AI functions
 */

interface AuditResult {
  functionName: string;
  filePath: string;
  checks: {
    usesNewAIConfig: boolean;
    usesNewJSONParser: boolean;
    logsRawResponse: boolean;
    validatesFields: boolean;
    hasExplicitJSONInstruction: boolean;
    usesAppropriateModel: boolean;
    setsTemperature: boolean;
    hasCORS: boolean;
    logsUsageMetrics: boolean;
    hasResponseFormat: boolean;
  };
  complianceScore: number;
  issues: string[];
}

interface AuditSummary {
  totalFunctions: number;
  fullyCompliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  averageScore: number;
  results: AuditResult[];
  generatedAt: string;
}

/**
 * Audit criteria weights (total = 100)
 */
const WEIGHTS = {
  usesNewAIConfig: 10,
  usesNewJSONParser: 10,
  logsRawResponse: 15,
  validatesFields: 15,
  hasExplicitJSONInstruction: 20,
  usesAppropriateModel: 5,
  setsTemperature: 5,
  hasCORS: 5,
  logsUsageMetrics: 10,
  hasResponseFormat: 5,
};

/**
 * List of functions to audit (manually maintained for now)
 * In a real implementation, this would scan the filesystem
 */
const FUNCTIONS_TO_AUDIT = [
  // Career Vault
  'enhance-vault-item',
  'batch-enhance-items',
  'suggest-keywords',
  'suggest-hidden-strengths',
  'assess-vault-quality',
  'auto-populate-vault-v3',
  'discover-hidden-competencies',
  
  // Resume Analysis
  'analyze-resume',
  'analyze-resume-initial',
  'analyze-resume-and-research',
  'parse-resume',
  'score-resume-match',
  'analyze-ats-score',
  
  // Gap Analysis & Roadmaps
  'gap-analysis',
  'generate-gap-analysis',
  'generate-gap-roadmap',
  
  // Job Matching
  'ai-job-matcher',
  'analyze-job-requirements',
  'analyze-job-qualifications',
  'match-vault-to-requirements',
  
  // Interview Prep
  'generate-interview-question',
  'generate-star-story',
  'validate-interview-response',
  'generate-behavioral-questions',
  
  // Content Generation
  'generate-linkedin-post',
  'optimize-linkedin-profile',
  'generate-elevator-pitch',
  'generate-series-posts',
  
  // Research
  'conduct-industry-research',
  'generate-company-research',
  'research-industry-standards',
  'perplexity-research',
];

/**
 * Audit a single function's code for compliance
 */
function auditFunction(functionName: string, code: string): AuditResult {
  const checks = {
    usesNewAIConfig: code.includes("from '../_shared/lovable-ai-config.ts'") || 
                     code.includes('from "../_shared/lovable-ai-config.ts"'),
    
    usesNewJSONParser: code.includes("from '../_shared/json-parser.ts'") || 
                       code.includes('from "../_shared/json-parser.ts"'),
    
    logsRawResponse: code.includes('console.log') && 
                     (code.includes('.substring(0, 500)') || code.includes('.slice(0, 500)')),
    
    validatesFields: code.includes('if (!') && 
                     (code.includes('.data') || code.includes('parseResult')),
    
    hasExplicitJSONInstruction: code.includes('Return ONLY valid JSON') || 
                                code.includes('Return only valid JSON') ||
                                code.includes('return only JSON'),
    
    usesAppropriateModel: code.includes('LOVABLE_AI_MODELS'),
    
    setsTemperature: code.includes('temperature:'),
    
    hasCORS: code.includes('corsHeaders') && 
             code.includes("'Access-Control-Allow-Origin'"),
    
    logsUsageMetrics: code.includes('logAIUsage') || 
                      code.includes('await logAIUsage'),
    
    hasResponseFormat: code.includes('response_format') && 
                       code.includes('json_object'),
  };

  // Calculate compliance score
  let score = 0;
  for (const [key, passed] of Object.entries(checks)) {
    if (passed) {
      score += WEIGHTS[key as keyof typeof WEIGHTS];
    }
  }

  // Identify issues
  const issues: string[] = [];
  if (!checks.usesNewAIConfig) issues.push('Not using lovable-ai-config.ts');
  if (!checks.usesNewJSONParser) issues.push('Not using json-parser.ts');
  if (!checks.logsRawResponse) issues.push('Missing raw response logging');
  if (!checks.validatesFields) issues.push('Missing field validation');
  if (!checks.hasExplicitJSONInstruction) issues.push('Missing "Return ONLY valid JSON" instruction');
  if (!checks.usesAppropriateModel) issues.push('Not using LOVABLE_AI_MODELS constant');
  if (!checks.setsTemperature) issues.push('Temperature not set');
  if (!checks.hasCORS) issues.push('CORS headers missing or incorrect');
  if (!checks.logsUsageMetrics) issues.push('Not logging usage metrics');
  if (!checks.hasResponseFormat) issues.push('Missing response_format: json_object');

  return {
    functionName,
    filePath: `supabase/functions/${functionName}/index.ts`,
    checks,
    complianceScore: score,
    issues,
  };
}

/**
 * Generate audit summary
 */
function generateSummary(results: AuditResult[]): AuditSummary {
  const totalFunctions = results.length;
  const fullyCompliant = results.filter(r => r.complianceScore === 100).length;
  const partiallyCompliant = results.filter(r => r.complianceScore >= 50 && r.complianceScore < 100).length;
  const nonCompliant = results.filter(r => r.complianceScore < 50).length;
  const averageScore = results.reduce((sum, r) => sum + r.complianceScore, 0) / totalFunctions;

  return {
    totalFunctions,
    fullyCompliant,
    partiallyCompliant,
    nonCompliant,
    averageScore: Math.round(averageScore),
    results: results.sort((a, b) => a.complianceScore - b.complianceScore),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format audit report as markdown
 */
function formatMarkdownReport(summary: AuditSummary): string {
  let report = `# AI Function Audit Report

**Generated:** ${new Date(summary.generatedAt).toLocaleString()}

## Summary

- **Total Functions Audited:** ${summary.totalFunctions}
- **Fully Compliant (100%):** ${summary.fullyCompliant}
- **Partially Compliant (50-99%):** ${summary.partiallyCompliant}
- **Non-Compliant (<50%):** ${summary.nonCompliant}
- **Average Compliance Score:** ${summary.averageScore}%

---

## Detailed Results

`;

  for (const result of summary.results) {
    const status = result.complianceScore === 100 ? '✅' : 
                   result.complianceScore >= 50 ? '⚠️' : '❌';
    
    report += `### ${status} ${result.functionName} (${result.complianceScore}%)\n\n`;
    report += `**Path:** \`${result.filePath}\`\n\n`;
    
    report += '**Checks:**\n';
    for (const [key, passed] of Object.entries(result.checks)) {
      const icon = passed ? '✅' : '❌';
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      report += `- ${icon} ${label}\n`;
    }
    
    if (result.issues.length > 0) {
      report += '\n**Issues to Fix:**\n';
      for (const issue of result.issues) {
        report += `- ${issue}\n`;
      }
    }
    
    report += '\n---\n\n';
  }

  return report;
}

/**
 * Format audit report as CSV
 */
function formatCSVReport(summary: AuditSummary): string {
  const headers = [
    'Function Name',
    'Compliance Score',
    'Uses New AI Config',
    'Uses New JSON Parser',
    'Logs Raw Response',
    'Validates Fields',
    'Has JSON Instruction',
    'Uses Appropriate Model',
    'Sets Temperature',
    'Has CORS',
    'Logs Usage Metrics',
    'Has Response Format',
    'Issues'
  ];

  let csv = headers.join(',') + '\n';

  for (const result of summary.results) {
    const row = [
      result.functionName,
      result.complianceScore,
      result.checks.usesNewAIConfig ? 'Yes' : 'No',
      result.checks.usesNewJSONParser ? 'Yes' : 'No',
      result.checks.logsRawResponse ? 'Yes' : 'No',
      result.checks.validatesFields ? 'Yes' : 'No',
      result.checks.hasExplicitJSONInstruction ? 'Yes' : 'No',
      result.checks.usesAppropriateModel ? 'Yes' : 'No',
      result.checks.setsTemperature ? 'Yes' : 'No',
      result.checks.hasCORS ? 'Yes' : 'No',
      result.checks.logsUsageMetrics ? 'Yes' : 'No',
      result.checks.hasResponseFormat ? 'Yes' : 'No',
      `"${result.issues.join('; ')}"`,
    ];

    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Main audit function
 * 
 * In a real implementation, this would:
 * 1. Read all files in supabase/functions/
 * 2. Filter for functions that import AI libraries
 * 3. Audit each one
 * 4. Generate reports
 * 
 * For now, this is a template that can be adapted
 */
export async function runAudit(functionCodes: Record<string, string>): Promise<AuditSummary> {
  console.log(`[audit] Starting audit of ${Object.keys(functionCodes).length} functions...`);

  const results: AuditResult[] = [];

  for (const [functionName, code] of Object.entries(functionCodes)) {
    const result = auditFunction(functionName, code);
    results.push(result);
    console.log(`[audit] ${functionName}: ${result.complianceScore}% (${result.issues.length} issues)`);
  }

  const summary = generateSummary(results);
  
  console.log(`[audit] Audit complete!`);
  console.log(`[audit] Average compliance: ${summary.averageScore}%`);
  console.log(`[audit] ${summary.fullyCompliant}/${summary.totalFunctions} fully compliant`);

  return summary;
}

/**
 * Export report functions for use in other scripts
 */
export { formatMarkdownReport, formatCSVReport };

/**
 * Usage example (in a separate script or edge function):
 * 
 * import { runAudit, formatMarkdownReport } from './_shared/audit-ai-functions.ts';
 * 
 * // Collect function codes (pseudo-code)
 * const functionCodes = {
 *   'enhance-vault-item': readFile('supabase/functions/enhance-vault-item/index.ts'),
 *   'batch-enhance-items': readFile('supabase/functions/batch-enhance-items/index.ts'),
 *   // ... etc
 * };
 * 
 * // Run audit
 * const summary = await runAudit(functionCodes);
 * 
 * // Generate markdown report
 * const markdownReport = formatMarkdownReport(summary);
 * console.log(markdownReport);
 * 
 * // Or save to file
 * await Deno.writeTextFile('audit-report.md', markdownReport);
 */
