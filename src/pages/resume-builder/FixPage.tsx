import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { KeywordChipGroup, GapCard } from '@/components/resume-builder/KeywordChip';
import { QuestionCaptureModal } from '@/components/resume-builder/QuestionCaptureModal';
import { AddBulletForm } from '@/components/resume-builder/AddBulletForm';
import { ATSOptimizationCard } from '@/components/resume-builder/ATSOptimizationCard';
import { JDComparisonView } from '@/components/resume-builder/JDComparisonView';
import { InterviewPractice } from '@/components/resume-builder/InterviewPractice';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Check, X, AlertCircle, Sparkles, Target, Zap, HelpCircle, Clock, ChevronDown, ChevronUp, Cpu, SplitSquareVertical, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { RBKeywordDecision, KeywordDecision } from '@/types/resume-builder';

// 15-year experience rule utilities
const EXPERIENCE_CUTOFF_YEARS = 15;

interface OldExperience {
  title: string;
  company: string;
  startYear: number;
  yearsAgo: number;
}

function parseYearFromDate(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  // Try to extract a 4-digit year from various formats
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

function findOldExperiences(experience: any[]): OldExperience[] {
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - EXPERIENCE_CUTOFF_YEARS;
  const oldJobs: OldExperience[] = [];

  for (const exp of experience) {
    const startYear = parseYearFromDate(exp.start_date || exp.startDate || exp.dates);
    if (startYear && startYear < cutoffYear) {
      oldJobs.push({
        title: exp.title || exp.position || 'Position',
        company: exp.company || exp.organization || 'Company',
        startYear,
        yearsAgo: currentYear - startYear,
      });
    }
  }

  return oldJobs.sort((a, b) => a.startYear - b.startYear);
}

interface GapAnalysis {
  category: string;
  requirement: string;
  severity: 'critical' | 'important' | 'nice_to_have';
  requirement_id: string;
}

interface ExperiencePosition {
  title: string;
  company: string;
  index: number;
}

export default function FixPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'keywords';
  const [keywords, setKeywords] = useState<RBKeywordDecision[]>([]);
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [positions, setPositions] = useState<ExperiencePosition[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [oldExperiences, setOldExperiences] = useState<OldExperience[]>([]);
  const [showOldExpDetails, setShowOldExpDetails] = useState(false);
  const [jobUrl, setJobUrl] = useState<string | undefined>();
  const [jobText, setJobText] = useState<string | undefined>();
  const [resumeSections, setResumeSections] = useState<any>(null);
  const [jdRequirements, setJdRequirements] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    try {
      // Load keywords
      const { data: kwData } = await supabase
        .from('rb_keyword_decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('keyword', { ascending: true });

      setKeywords((kwData as unknown as RBKeywordDecision[]) || []);

      // Load requirements
      const { data: reqData } = await supabase
        .from('rb_jd_requirements')
        .select('*')
        .eq('project_id', projectId)
        .order('priority', { ascending: false });

      // Store requirements for comparison view
      setJdRequirements(reqData || []);

      // Compute gaps (requirements not matched by evidence)
      const gapsFromReqs = (reqData || [])
        .filter((r: any) => !r.is_matched)
        .map((r: any) => ({
          category: r.category || 'General',
          requirement: r.requirement_text,
          severity: r.priority > 8 ? 'critical' as const : r.priority > 5 ? 'important' as const : 'nice_to_have' as const,
          requirement_id: r.id,
        }));

      setGaps(gapsFromReqs);

      // Load documents (both resume and JD)
      const { data: docsData } = await supabase
        .from('rb_documents')
        .select('*')
        .eq('project_id', projectId);

      const resumeDoc = docsData?.find((d: any) => d.doc_type === 'resume');
      const jdDoc = docsData?.find((d: any) => d.doc_type === 'job_description');

      if (resumeDoc?.parsed_json) {
        const parsed = resumeDoc.parsed_json as any;
        setResumeSections(parsed);

        if (parsed.experience && Array.isArray(parsed.experience)) {
          setPositions(parsed.experience.map((exp: any, i: number) => ({
            title: exp.title || 'Position',
            company: exp.company || 'Company',
            index: i,
          })));

          // Check for 15-year rule violations
          const oldJobs = findOldExperiences(parsed.experience);
          setOldExperiences(oldJobs);
        }
      }

      // Load JD info for ATS detection
      if (jdDoc) {
        setJobUrl(jdDoc.source_url || undefined);
        setJobText(jdDoc.raw_text || undefined);
      }

      // Load project for additional job URL
      const { data: projectData } = await supabase
        .from('rb_projects')
        .select('job_posting_url')
        .eq('id', projectId)
        .single();

      if (projectData?.job_posting_url) {
        setJobUrl(projectData.job_posting_url);
      }

      // Check if there are cached questions from gap analysis
      // For now, generate sample questions based on unmet gaps
      const criticalGaps = gapsFromReqs.filter((g: GapAnalysis) => g.severity === 'critical');
      if (criticalGaps.length > 0) {
        const generatedQuestions = criticalGaps.slice(0, 3).map((g: GapAnalysis) =>
          `Do you have experience with ${g.requirement}? If so, describe a specific example.`
        );
        setQuestions(generatedQuestions);
      }
    } catch (err) {
      console.error('Failed to load fix data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleKeywordDecision = async (keywordId: string, decision: KeywordDecision) => {
    try {
      const { error } = await supabase
        .from('rb_keyword_decisions')
        .update({ decision, decided_at: new Date().toISOString() })
        .eq('id', keywordId);

      if (error) throw error;

      setKeywords(prev => prev.map(kw => 
        kw.id === keywordId ? { ...kw, decision, decided_at: new Date().toISOString() } : kw
      ));
      
      toast.success(`Keyword ${decision === 'add' ? 'approved' : 'suppressed'}`);
    } catch (err) {
      console.error('Failed to update keyword:', err);
      toast.error('Failed to update keyword');
    }
  };

  const handleAddBullet = (gap: GapAnalysis) => {
    // Navigate to experience page with context about the gap
    navigate(`/resume-builder/${projectId}/studio/experience`, {
      state: { addBulletFor: gap.requirement }
    });
  };

  // Categorize keywords
  const pendingKeywords = keywords.filter(k => !k.decision || (k.decision as string) === 'pending');
  const approvedKeywords = keywords.filter(k => k.decision === 'add');
  const suppressedKeywords = keywords.filter(k => k.decision === 'not_true' || k.decision === 'ignore');

  // Categorize gaps
  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  const importantGaps = gaps.filter(g => g.severity === 'important');
  const niceToHaveGaps = gaps.filter(g => g.severity === 'nice_to_have');

  const allKeywordsDecided = pendingKeywords.length === 0;
  const criticalGapsCount = criticalGaps.length;

  return (
    <ResumeBuilderShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fix Issues</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review keywords and address gaps before rewriting
            </p>
          </div>
          <Button 
            onClick={() => navigate(`/resume-builder/${projectId}/studio/summary`)}
            disabled={!allKeywordsDecided && criticalGapsCount > 0}
          >
            Continue to Rewrite
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{keywords.length}</p>
                <p className="text-xs text-muted-foreground">Keywords Found</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{approvedKeywords.length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingKeywords.length}</p>
                <p className="text-xs text-muted-foreground">Need Review</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{gaps.length}</p>
                <p className="text-xs text-muted-foreground">Gaps to Address</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 15-Year Rule Warning */}
        {oldExperiences.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
                        15-Year Experience Rule
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        {oldExperiences.length} position{oldExperiences.length > 1 ? 's' : ''} may be too old to include
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-700 hover:text-amber-800"
                      onClick={() => setShowOldExpDetails(!showOldExpDetails)}
                    >
                      {showOldExpDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {showOldExpDetails && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Most recruiters recommend focusing on the last 15 years of experience. Consider removing or condensing older positions:
                      </p>
                      <div className="space-y-1.5">
                        {oldExperiences.map((exp, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-amber-100/50 dark:bg-amber-900/20 rounded px-2 py-1.5"
                          >
                            <span className="font-medium text-amber-800 dark:text-amber-200">
                              {exp.title} at {exp.company}
                            </span>
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              {exp.yearsAgo} years ago
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic pt-1">
                        Tip: You can consolidate old positions into a single "Earlier Experience" section or remove them entirely.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Keywords, Gaps, Comparison, and ATS */}
        <Tabs defaultValue={initialTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="keywords" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Keywords
              {pendingKeywords.length > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingKeywords.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="gaps" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Gaps
              {criticalGapsCount > 0 && (
                <Badge variant="destructive" className="text-xs">{criticalGapsCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <SplitSquareVertical className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="ats" className="gap-2">
              <Cpu className="h-4 w-4" />
              ATS Tips
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Interview Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-4">
            {/* Pending Keywords - Action Required */}
            <KeywordChipGroup
              title="Pending Review"
              keywords={pendingKeywords}
              onDecision={handleKeywordDecision}
              icon={<AlertCircle className="h-4 w-4 text-accent-foreground" />}
              emptyMessage="All keywords reviewed!"
            />

            {/* Approved Keywords */}
            <KeywordChipGroup
              title="Approved for Resume"
              keywords={approvedKeywords}
              onDecision={handleKeywordDecision}
              icon={<Check className="h-4 w-4 text-primary" />}
              emptyMessage="No keywords approved yet"
            />

            {/* Suppressed Keywords */}
            <KeywordChipGroup
              title="Suppressed (Not Applicable)"
              keywords={suppressedKeywords}
              onDecision={handleKeywordDecision}
              icon={<X className="h-4 w-4 text-destructive" />}
              emptyMessage="No keywords suppressed"
            />
          </TabsContent>

          <TabsContent value="gaps" className="space-y-4">
            {/* Questions Banner */}
            {questions.length > 0 && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">We have questions for you</p>
                      <p className="text-xs text-muted-foreground">
                        Help us fill gaps by answering {questions.length} question{questions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowQuestions(true)}>
                    Answer Questions
                    <Badge className="ml-2" variant="secondary">{questions.length}</Badge>
                  </Button>
                </div>
              </Card>
            )}

            {/* Add Bullet Form */}
            {projectId && (
              <AddBulletForm
                projectId={projectId}
                positions={positions}
                onBulletAdded={loadData}
              />
            )}

            {gaps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Check className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-lg mb-2">No Gaps Found!</CardTitle>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Your resume appears to cover all the key requirements from the job description.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Critical Gaps */}
                {criticalGaps.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Critical Gaps ({criticalGaps.length})
                    </h3>
                    {criticalGaps.map((gap, i) => (
                      <GapCard
                        key={i}
                        category={gap.category}
                        requirement={gap.requirement}
                        severity={gap.severity}
                        onAddBullet={() => handleAddBullet(gap)}
                      />
                    ))}
                  </div>
                )}

                {/* Important Gaps */}
                {importantGaps.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-accent-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Important Gaps ({importantGaps.length})
                    </h3>
                    {importantGaps.map((gap, i) => (
                      <GapCard
                        key={i}
                        category={gap.category}
                        requirement={gap.requirement}
                        severity={gap.severity}
                        onAddBullet={() => handleAddBullet(gap)}
                      />
                    ))}
                  </div>
                )}

                {/* Nice to Have */}
                {niceToHaveGaps.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Nice to Have ({niceToHaveGaps.length})
                    </h3>
                    {niceToHaveGaps.map((gap, i) => (
                      <GapCard
                        key={i}
                        category={gap.category}
                        requirement={gap.requirement}
                        severity={gap.severity}
                        onAddBullet={() => handleAddBullet(gap)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <JDComparisonView
              resumeSections={resumeSections}
              requirements={jdRequirements}
              keywords={keywords}
            />
          </TabsContent>

          <TabsContent value="ats" className="space-y-4">
            <ATSOptimizationCard
              jobUrl={jobUrl}
              jobText={jobText}
            />
          </TabsContent>

          <TabsContent value="interview" className="space-y-4">
            {projectId && <InterviewPractice projectId={projectId} />}
          </TabsContent>
        </Tabs>

        {/* Question Capture Modal */}
        {projectId && (
          <QuestionCaptureModal
            open={showQuestions}
            onOpenChange={setShowQuestions}
            projectId={projectId}
            questions={questions}
            onComplete={() => {
              loadData();
              setQuestions([]);
            }}
          />
        )}
      </div>
    </ResumeBuilderShell>
  );
}
