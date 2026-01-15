# Edge Function Developer Guide

**Last Updated:** 2025-01-09  
**Purpose:** Prevent naming mismatches and ensure consistent edge function usage

---

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Calling Edge Functions](#calling-edge-functions)
3. [Common Patterns](#common-patterns)
4. [Audit Suffixes](#audit-suffixes)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Testing & Verification](#testing--verification)
8. [Quick Reference](#quick-reference)

---

## Naming Conventions

### Standard Format

Edge functions follow **kebab-case** naming:

```
✅ CORRECT:
- analyze-resume
- generate-linkedin-post
- optimize-resume-with-audit
- auto-populate-vault-v3

❌ INCORRECT:
- analyzeResume (camelCase)
- analyze_resume (snake_case)
- AnalyzeResume (PascalCase)
```

### Version Suffixes

When creating new versions of existing functions:

```
✅ CORRECT:
- auto-populate-vault-v3 (version 3)
- parse-resume-v2 (version 2)

❌ INCORRECT:
- auto-populate-vault-new
- parse-resume-latest
- auto-populate-vault3 (no hyphen)
```

### Action-First Naming

Start with the action verb:

```
✅ CORRECT:
- generate-cover-letter (action: generate)
- analyze-job-requirements (action: analyze)
- optimize-resume-with-audit (action: optimize)

❌ UNCLEAR:
- cover-letter-generator
- job-requirements-analyzer
```

### Specificity Guidelines

Be specific enough to understand the purpose:

```
✅ CORRECT:
- generate-interview-followup (specific)
- analyze-ats-score (specific metric)
- optimize-resume-with-audit (includes audit detail)

❌ TOO VAGUE:
- generate-content
- analyze-data
- optimize-file
```

---

## Calling Edge Functions

### Method 1: Using Supabase Client (RECOMMENDED)

**Always use the Supabase client to invoke edge functions:**

```typescript
import { supabase } from '@/integrations/supabase/client';

// ✅ CORRECT
const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
  body: {
    resumeText: 'your resume text',
    jobDescription: 'job description'
  }
});
```

### Method 2: Direct HTTP (NOT RECOMMENDED)

Only use direct HTTP if absolutely necessary:

```typescript
// ⚠️ USE ONLY IF REQUIRED
const response = await fetch(
  `https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/optimize-resume-with-audit`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ resumeText, jobDescription })
  }
);
```

### **CRITICAL: Never Use Environment Variables**

```typescript
// ❌ NEVER DO THIS
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/function-name`;

// ❌ NEVER DO THIS
const url = `/api/function-name`; // Relative paths don't work

// ✅ CORRECT - Let Supabase client handle it
const { data, error } = await supabase.functions.invoke('function-name', { body });
```

---

## Common Patterns

### Resume & Analysis Functions

```typescript
// Resume operations
analyze-resume              // Basic resume analysis
analyze-resume-initial      // First-time analysis
analyze-resume-and-research // With industry research
optimize-resume-with-audit  // Optimization with quality audit
parse-resume                // Extract structured data
score-resume-match          // Match scoring

// Job analysis
analyze-job-requirements    // Extract requirements
analyze-job-qualifications  // Parse qualifications
parse-job-document          // Parse job posting
```

### Master Resume Operations

> **Note:** Database tables retain `vault_*` naming for backward compatibility.

```typescript
// Core Master Resume functions
auto-populate-vault-v3      // Current version
add-vault-item              // Single item addition
bulk-vault-operations       // Batch operations
get-vault-data              // Retrieve Master Resume data
search-vault-advanced       // Advanced search

// Master Resume analysis
discover-hidden-competencies // Find hidden skills
extract-vault-intangibles    // Extract soft skills
conduct-industry-research    // Industry context
```

### Generation Functions

```typescript
// Content generation
generate-linkedin-post       // LinkedIn content
generate-cover-letter        // Cover letters
generate-interview-prep      // Interview preparation
generate-networking-email    // Networking emails
generate-star-story          // STAR stories

// Resume sections
generate-executive-resume    // Executive-level resume
generate-dual-resume-section // A/B section generation
generate-power-phrases       // Achievement phrases
```

---

## Audit Suffixes

### When to Use `-with-audit`

Functions that include AI quality validation should use the `-with-audit` suffix:

```typescript
✅ USE -with-audit WHEN:
- Function validates output quality
- Includes confidence scoring
- Performs dual-AI review
- Returns quality metrics

EXAMPLES:
- optimize-resume-with-audit
- validate-interview-response-with-audit
- analyze-linkedin-post-with-audit
```

### Pattern Comparison

```typescript
// Without audit (simple operation)
generate-linkedin-post
  → Returns: { post: string }

// With audit (includes validation)
analyze-linkedin-post-with-audit
  → Returns: { post: string, qualityScore: number, suggestions: string[] }
```

---

## Best Practices

### 1. Always Import from Shared Types

```typescript
// ✅ CORRECT - Use shared types
import { VaultSuccessResponse } from '@/supabase/functions/_shared/vault-response-types';

async function callVaultFunction() {
  const { data, error } = await supabase.functions.invoke('auto-populate-vault-v3', {
    body: { vaultId, resumeText }
  });
  
  return data as VaultSuccessResponse;
}
```

### 2. Document Function Calls

Add JSDoc comments explaining the edge function being called:

```typescript
/**
 * Optimizes resume to match job description
 * @important Calls 'optimize-resume-with-audit' edge function (not 'optimize-resume-detailed')
 * @see supabase/functions/optimize-resume-with-audit/index.ts
 */
export async function optimizeResume(resumeText: string, jobDescription: string) {
  const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
    body: { resumeText, jobDescription }
  });
  
  if (error) throw error;
  return data;
}
```

### 3. Create Service Layer Wrappers

Don't call edge functions directly in components - use service layers:

```typescript
// ❌ AVOID - Direct call in component
function MyComponent() {
  const handleClick = async () => {
    const { data } = await supabase.functions.invoke('optimize-resume-with-audit', {...});
  };
}

// ✅ BETTER - Service layer wrapper
// src/lib/services/resumeOptimizer.ts
export async function optimizeResume(resumeText: string, jobDescription: string) {
  const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
    body: { resumeText, jobDescription }
  });
  
  if (error) throw error;
  return data;
}

