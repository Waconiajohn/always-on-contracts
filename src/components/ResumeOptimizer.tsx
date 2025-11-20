import { useState, useEffect } from 'react';
import { ResumeOptimizationResult } from '@/lib/services/resumeOptimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  OptimizeResumeSchema,
  safeValidateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

export function ResumeOptimizer() {
  const [step, setStep] = useState<'input' | 'analysis' | 'optimization'>('input');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<ResumeOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [loadingVault, setLoadingVault] = useState(true);

  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vault } = await supabase
        .from('career_vault')
        .select(`
          resume_raw_text,
          vault_power_phrases(phrase, context),
          vault_confirmed_skills(skill_name, proficiency_level)
        `)
        .eq('user_id', user.id)
        .single();

      if (vault) {
        setVaultData(vault);
        // Auto-populate resume if empty
        if (!resumeText && vault.resume_raw_text) {
          setResumeText(vault.resume_raw_text);
        }
      }
    } catch (error) {
      logger.error('Error loading Career Vault data', error);
    } finally {
      setLoadingVault(false);
    }
  };

  const insertPowerPhrase = (phrase: string) => {
    setResumeText(prev => prev + '\n' + phrase);
    toast.success('Power phrase added to resume');
  };

  const handleOptimize = async () => {
    if (!resumeText || !jobDescription) {
      toast.error('Please provide both resume text and job description');
      return;
    }

    setIsOptimizing(true);

    try {
      const validation = safeValidateInput(OptimizeResumeSchema, {
        resumeText,
        jobDescription
      });

      if (!validation.success) {
        setIsOptimizing(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'optimize-resume-with-audit',
        { ...validation.data, vaultData }
      );

      if (error) return;

      setResult(data);
      
      // Save the optimized resume to database
      await saveOptimizedResume(data);
    } finally {
      setIsOptimizing(false);
    }
  };

  const saveOptimizedResume = async (optimizationResult: ResumeOptimizationResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('Cannot save resume: user not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('resume_versions')
        .insert({
          user_id: user.id,
          version_name: `Optimized - ${new Date().toLocaleDateString()}`,
          content: {
            resumeText: optimizationResult.optimizedResume,
            jobDescription,
            analysis: optimizationResult.analysis,
            improvements: optimizationResult.improvements,
            missingKeywords: optimizationResult.missingKeywords,
            recommendations: optimizationResult.recommendations
          },
          html_content: formatResumeAsHTML(optimizationResult.optimizedResume),
          match_score: optimizationResult.analysis.overallScore
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Resume saved successfully');
      logger.info('Optimized resume saved', { versionId: data.id });
    } catch (error) {
      logger.error('Failed to save optimized resume', error);
      toast.error('Failed to save resume');
    }
  };

  const formatResumeAsHTML = (resumeText: string): string => {
    const sections = parseResumeText(resumeText);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
    .header h1 { font-size: 28px; font-weight: 700; color: #1e40af; margin-bottom: 8px; }
    .header .contact { font-size: 11px; color: #666; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e40af; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 12px; }
    .summary { font-size: 11px; line-height: 1.7; text-align: justify; }
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; font-size: 10px; }
    .skill-item { padding: 2px 0; }
    .job { margin-bottom: 16px; page-break-inside: avoid; }
    .job-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .job-title { font-size: 12px; font-weight: 600; color: #1e40af; }
    .job-meta { font-size: 10px; color: #666; }
    .job-company { font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 6px; }
    .job-bullets { margin-left: 20px; }
    .job-bullets li { font-size: 10px; margin-bottom: 4px; line-height: 1.5; }
    .education-item { margin-bottom: 12px; }
    .education-item .degree { font-size: 11px; font-weight: 600; }
    .education-item .school { font-size: 10px; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(sections.name)}</h1>
    <div class="contact">${escapeHtml(sections.contact)}</div>
  </div>

  ${sections.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${escapeHtml(sections.summary)}</div>
  </div>
  ` : ''}

  ${sections.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Technical Skills</div>
    <div class="skills-grid">
      ${sections.skills.map((skill: string) => `<div class="skill-item">• ${escapeHtml(skill)}</div>`).join('')}
    </div>
  </div>
  ` : ''}

  ${sections.experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${sections.experience.map((job: any) => `
      <div class="job">
        <div class="job-header">
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-meta">${escapeHtml(job.dates)}</div>
        </div>
        <div class="job-company">${escapeHtml(job.company)} | ${escapeHtml(job.location)}</div>
        <ul class="job-bullets">
          ${job.bullets.map((bullet: string) => `<li>${escapeHtml(bullet)}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${sections.education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${sections.education.map((edu: any) => `
      <div class="education-item">
        <div class="degree">${escapeHtml(edu.degree)}</div>
        <div class="school">${escapeHtml(edu.school)} | ${escapeHtml(edu.location)}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
    `.trim();
  };

  const parseResumeText = (text: string) => {
    const sections: any = {
      name: '',
      contact: '',
      summary: '',
      skills: [],
      experience: [],
      education: []
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentSection = '';
    let currentJob: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Detect section headers
      if (lowerLine.includes('professional summary') || lowerLine.includes('summary')) {
        currentSection = 'summary';
        continue;
      } else if (lowerLine.includes('technical skills') || lowerLine.includes('skills')) {
        currentSection = 'skills';
        continue;
      } else if (lowerLine.includes('professional experience') || lowerLine.includes('experience')) {
        currentSection = 'experience';
        continue;
      } else if (lowerLine.includes('education')) {
        currentSection = 'education';
        continue;
      }

      // Parse based on current section
      if (!currentSection && i < 3) {
        // First few lines are header
        if (i === 0) sections.name = line;
        else sections.contact += (sections.contact ? ' | ' : '') + line;
      } else if (currentSection === 'summary') {
        sections.summary += (sections.summary ? ' ' : '') + line;
      } else if (currentSection === 'skills') {
        // Parse skills (handle both bullet and comma-separated)
        if (line.startsWith('●') || line.startsWith('•')) {
          const skillText = line.substring(1).trim();
          // Split by commas and clean
          const skills = skillText.split(/,\s*/).map(s => s.trim()).filter(s => s);
          sections.skills.push(...skills);
        }
      } else if (currentSection === 'experience') {
        // Detect job title line (has dates)
        if (line.includes('|') && (line.includes('20') || line.includes('Present'))) {
          if (currentJob) sections.experience.push(currentJob);
          
          const parts = line.split('|').map(p => p.trim());
          currentJob = {
            title: parts[0] || '',
            company: parts[1] || '',
            location: parts[2] || '',
            dates: parts[3] || parts[2] || '',
            bullets: []
          };
        } else if (currentJob && (line.startsWith('●') || line.startsWith('•') || line.startsWith('-'))) {
          currentJob.bullets.push(line.substring(1).trim());
        }
      } else if (currentSection === 'education') {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          sections.education.push({
            degree: parts[0] || '',
            school: parts[1] || '',
            location: parts[2] || ''
          });
        }
      }
    }

    // Add last job if exists
    if (currentJob) sections.experience.push(currentJob);

    return sections;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handleStartAnalysis = () => {
    if (!jobDescription) {
      toast.error('Please provide a job description');
      return;
    }
    setStep('analysis');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (step === 'input') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resume Scoring & Optimization</h1>
          <p className="text-muted-foreground">
            A high resume score gets you into the conversation—it doesn't guarantee the job. 
            When 200 people apply, recruiters only review top 10-20 resumes. You need 90%+ to be reviewed. 
            But even at 97%, you could be competing against 23 others scoring higher. Plus, if your LinkedIn brand is weak 
            or your interview prep is shallow, that high score alone won't make you the benchmark candidate.
          </p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Multi-Dimensional Reality:</strong> A 90% resume score means you'll be reviewed—not that you're the benchmark candidate. 
            Benchmark candidates excel across ALL dimensions: Resume (90%+), LinkedIn positioning (top 10 in searches), 
            interview mastery (all formats), market intelligence, and strategic networking. 
            Any single high score just gets you into the conversation.
          </AlertDescription>
        </Alert>

        {vaultData && !loadingVault && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Career Vault Intelligence
              </CardTitle>
              <CardDescription>
                Click to add power phrases to your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {vaultData.vault_power_phrases?.slice(0, 10).map((phrase: any, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => insertPowerPhrase(phrase.phrase)}
                  >
                    <span className="text-xs">{phrase.phrase}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
              <CardDescription>Paste your current resume text</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Paste your resume text here..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                {resumeText.length} characters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>Paste the target job description</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Paste the job description here..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                {jobDescription.length} characters
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleStartAnalysis}
            disabled={!resumeText || !jobDescription}
            size="lg"
            className="w-full md:w-auto"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Start Deep Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'analysis') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Analysis</h1>
          <p className="text-muted-foreground">
            Understanding what the hiring manager really wants
          </p>
        </div>

        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            <p className="text-sm mb-2"><strong>Job Description Analysis:</strong></p>
            <p className="text-sm">Enter your job description below and we'll analyze it to optimize your resume.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Resume Optimization</h1>
        <p className="text-muted-foreground">
          AI-powered resume rewriting with coaching personas and hiring manager insights
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={handleOptimize}
          disabled={isOptimizing}
          size="lg"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Optimizing with AI Coaches...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Start AI Optimization
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Optimized Resume
              </CardTitle>
              <CardDescription>
                Your resume has been enhanced to better match the job description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                  {result.optimizedResume}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-center">Your Resume Scoring Position</h3>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Before</p>
                  <p className="text-3xl font-bold text-red-600">34%</p>
                  <p className="text-xs text-muted-foreground mt-1">Rank ~#150/200</p>
                  <p className="text-xs italic mt-2">Never gets reviewed</p>
                </div>
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">After</p>
                  <p className="text-3xl font-bold text-green-600">{result.analysis.overallScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Likely Top 20/200</p>
                  <p className="text-xs italic mt-2">You'll be reviewed</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Next Steps to Benchmark Status:</strong> This score gets you reviewed—now strengthen the other dimensions. 
                  To become the benchmark candidate for THIS specific role, you must also excel in: 
                  LinkedIn brand positioning, interview preparation, and leverage the market intelligence we provide.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Analysis Scores
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your resume's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(result.analysis).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <span className={`text-2xl font-bold ${getScoreColor(value)}`}>
                        {value}%
                      </span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {result.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Improvements Made</CardTitle>
                <CardDescription>
                  {result.improvements.length} enhancements applied to your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.missingKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Missing Keywords
                </CardTitle>
                <CardDescription>
                  Important keywords from the job description not found in your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Consider incorporating these keywords naturally into your experience descriptions
                  </AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-2 mt-4">
                  {result.missingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
                <CardDescription>
                  Expert advice to further improve your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
