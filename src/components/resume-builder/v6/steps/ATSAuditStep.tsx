/**
 * ATSAuditStep - Check ATS compatibility and fix issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Cpu, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight,
  Loader2, Wrench, Hash
} from 'lucide-react';
import type { BenchmarkBuilderState, ATSAuditResult, ATSIssue } from '../types';

interface ATSAuditStepProps {
  state: BenchmarkBuilderState;
  onComplete: (result: ATSAuditResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ATSAuditStep({ state, onComplete, onNext, onBack }: ATSAuditStepProps) {
  const { toast } = useToast();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ATSAuditResult | null>(state.atsAuditResult);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auditResult) runAudit();
  }, []);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // In production, call edge function. For now, simulate.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ATSAuditResult = {
        overallScore: 78,
        parseTestPassed: true,
        formatScore: 85,
        structureScore: 80,
        keywordCoverage: 70,
        issues: [
          { id: '1', type: 'warning', category: 'keywords', title: 'Missing Critical Keywords', description: 'Resume missing 4 critical job keywords', fix: 'Add: data-driven, stakeholder management, P&L, transformation', autoFixable: true, fixed: false },
          { id: '2', type: 'info', category: 'format', title: 'Consider Adding Section Headers', description: 'Some ATS prefer ALL CAPS section headers', autoFixable: true, fixed: false },
          { id: '3', type: 'warning', category: 'structure', title: 'Skills Section Position', description: 'Moving Skills higher may improve keyword detection', autoFixable: true, fixed: false },
        ],
        keywords: [
          { keyword: 'project management', importance: 'critical', present: true, count: 3 },
          { keyword: 'leadership', importance: 'critical', present: true, count: 2 },
          { keyword: 'data-driven', importance: 'critical', present: false, count: 0, suggestedPlacement: 'Summary section' },
          { keyword: 'stakeholder management', importance: 'important', present: false, count: 0, suggestedPlacement: 'Experience section' },
          { keyword: 'strategic planning', importance: 'important', present: true, count: 1 },
        ]
      };
      
      setAuditResult(mockResult);
      onComplete(mockResult);
    } catch (error) {
      toast({ title: 'Audit failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsAuditing(false);
    }
  };

  const fixIssue = async (issue: ATSIssue) => {
    setFixingIssues(prev => new Set([...prev, issue.id]));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (auditResult) {
      const updated = {
        ...auditResult,
        issues: auditResult.issues.map(i => i.id === issue.id ? { ...i, fixed: true } : i),
        overallScore: auditResult.overallScore + 5
      };
      setAuditResult(updated);
      onComplete(updated);
    }
    
    setFixingIssues(prev => { const n = new Set(prev); n.delete(issue.id); return n; });
    toast({ title: 'Issue fixed!' });
  };

  const fixAllIssues = async () => {
    if (!auditResult) return;
    for (const issue of auditResult.issues.filter(i => i.autoFixable && !i.fixed)) {
      await fixIssue(issue);
    }
  };

  if (isAuditing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">Running ATS Audit...</h2>
          <p className="text-muted-foreground">Checking parse compatibility, keywords, and format</p>
        </div>
      </div>
    );
  }

  if (!auditResult) return null;

  const unfixedIssues = auditResult.issues.filter(i => !i.fixed);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">ATS Compatibility Audit</h1>
          <p className="text-muted-foreground">Ensuring your resume parses correctly through applicant tracking systems</p>
        </div>

        {/* Overall Score */}
        <Card className={auditResult.overallScore >= 85 ? "border-green-500/50 bg-green-500/5" : "border-amber-500/50 bg-amber-500/5"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-background">
                  <Cpu className={`h-8 w-8 ${auditResult.overallScore >= 85 ? 'text-green-500' : 'text-amber-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ATS Score</p>
                  <p className="text-4xl font-bold">{auditResult.overallScore}%</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={auditResult.parseTestPassed ? "default" : "destructive"} className="gap-1">
                  {auditResult.parseTestPassed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Parse Test: {auditResult.parseTestPassed ? 'PASSED' : 'FAILED'}
                </Badge>
                <p className="text-sm text-muted-foreground">{unfixedIssues.length} issues remaining</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-semibold">{auditResult.formatScore}%</p>
                <p className="text-xs text-muted-foreground">Format</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-semibold">{auditResult.structureScore}%</p>
                <p className="text-xs text-muted-foreground">Structure</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-semibold">{auditResult.keywordCoverage}%</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues */}
        {unfixedIssues.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Issues Found</CardTitle>
                <CardDescription>{unfixedIssues.length} issues to fix</CardDescription>
              </div>
              <Button onClick={fixAllIssues} className="gap-2"><Wrench className="h-4 w-4" />Auto-Fix All</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditResult.issues.map(issue => (
                <div key={issue.id} className={`p-4 rounded-lg border ${issue.fixed ? 'bg-green-500/5 border-green-500/30' : 'bg-muted/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {issue.fixed ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />}
                      <div>
                        <p className="font-medium text-sm">{issue.title}</p>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        {issue.fix && !issue.fixed && <p className="text-xs text-primary mt-1">Fix: {issue.fix}</p>}
                      </div>
                    </div>
                    {!issue.fixed && issue.autoFixable && (
                      <Button size="sm" variant="outline" onClick={() => fixIssue(issue)} disabled={fixingIssues.has(issue.id)} className="gap-1">
                        {fixingIssues.has(issue.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" />Keyword Analysis</CardTitle>
            <CardDescription>Critical keywords from the job description</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditResult.keywords.map(kw => (
                <div key={kw.keyword} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    {kw.present ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium">{kw.keyword}</span>
                    <Badge variant="outline" className="text-xs">{kw.importance}</Badge>
                  </div>
                  <div className="text-right">
                    {kw.present ? (
                      <Badge variant="secondary">Found {kw.count}x</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Add to: {kw.suggestedPlacement}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Editor</Button>
          <Button onClick={onNext} className="gap-2">Continue to Final Polish<ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