// In component
import { optimizeResume } from '@/lib/services/resumeOptimizer';

function MyComponent() {
  const handleClick = async () => {
    const result = await optimizeResume(resumeText, jobDescription);
  };
}
```

### 4. Handle Errors Consistently

```typescript
// ✅ CORRECT - Proper error handling
try {
  const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
    body: { resumeText, jobDescription }
  });
  
  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Failed to optimize resume: ${error.message}`);
  }
  
  return data;
} catch (error) {
  console.error('Unexpected error:', error);
  throw error;
}
```

### 5. Type Return Values

```typescript
// ✅ CORRECT - Typed response
interface OptimizationResult {
  success: boolean;
  optimizedResume: string;
  analysis: {
    overallScore: number;
    improvements: string[];
  };
}

const { data } = await supabase.functions.invoke('optimize-resume-with-audit', {
  body: { resumeText, jobDescription }
});

const result = data as OptimizationResult;
```

---

## Common Pitfalls

### Pitfall 1: Using Old Function Names

```typescript
// ❌ WRONG - Old function name
await supabase.functions.invoke('optimize-resume-detailed', {...});

// ✅ CORRECT - Current function name
await supabase.functions.invoke('optimize-resume-with-audit', {...});
```

**How to avoid:**
- Always check `supabase/functions/` directory for actual function names
- Use VSCode search to find the edge function file before calling it
- Reference this guide when unsure

### Pitfall 2: Hardcoding URLs

```typescript
// ❌ WRONG - Hardcoded URL
const url = 'https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/my-function';

// ✅ CORRECT - Use Supabase client
await supabase.functions.invoke('my-function', {...});
```

### Pitfall 3: Missing Error Handling

```typescript
// ❌ WRONG - No error handling
const { data } = await supabase.functions.invoke('some-function', {...});
return data.result; // Could crash if data is null

// ✅ CORRECT - Proper error handling
const { data, error } = await supabase.functions.invoke('some-function', {...});
if (error) throw error;
if (!data) throw new Error('No data returned');
return data.result;
```

### Pitfall 4: Not Using Version Numbers

```typescript
// ❌ WRONG - No version tracking
auto-populate-vault        // Which version?
auto-populate-vault-new    // Unclear version

// ✅ CORRECT - Clear versioning
auto-populate-vault-v3     // Version 3 (current)
auto-populate-vault-v2     // Version 2 (legacy)
```

### Pitfall 5: Inconsistent Naming

```typescript
// ❌ WRONG - Inconsistent naming in codebase
File: supabase/functions/optimize-resume-with-audit/index.ts
Call: supabase.functions.invoke('optimize-resume-detailed')
      ❌ Names don't match!

// ✅ CORRECT - Consistent naming
File: supabase/functions/optimize-resume-with-audit/index.ts
Call: supabase.functions.invoke('optimize-resume-with-audit')
      ✅ Names match exactly!
```

---

## Testing & Verification

### Before Deploying Edge Functions

1. **Verify function exists:**
   ```bash
   ls supabase/functions/ | grep "your-function-name"
   ```

2. **Search for all calls to the function:**
   ```bash
   grep -r "invoke('your-function-name'" src/
   ```

