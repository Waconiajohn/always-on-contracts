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
import { JobConversation } from './JobConversation';
import { supabase } from '@/integrations/supabase/client';

interface JobAnalysis {
  professionalTitle: string;
  industry: string;
  standardizedQualifications: any;
  hiringManagerPerspective: any;
  atsKeywords: string[];
  compensationRange: any;
}

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
      console.error('Error loading Career Vault data:', error);
    } finally {
      setLoadingVault(false);
    }
  };

  const insertPowerPhrase = (phrase: string) => {
    setResumeText(prev => prev + '\n' + phrase);
    toast.success('Power phrase added to resume');
  };

  const handleAnalysisComplete = (_analysis: JobAnalysis) => {
    setStep('optimization');
  };

  const handleOptimize = async () => {
    if (!resumeText || !jobDescription) {
      toast.error('Please provide both resume text and job description');
      return;
    }

    setIsOptimizing(true);

    try {
      const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
        body: {
          resumeText,
          jobDescription,
          vaultData
        }
      });

      if (error) throw error;
      setResult(data);
      toast.success('Resume optimized with dual AI audit!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to optimize resume');
    } finally {
      setIsOptimizing(false);
    }
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
          <h1 className="text-3xl font-bold mb-2">AI Resume Rewriter</h1>
          <p className="text-muted-foreground">
            Our most powerful feature - transform your resume with AI coaching, hiring manager insights, and precision targeting
          </p>
        </div>

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

        <JobConversation 
          jobDescription={jobDescription}
          onAnalysisComplete={handleAnalysisComplete}
        />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analysis Scores
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
