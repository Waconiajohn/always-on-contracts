import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  SuggestMetricsSchema,
  validateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

interface AddMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onSuccess: () => void;
}

interface PowerPhrase {
  id: string;
  power_phrase: string;
  context: string;
  impact_metrics: any;
}

interface MetricSuggestion {
  type: string;
  value: string;
  example: string;
}

export const AddMetricsModal = ({ open, onOpenChange, vaultId, onSuccess }: AddMetricsModalProps) => {
  const [phrases, setPhrases] = useState<PowerPhrase[]>([]);
  const [selectedPhrase, setSelectedPhrase] = useState<PowerPhrase | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MetricSuggestion[]>([]);
  const [metrics, setMetrics] = useState({
    amount: '',
    percentage: '',
    teamSize: '',
    timeframe: '',
    roi: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPhrasesWithoutMetrics();
    }
  }, [open, vaultId]);

  const loadPhrasesWithoutMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', vaultId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      // Filter phrases without complete metrics
      const phrasesNeedingMetrics = (data || []).filter(p => {
        const m = p.impact_metrics as { amount?: number; percentage?: number; teamSize?: number; timeframe?: string; roi?: number } | null;
        return !m?.amount && !m?.percentage && !m?.teamSize && !m?.timeframe && !m?.roi;
      });

      setPhrases(phrasesNeedingMetrics.map(p => ({ ...p, context: '' })));
      if (phrasesNeedingMetrics.length > 0) {
        setSelectedPhrase({ ...phrasesNeedingMetrics[0], context: '' });
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load power phrases',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMetricSuggestions = async () => {
    if (!selectedPhrase) return;

    setGeneratingSuggestions(true);
    try {
      const validated = validateInput(SuggestMetricsSchema, {
        phrase: selectedPhrase.power_phrase,
        context: selectedPhrase.context
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'suggest-metrics',
        validated
      );

      if (error) return;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: MetricSuggestion) => {
    setMetrics(prev => ({
      ...prev,
      [suggestion.type]: suggestion.value
    }));
  };

  const handleSave = async () => {
    if (!selectedPhrase) return;

    setLoading(true);
    try {
      // Merge new metrics with existing ones
      const updatedMetrics = {
        ...(selectedPhrase.impact_metrics || {}),
        ...Object.fromEntries(
          Object.entries(metrics).filter(([_, v]) => v !== '')
        )
      };

      const { error } = await supabase
        .from('vault_power_phrases')
        .update({ impact_metrics: updatedMetrics })
        .eq('id', selectedPhrase.id);

      if (error) throw error;

      toast({
        title: 'Metrics Added!',
        description: 'Your quantification score will improve on next analysis'
      });

      // Move to next phrase or close
      const currentIndex = phrases.findIndex(p => p.id === selectedPhrase.id);
      if (currentIndex < phrases.length - 1) {
        setSelectedPhrase(phrases[currentIndex + 1]);
        setMetrics({ amount: '', percentage: '', teamSize: '', timeframe: '', roi: '' });
        setSuggestions([]);
      } else {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to save metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const currentIndex = phrases.findIndex(p => p.id === selectedPhrase?.id);
    if (currentIndex < phrases.length - 1) {
      setSelectedPhrase(phrases[currentIndex + 1]);
      setMetrics({ amount: '', percentage: '', teamSize: '', timeframe: '', roi: '' });
      setSuggestions([]);
    } else {
      onSuccess();
      onOpenChange(false);
    }
  };

  if (loading && phrases.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading phrases...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (phrases.length === 0 && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>No Work Experience Found</DialogTitle>
            <DialogDescription>
              We couldn't find any quantified achievements from your resume yet.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <TrendingUp className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This could mean:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                <li>• The resume extraction didn't capture work experience properly</li>
                <li>• Your resume needs to be re-uploaded or re-analyzed</li>
                <li>• Work experience bullets need to be added manually</li>
              </ul>
            </div>
            <div className="pt-4">
              <p className="text-sm font-medium text-slate-900 mb-2">What to do:</p>
              <p className="text-sm text-muted-foreground">
                Try re-uploading your resume or use the "Re-analyze" option to extract work experience again.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={() => {
              onOpenChange(false);
              window.location.href = '/career-vault-onboarding';
            }} className="flex-1">
              Re-upload Resume
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Add Quantified Metrics to Power Phrases
          </DialogTitle>
          <DialogDescription>
            Add numbers to make your achievements more impressive. Showing {phrases.findIndex(p => p.id === selectedPhrase?.id) + 1} of {phrases.length} phrases.
          </DialogDescription>
        </DialogHeader>

        {selectedPhrase && (
          <div className="space-y-6">
            {/* Current Phrase */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">CURRENT PHRASE</Label>
                  <p className="text-lg font-semibold">{selectedPhrase.power_phrase}</p>
                  {selectedPhrase.context && (
                    <p className="text-sm text-muted-foreground">{selectedPhrase.context}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {suggestions.length === 0 && !generatingSuggestions && (
              <div className="text-center">
                <Button
                  onClick={generateMetricSuggestions}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Get AI Metric Suggestions
                </Button>
              </div>
            )}

            {generatingSuggestions && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing phrase for metric opportunities...</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">AI Suggestions (click to apply)</Label>
                <div className="grid gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <Card
                      key={idx}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-1 text-xs">
                            {suggestion.type}
                          </Badge>
                          <p className="text-sm">{suggestion.example}</p>
                        </div>
                        <Button size="sm" variant="ghost">Apply</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Metric Entry */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Add Metrics Manually</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs">Dollar Amount</Label>
                  <Input
                    id="amount"
                    placeholder="$2.3M, $500K, $10B"
                    value={metrics.amount}
                    onChange={(e) => setMetrics(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage" className="text-xs">Percentage</Label>
                  <Input
                    id="percentage"
                    placeholder="45%, 90%, 200%"
                    value={metrics.percentage}
                    onChange={(e) => setMetrics(prev => ({ ...prev, percentage: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="text-xs">Team Size / Scope</Label>
                  <Input
                    id="teamSize"
                    placeholder="15 people, 3 teams, 200 users"
                    value={metrics.teamSize}
                    onChange={(e) => setMetrics(prev => ({ ...prev, teamSize: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe" className="text-xs">Timeframe</Label>
                  <Input
                    id="timeframe"
                    placeholder="6 months, 2 years, Q1-Q3"
                    value={metrics.timeframe}
                    onChange={(e) => setMetrics(prev => ({ ...prev, timeframe: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="roi" className="text-xs">ROI / Impact</Label>
                  <Input
                    id="roi"
                    placeholder="300% ROI, 10x efficiency, reduced costs by 40%"
                    value={metrics.roi}
                    onChange={(e) => setMetrics(prev => ({ ...prev, roi: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {Object.values(metrics).some(v => v !== '') && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <Label className="text-xs font-semibold text-green-900 dark:text-green-100">PREVIEW WITH METRICS</Label>
                  <p className="text-sm mt-2 font-medium">
                    {selectedPhrase.power_phrase}
                    {metrics.amount && ` (${metrics.amount})`}
                    {metrics.percentage && ` - ${metrics.percentage}`}
                    {metrics.teamSize && ` across ${metrics.teamSize}`}
                    {metrics.timeframe && ` in ${metrics.timeframe}`}
                    {metrics.roi && ` achieving ${metrics.roi}`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleSkip}>
                Skip This Phrase
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || Object.values(metrics).every(v => v === '')}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save & Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