3. **Check for hardcoded references:**
   ```bash
   grep -r "functions/v1/your-function-name" src/
   ```

### After Renaming Edge Functions

If you rename an edge function, update ALL references:

```bash
# 1. Find all references to old name
grep -r "old-function-name" src/ supabase/

# 2. Replace with new name
# Manual: Update each file
# Or use sed (be careful!):
find src/ -type f -exec sed -i 's/old-function-name/new-function-name/g' {} +

# 3. Test that function is called correctly
# Check dev console for 404 errors when testing
```

### Automated Verification Script

Create a test to verify function names match:

```typescript
// tests/edge-functions.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Edge Function Name Consistency', () => {
  it('should have matching function names in code and file system', () => {
    // Get all function directories
    const functionsDir = path.join(__dirname, '../supabase/functions');
    const functionDirs = fs.readdirSync(functionsDir)
      .filter(f => fs.statSync(path.join(functionsDir, f)).isDirectory())
      .filter(f => !f.startsWith('_')); // Exclude _shared

    // Check each function is called correctly in codebase
    const srcDir = path.join(__dirname, '../src');
    const srcFiles = getAllTypeScriptFiles(srcDir);
    
    functionDirs.forEach(funcName => {
      const hasValidCall = srcFiles.some(file => {
        const content = fs.readFileSync(file, 'utf-8');
        return content.includes(`invoke('${funcName}'`);
      });
      
      // Some functions may not be called from frontend (background jobs)
      // But we should have a list of known unused functions
      const knownBackgroundJobs = ['daily-job-matcher', 'check-cost-alerts'];
      
      if (!hasValidCall && !knownBackgroundJobs.includes(funcName)) {
        console.warn(`⚠️ Function '${funcName}' may not be called anywhere`);
      }
    });
  });
});
```

---

## Quick Reference

### Function Name Checklist

Before calling an edge function, verify:

- [ ] Function file exists in `supabase/functions/[name]/index.ts`
- [ ] Name uses kebab-case (hyphens, not underscores or camelCase)
- [ ] Name matches exactly (case-sensitive)
- [ ] Using `supabase.functions.invoke()` not direct HTTP
- [ ] Error handling is in place
- [ ] Return type is properly typed
- [ ] JSDoc comment documents the function call

### Finding Function Names

```bash
# List all edge functions
ls supabase/functions/

# Search for function calls in codebase
grep -r "\.functions\.invoke(" src/

# Find a specific function's usage
grep -r "invoke('function-name'" src/
```

### Common Function Categories

| Category | Pattern | Examples |
|----------|---------|----------|
| Analysis | `analyze-*` | `analyze-resume`, `analyze-job-requirements` |
| Generation | `generate-*` | `generate-linkedin-post`, `generate-cover-letter` |
| Optimization | `optimize-*` | `optimize-resume-with-audit` |
| Vault Operations | `*-vault-*` | `auto-populate-vault-v3`, `add-vault-item` |
| Parsing | `parse-*` | `parse-resume`, `parse-job-document` |
| Interview | `*-interview-*` | `generate-interview-prep`, `validate-interview-response` |

---

## Maintenance

### When Adding New Edge Functions

1. **Follow naming convention** (kebab-case, action-first)
2. **Document in this guide** if introducing new pattern
3. **Add JSDoc comments** where function is called
4. **Create service wrapper** in appropriate service file
5. **Add to shared types** if needed
6. **Update function inventory** (see Active Functions list in audit)

### When Deprecating Edge Functions

1. **Find all usages** with `grep -r "invoke('function-name'" src/`
2. **Update all references** to new function name
3. **Test thoroughly** after renaming
4. **Add to DEPRECATED_FUNCTIONS.md**
5. **Delete after confirming no usage**

### Quarterly Review

Every quarter, audit edge functions for:
- [ ] Unused functions (no `invoke()` calls)
- [ ] Name mismatches (file name ≠ invoke name)
- [ ] Missing documentation
- [ ] Inconsistent error handling
- [ ] Outdated patterns

---

## Resources

- **Supabase Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **Project Audit Report:** `COMPREHENSIVE_DEPRECATION_AUDIT.md`
- **Deprecated Functions List:** `DEPRECATED_FUNCTIONS.md`
- **Vault Response Types:** `supabase/functions/_shared/vault-response-types.ts`
- **Vault Naming Reference:** `docs/VAULT_NAMING_CONVENTIONS.md`

---

**Questions or Issues?**

If you encounter edge function naming issues:
1. Check this guide first
2. Search the audit report for the function name
3. Verify the function exists in `supabase/functions/`
4. Check git history for recent renames
5. Update this guide if you find new patterns

---

*Last reviewed: 2025-01-09*  
*Next review: April 2025*