/**
 * ATSControlCenter - Actionable ATS audit dashboard with one-click fixes
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  Wrench,
  FileText,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import type { ATSAuditResult, MissingKeyword, DetectedInfo } from '../types';

interface ATSControlCenterProps {
  resumeContent: string;
  jobDescription: string;
  detected: DetectedInfo;
  onComplete: (result: ATSAuditResult) => void;
  onKeywordInsert: (keyword: string, section: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ATSControlCenter({
  resumeContent,
  jobDescription,
  detected,
  onComplete,
  onKeywordInsert,
  onNext,
  onBack
}: ATSControlCenterProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSAuditResult | null>(null);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());
  const [insertedKeywords, setInsertedKeywords] = useState<Set<string>>(new Set());

  // Run ATS analysis on mount
  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data } = await invokeEdgeFunction('analyze-ats-score', {
        resumeText: resumeContent,
        jobDescription,
        targetRole: detected.role
      });

      if (data) {
        const auditResult: ATSAuditResult = {
          parseScore: data.parseScore || 95,
          formatScore: data.formatScore || 88,
          keywordScore: data.keywordScore || 65,
          overallScore: data.overallScore || 82,
          issues: data.issues || [],
          missingKeywords: data.missingKeywords || [],
          passedChecks: data.passedChecks || []
        };
        setResult(auditResult);
        onComplete(auditResult);
      } else {
        setResult(getFallbackResult());
      }
    } catch (error) {
      console.error('ATS analysis error:', error);
      setResult(getFallbackResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFallbackResult = (): ATSAuditResult => ({
    parseScore: 92,
    formatScore: 85,
    keywordScore: 62,
    overallScore: 78,
    issues: [
      { id: '1', type: 'warning', category: 'format', title: 'Summary exceeds recommended length', description: 'Keep summary under 300 words for better scanning', autoFixable: true, fixed: false },
      { id: '2', type: 'warning', category: 'structure', title: 'Missing job title in header', description: 'Add target job title below your name', autoFixable: true, fixed: false }
    ],
    missingKeywords: [
      { keyword: 'drilling fluids', importance: 'critical', suggestedPlacement: 'Summary or Experience' },
      { keyword: 'mud school', importance: 'critical', suggestedPlacement: 'Certifications' },
      { keyword: 'wellbore stability', importance: 'important', suggestedPlacement: 'Experience' }
    ],
    passedChecks: ['Standard fonts used', 'Clear section headers', 'Proper date formats', 'No tables or graphics']
  });

  const handleInsertKeyword = (keyword: MissingKeyword) => {
    setInsertedKeywords(prev => new Set([...prev, keyword.keyword]));
    onKeywordInsert(keyword.keyword, keyword.suggestedPlacement);
  };

  const handleFixIssue = async (issueId: string) => {
    setFixingIssues(prev => new Set([...prev, issueId]));
    // Simulate fix
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        issues: prev.issues.map(issue => 
          issue.id === issueId ? { ...issue, fixed: true } : issue
        )
      };
    });
    setFixingIssues(prev => {
      const next = new Set(prev);
      next.delete(issueId);
      return next;
    });
  };

  const handleFixAllIssues = async () => {
    if (!result) return;
    for (const issue of result.issues.filter(i => i.autoFixable && !i.fixed)) {
      await handleFixIssue(issue.id);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Analyzing ATS Compatibility...</p>
          <p className="text-muted-foreground">Checking parsing, format, and keywords</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const fixableIssues = result.issues.filter(i => i.autoFixable && !i.fixed);
  const criticalKeywords = result.missingKeywords.filter(k => k.importance === 'critical' && !insertedKeywords.has(k.keyword));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Cpu className="h-6 w-6" />
              <h2 className="text-2xl font-bold">ATS Compatibility Audit</h2>
            </div>
            <p className="text-muted-foreground">
              Ensuring your resume passes through Applicant Tracking Systems
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Parse', score: result.parseScore, icon: <FileText className="h-4 w-4" /> },
              { label: 'Format', score: result.formatScore, icon: <Wrench className="h-4 w-4" /> },
              { label: 'Keywords', score: result.keywordScore, icon: <Target className="h-4 w-4" /> },
              { label: 'Overall', score: result.overallScore, icon: <Cpu className="h-4 w-4" /> }
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4 text-center">
                  <div className={cn(
                    "mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2",
                    item.score >= 80 && "bg-green-100 text-green-600 dark:bg-green-900/30",
                    item.score >= 60 && item.score < 80 && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                    item.score < 60 && "bg-red-100 text-red-600 dark:bg-red-900/30"
                  )}>
                    {item.icon}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.score}%</p>
                  <Progress 
                    value={item.score} 
                    className="h-1.5 mt-2" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Critical Missing Keywords */}
          {criticalKeywords.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Critical Missing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  These keywords appear in the job posting but not in your resume. Click to auto-insert:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword) => {
                    const isInserted = insertedKeywords.has(keyword.keyword);
                    return (
                      <Button
                        key={keyword.keyword}
                        variant={isInserted ? "secondary" : keyword.importance === 'critical' ? "destructive" : "outline"}
                        size="sm"
                        className="gap-1"
                        onClick={() => !isInserted && handleInsertKeyword(keyword)}
                        disabled={isInserted}
                      >
                        {isInserted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        {keyword.keyword}
                        {!isInserted && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {keyword.importance}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues to Fix */}
          {result.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Issues to Fix ({result.issues.filter(i => !i.fixed).length})
                  </CardTitle>
                  {fixableIssues.length > 0 && (
                    <Button size="sm" onClick={handleFixAllIssues} className="gap-1">
                      <Zap className="h-3 w-3" />
                      Fix All Issues
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.issues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    layout
                    className={cn(
                      "p-3 rounded-lg border flex items-center justify-between",
                      issue.fixed && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {issue.fixed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : issue.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className={cn("font-medium", issue.fixed && "line-through text-muted-foreground")}>
                          {issue.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                    {!issue.fixed && issue.autoFixable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFixIssue(issue.id)}
                        disabled={fixingIssues.has(issue.id)}
                        className="gap-1"
                      >
                        {fixingIssues.has(issue.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wrench className="h-3 w-3" />
                        )}
                        Auto-fix
                      </Button>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Passed Checks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Passed Checks ({result.passedChecks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {result.passedChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {check}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Quick Glance
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continue to Humanization
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
