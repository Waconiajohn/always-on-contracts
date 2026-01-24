import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { KeywordChipGroup, GapCard } from '@/components/resume-builder/KeywordChip';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Check, X, AlertCircle, Sparkles, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { RBKeywordDecision, KeywordDecision } from '@/types/resume-builder';

interface GapAnalysis {
  category: string;
  requirement: string;
  severity: 'critical' | 'important' | 'nice_to_have';
  requirement_id: string;
}

export default function FixPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState<RBKeywordDecision[]>([]);
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [_loading, setLoading] = useState(true);

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

      // Compute gaps (requirements not matched by evidence)
      // In a full implementation, this would come from gap analysis edge function
      const gapsFromReqs = (reqData || [])
        .filter((r: any) => !r.is_matched)
        .map((r: any) => ({
          category: r.category || 'General',
          requirement: r.requirement_text,
          severity: r.priority > 8 ? 'critical' as const : r.priority > 5 ? 'important' as const : 'nice_to_have' as const,
          requirement_id: r.id,
        }));
      
      setGaps(gapsFromReqs);
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

        {/* Tabs for Keywords vs Gaps */}
        <Tabs defaultValue="keywords" className="space-y-4">
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
        </Tabs>
      </div>
    </ResumeBuilderShell>
  );
}
