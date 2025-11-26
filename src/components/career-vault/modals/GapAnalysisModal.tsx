import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GapAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  vaultId: string;
}

export const GapAnalysisModal = ({ open, onClose, vaultId }: GapAnalysisModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (open && vaultId) {
      loadGapAnalysis();
    }
  }, [open, vaultId]);

  const loadGapAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_gap_analysis')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Error loading gap analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGapAnalysis = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-gap-analysis', {
        body: { vaultId }
      });

      if (error) throw error;

      toast({
        title: 'Gap Analysis Generated',
        description: 'Your profile has been analyzed against market benchmarks'
      });

      await loadGapAnalysis();
    } catch (error: any) {
      console.error('Error generating gap analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate gap analysis',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gap Analysis</DialogTitle>
            <DialogDescription>
              Analyze your profile against market benchmarks and identify areas for improvement
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center space-y-4">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No gap analysis found for this vault</p>
            <Button onClick={generateGapAnalysis} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Generate Gap Analysis
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const gapData = analysis.gaps || [];
  const strengths = gapData.filter((g: any) => g.status === 'strength');
  const gaps = gapData.filter((g: any) => g.status === 'gap');
  const opportunities = gapData.filter((g: any) => g.status === 'opportunity');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Gap Analysis Results</DialogTitle>
              <DialogDescription>
                Analysis of your profile vs. market benchmarks
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">{strengths.length}</div>
                <div className="text-sm text-muted-foreground">Strengths</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-orange-600">{gaps.length}</div>
                <div className="text-sm text-muted-foreground">Gaps to Fill</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">{opportunities.length}</div>
                <div className="text-sm text-muted-foreground">Opportunities</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Your Strengths
            </h3>
            <div className="space-y-3">
              {strengths.map((item: any, idx: number) => (
                <Card key={idx} className="border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.category}</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {item.vault_score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.ai_message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Areas to Strengthen
            </h3>
            <div className="space-y-3">
              {gaps.map((item: any, idx: number) => (
                <Card key={idx} className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.category}</CardTitle>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {item.vault_score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{item.ai_message}</p>
                    {item.recommendations && item.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1">Recommendations:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {item.recommendations.map((rec: string, i: number) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Growth Opportunities
            </h3>
            <div className="space-y-3">
              {opportunities.map((item: any, idx: number) => (
                <Card key={idx} className="border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.category}</CardTitle>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {item.vault_score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.ai_message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => generateGapAnalysis()} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Regenerate Analysis
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
