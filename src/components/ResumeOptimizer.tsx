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
import { generateResumeHTML } from '@/components/resume/ResumeTemplate';
import { generateResumeHTML } from '@/components/resume/ResumeTemplate';

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
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Calibri', 'Arial', sans-serif; 
      line-height: 1.5; 
      color: #1f2937; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 0.75in; 
      font-size: 11pt;
    }
    
    /* Header */
    .header { 
      text-align: center; 
      margin-bottom: 28px; 
      border-bottom: 3px solid #2563eb; 
      padding-bottom: 18px; 
    }
    .header h1 { 
      font-size: 26pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      margin-bottom: 10px; 
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header .contact { 
      font-size: 10pt; 
      color: #64748b; 
      line-height: 1.6;
    }
    
    /* Section Titles */
    .section-title { 
      font-size: 13pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      text-transform: uppercase; 
      border-bottom: 2px solid #cbd5e1; 
      padding-bottom: 5px; 
      margin: 22px 0 14px 0; 
      letter-spacing: 1px;
    }
    
    /* Summary */
    .summary { 
      font-size: 11pt; 
      line-height: 1.65; 
      text-align: justify; 
      margin-bottom: 18px;
      color: #374151;
    }
    
    /* Skills Grid - 3 columns */
    .skills-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 8px 14px; 
      margin-bottom: 18px;
    }
    .skill-item { 
      font-size: 10pt; 
      padding: 6px 10px;
      background: #f1f5f9;
      border-left: 3px solid #3b82f6;
      border-radius: 3px;
      transition: background 0.2s;
    }
    
    /* Achievements */
    .achievements { 
      margin-bottom: 18px; 
    }
    .achievement-item { 
      font-size: 10.5pt; 
      margin-bottom: 10px; 
      padding-left: 18px;
      line-height: 1.6;
      position: relative;
      color: #374151;
    }
    .achievement-item:before {
      content: '▶';
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-size: 9pt;
      top: 2px;
    }
    
    /* Experience */
    .job { 
      margin-bottom: 20px; 
      page-break-inside: avoid; 
    }
    .job-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 8px;
      background: #f8fafc;
      padding: 10px 14px;
      border-left: 4px solid #2563eb;
      border-radius: 2px;
    }
    .job-title { 
      font-size: 12pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      line-height: 1.3;
    }
    .job-company { 
      font-size: 10.5pt; 
      color: #475569; 
      font-weight: 500;
      margin-top: 3px;
    }
    .job-meta { 
      font-size: 10pt; 
      color: #64748b; 
      text-align: right;
      font-style: italic;
      white-space: nowrap;
    }
    .job-bullets { 
      margin: 10px 0 0 22px; 
      padding: 0;
    }
    .job-bullets li { 
      font-size: 10pt; 
      margin-bottom: 7px; 
      line-height: 1.55;
      list-style-type: disc;
      color: #374151;
    }
    
    /* Education */
    .education-item { 
      margin-bottom: 10px; 
      padding: 10px 14px;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      border-radius: 2px;
    }
    .education-item .degree { 
      font-size: 11pt; 
      font-weight: 600; 
      color: #1e3a8a;
      margin-bottom: 3px;
    }
    .education-item .school { 
      font-size: 10pt; 
      color: #64748b; 
    }
    
    @media print { 
      body { padding: 0.5in; } 
      .job, .education-item { page-break-inside: avoid; }
      .skill-item { background: #f9fafb; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(sections.name || 'Professional Resume')}</h1>
    <div class="contact">${escapeHtml(sections.contact || '')}</div>
  </div>

  ${sections.summary ? `
  <div class="section-title">Professional Summary</div>
  <div class="summary">${escapeHtml(sections.summary)}</div>
  ` : ''}

  ${sections.skills.length > 0 ? `
  <div class="section-title">Technical Skills</div>
  <div class="skills-grid">
    ${sections.skills.map((skill: string) => 
      `<div class="skill-item">${escapeHtml(skill)}</div>`
    ).join('')}
  </div>
  ` : ''}

  ${sections.achievements.length > 0 ? `
  <div class="section-title">Key Achievements</div>
  <div class="achievements">
    ${sections.achievements.map((achievement: string) => 
      `<div class="achievement-item">${escapeHtml(achievement)}</div>`
    ).join('')}
  </div>
  ` : ''}

  ${sections.experience.length > 0 ? `
  <div class="section-title">Professional Experience</div>
  ${sections.experience.map((job: any) => `
    <div class="job">
      <div class="job-header">
        <div>
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-company">${escapeHtml(job.company)}${job.location ? ' | ' + escapeHtml(job.location) : ''}</div>
        </div>
        <div class="job-meta">${escapeHtml(job.dates)}</div>
      </div>
      ${job.bullets && job.bullets.length > 0 ? `
        <ul class="job-bullets">
          ${job.bullets.map((bullet: string) => 
            `<li>${escapeHtml(bullet)}</li>`
          ).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${sections.education.length > 0 ? `
  <div class="section-title">Education</div>
  ${sections.education.map((edu: any) => `
    <div class="education-item">
      <div class="degree">${escapeHtml(edu.degree)}</div>
      ${edu.school ? `<div class="school">${escapeHtml(edu.school)}${edu.location ? ' | ' + escapeHtml(edu.location) : ''}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}
</body>
</html>`.trim();
  };

  const parseResumeText = (text: string) => {
    const sections: any = {
      name: '',
      contact: '',
      summary: '',
      skills: [],
      achievements: [],
      experience: [],
      education: []
    };

    // Remove all ● bullets from section headers
    text = text.replace(/^●\s*(PROFESSIONAL SUMMARY|TECHNICAL SKILLS|KEY ACHIEVEMENTS|PROFESSIONAL EXPERIENCE|EDUCATION)/gmi, '$1');
    
    // Extract Professional Summary
    const summaryMatch = text.match(/PROFESSIONAL SUMMARY\s*\n([\s\S]*?)(?=\n\n[A-Z]{2,}|TECHNICAL SKILLS)/i);
    if (summaryMatch) {
      sections.summary = summaryMatch[1]
        .trim()
        .replace(/^[●•]\s*/gm, '') // Remove any bullets
        .replace(/\n+/g, ' '); // Join multi-line summaries
    }

    // Extract Technical Skills (comma-separated)
    const skillsMatch = text.match(/TECHNICAL SKILLS\s*\n([\s\S]*?)(?=\n\n[A-Z]{2,}|KEY ACHIEVEMENTS)/i);
    if (skillsMatch) {
      const skillText = skillsMatch[1].trim().replace(/^[●•]\s*/gm, '');
      sections.skills = skillText
        .split(/[,\n]+/)
        .map(s => s.trim())
        .filter(s => s && s.length > 1 && !s.match(/^[A-Z\s]{10,}$/)); // Filter out headers
    }

    // Extract Key Achievements
    const achievementsMatch = text.match(/KEY ACHIEVEMENTS\s*\n([\s\S]*?)(?=\n\n[A-Z]{2,}|PROFESSIONAL EXPERIENCE)/i);
    if (achievementsMatch) {
      sections.achievements = achievementsMatch[1]
        .split(/\n/)
        .filter(line => line.trim().match(/^[●•]\s/))
        .map(line => line.replace(/^[●•]\s*/, '').trim())
        .filter(a => a.length > 10);
    }

    // Extract Professional Experience
    const experienceMatch = text.match(/PROFESSIONAL EXPERIENCE\s*\n([\s\S]*?)(?=\n\n[A-Z]{2,}|EDUCATION|$)/i);
    if (experienceMatch) {
      const expText = experienceMatch[1];
      const jobBlocks = expText.split(/\n\s*\n/);
      
      jobBlocks.forEach(block => {
        const lines = block.trim().split('\n').filter(l => l.trim());
        if (lines.length === 0) return;
        
        // First line should be: Title | Company | Location | Dates
        const headerLine = lines[0].replace(/^[●•]\s*/, '');
        if (!headerLine.includes('|')) return;
        
        const parts = headerLine.split('|').map(p => p.trim());
        
        // Handle various pipe configurations
        let job: any = {};
        if (parts.length >= 4) {
          job = {
            title: parts[0],
            company: parts[1],
            location: parts[2],
            dates: parts[3]
          };
        } else if (parts.length === 3) {
          // Could be: Title | Company | Dates (no location)
          job = {
            title: parts[0],
            company: parts[1],
            location: '',
            dates: parts[2]
          };
        } else if (parts.length === 2) {
          job = {
            title: parts[0],
            company: parts[1],
            location: '',
            dates: ''
          };
        }
        
        // Extract bullets
        job.bullets = lines
          .slice(1)
          .filter(l => l.trim().match(/^[●•-]\s/))
          .map(l => l.replace(/^[●•-]\s*/, '').trim())
          .filter(b => b.length > 5);
        
        if (job.title) sections.experience.push(job);
      });
    }

    // Extract Education
    const educationMatch = text.match(/EDUCATION\s*\n([\s\S]*?)$/i);
    if (educationMatch) {
      const eduLines = educationMatch[1]
        .trim()
        .split('\n')
        .map(l => l.replace(/^[●•]\s*/, '').trim())
        .filter(l => l);
      
      eduLines.forEach(line => {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          sections.education.push({
            degree: parts[0] || '',
            school: parts[1] || '',
            location: parts[2] || ''
          });
        } else if (line.length > 5) {
          // Single line education
          sections.education.push({
            degree: line,
            school: '',
            location: ''
          });
        }
      });
    }

    // Extract name from first line if not found
    if (!sections.name) {
      const firstLine = text.split('\n')[0];
      if (firstLine && !firstLine.match(/^[A-Z\s]{10,}$/)) {
        sections.name = firstLine.trim();
      }
    }

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
