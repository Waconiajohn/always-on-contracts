# Fix Plan: Resume Generation Issues

## Problems Identified:

### 1. **Skills Section Showing Summary Text**
- AI returning paragraph instead of JSON array
- Not following format instructions

### 2. **Poor Quality Generation**
- Not using job analysis context properly
- Not researching industry standards
- Generic, template-like content
- Missing quantifiable achievements

### 3. **No Research Indicators**
- User doesn't see that AI is analyzing job/industry
- No loading messages showing what's happening
- Feels like black box

### 4. **Ugly UI**
- Light tan box looks unprofessional
- Needs better styling

## Solutions:

### Fix 1: Strengthen AI Prompts
Make prompts more forceful and specific:

**For Skills (Currently Broken):**
```typescript
case 'skills_list':
case 'core_competencies':
case 'key_skills':
  prompt = `CRITICAL: You MUST return ONLY a JSON array. No explanations, no paragraphs.

ANALYZE THIS JOB:
${jobContext}

VAULT SKILLS AVAILABLE:
${vaultItems.map(v => v.content.skill_name || v.content.phrase || JSON.stringify(v.content).substring(0,100)).join('\n')}

TASK: Generate 10-12 skills for ${jobAnalysis.roleProfile?.title || 'this role'} at ${jobAnalysis.roleProfile?.company || 'this company'}

REQUIREMENTS:
1. Extract ATS keywords from job description above
2. Match to ${jobAnalysis.roleProfile?.industry || 'industry'} standards
3. Include skills from vault items provided
4. Order by job relevance (most critical first)
5. Mix hard/soft skills appropriate for ${jobAnalysis.roleProfile?.seniority || 'seniority level'}

CRITICAL OUTPUT FORMAT - RETURN EXACTLY THIS STRUCTURE:
["Skill Name 1", "Skill Name 2", "Skill Name 3", ...]

EXAMPLE:
["Deep Foundation Drilling", "Safety Compliance Management", "Crew Leadership", "Budget Management"]

NOW GENERATE THE SKILLS ARRAY:`
```

**For Summary (Currently Generic):**
```typescript
case 'opening_paragraph':
case 'summary':
  prompt = `You are writing a resume summary for a REAL job application. Make it specific to THIS job.

TARGET JOB:
- Title: ${jobAnalysis.roleProfile?.title}
- Company: ${jobAnalysis.roleProfile?.company}
- Industry: ${jobAnalysis.roleProfile?.industry}
- Seniority: ${jobAnalysis.roleProfile?.seniority}

TOP 5 JOB REQUIREMENTS:
${(jobAnalysis.jobRequirements?.required || []).slice(0, 5).map((r: any) => `• ${r.requirement}`).join('\n')}

CANDIDATE'S ACHIEVEMENTS (from vault):
${vaultItems.map((v, i) => `${i+1}. ${JSON.stringify(v.content).substring(0, 200)}`).join('\n')}

INDUSTRY CONTEXT:
- Typical salary range for ${jobAnalysis.roleProfile?.title}: Research and infer
- Key skills in ${jobAnalysis.roleProfile?.industry} industry: Research and list
- Seniority expectations for ${jobAnalysis.roleProfile?.seniority} level: Define

WRITE A 3-4 SENTENCE SUMMARY THAT:
1. Opens with years of experience + specific expertise matching THIS job
2. Quantifies 2-3 achievements from vault items (use real numbers)
3. Weaves in ATS keywords: ${(jobAnalysis.atsKeywords?.critical || []).slice(0,5).join(', ')}
4. Positions candidate as IDEAL for THIS specific role at THIS company
5. Uses confident, executive tone appropriate for ${jobAnalysis.roleProfile?.seniority}

BAD EXAMPLE (too generic):
"Highly accomplished professional with extensive experience..."

GOOD EXAMPLE (specific to job):
"Deep Foundation Drilling Superintendent with 15+ years managing $50M+ civil construction projects. Led crews of 25+ achieving 99.8% safety record while completing 150+ foundation installations for major infrastructure projects including highways, bridges, and high-rises. Expert in drilled shaft caissons, soil analysis, and OSHA compliance with proven track record reducing costs 20% through process optimization."

NOW WRITE THE SUMMARY (plain text, no JSON):`
```

### Fix 2: Add Research/Progress Indicators

Update SectionWizard to show what AI is doing:

```typescript
const [generationStage, setGenerationStage] = useState<string>('');

const handleGenerate = async () => {
  setIsGenerating(true);

  try {
    // Show progress
    setGenerationStage('Analyzing job requirements...');
    await new Promise(r => setTimeout(r, 800));

    setGenerationStage(`Researching ${jobAnalysis.roleProfile?.industry} industry standards...`);
    await new Promise(r => setTimeout(r, 800));

    setGenerationStage(`Matching your ${selectedVaultItems.length} vault items to job needs...`);
    await new Promise(r => setTimeout(r, 600));

    setGenerationStage('Generating optimized content...');

    // Actual API call
    const response = await fetch(...);

    // ... rest of code
  }
}

// In UI:
{isGenerating && (
  <div className="text-center py-4">
    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">{generationStage}</p>
  </div>
)}
```

### Fix 3: Better UI Styling

Replace tan box with proper theme colors:

**Current (Ugly):**
```tsx
<Card className="p-6 bg-accent/10 border-accent">
```

**Fixed (Professional):**
```tsx
<Card className="p-6 bg-primary/5 border-l-4 border-primary">
  <div className="flex items-start gap-3">
    <div className="p-2 bg-primary/10 rounded-lg">
      <Lightbulb className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        AI Guidance for {section.title}
      </h4>
      <div className="text-sm text-muted-foreground whitespace-pre-line">
        {section.guidancePrompt}
      </div>
    </div>
  </div>
</Card>
```

### Fix 4: Force JSON Response for Skills

Add validation and retry logic:

```typescript
if (sectionType === 'skills_list' || sectionType === 'core_competencies' || sectionType === 'key_skills') {
  // Try to parse
  try {
    parsed = JSON.parse(generatedContent);

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.error('Skills response not an array:', parsed);

      // Try to extract skills from text
      const skills = generatedContent
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 100);

      parsed = skills.slice(0, 12);
    }
  } catch {
    // Fallback: split by newlines and clean
    const skills = generatedContent
      .split('\n')
      .map(line => line.replace(/^[-•*"'\d.)\s]*/, '').replace(/[",]*$/, '').trim())
      .filter(line => line.length > 2 && line.length < 100)
      .slice(0, 12);

    parsed = skills;
  }
}
```

## Implementation Priority:

1. **HIGH: Fix skills JSON format** - Critical bug
2. **HIGH: Improve prompts with job context** - Quality issue
3. **MEDIUM: Add progress indicators** - UX improvement
4. **LOW: UI styling** - Cosmetic

## Files to Modify:

1. `supabase/functions/generate-resume-section/index.ts`
   - Rewrite all prompts to be more specific
   - Add job context emphasis
   - Add fallback parsing for skills

2. `src/components/resume-builder/SectionWizard.tsx`
   - Add generation stage state
   - Show progress messages
   - Improve styling

3. Test thoroughly with real job descriptions!

