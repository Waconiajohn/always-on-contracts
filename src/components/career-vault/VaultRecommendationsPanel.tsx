import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Recommendation {
  vaultCategory: string;
  vaultItemId: string;
  currentVersion: any;
  effectivenessScore: number;
  timesUsed: number;
  timesRemoved: number;
  diagnosis: {
    mainIssue: string;
    secondaryIssues: string[];
    likelyReason: string;
  };
  improvedVersion: string;
  keyImprovements: string[];
  expectedImpact: string;
  recommendedAction: 'replace' | 'enhance' | 'remove';
}

interface VaultRecommendationsPanelProps {
  vaultId: string;
  onItemUpdated?: () => void;
}

export const VaultRecommendationsPanel = ({
  vaultId,
  onItemUpdated
}: VaultRecommendationsPanelProps) => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, [vaultId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vault-recommendations', {
        body: { vaultId, limit: 5 }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);

    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load recommendations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (rec: Recommendation) => {
    setProcessingItem(rec.vaultItemId);

    try {
      // Extract the main field from current version
      const fieldName = rec.vaultCategory === 'power_phrases' ? 'phrase' :
                       rec.vaultCategory === 'transferable_skills' ? 'skill' :
                       rec.vaultCategory === 'soft_skills' ? 'skill' :
                       rec.vaultCategory === 'hidden_competencies' ? 'competency' :
                       'content';

      // Update vault item with improved version
      const { error } = await supabase
        .from(`vault_${rec.vaultCategory}`)
        .update({
          [fieldName]: rec.improvedVersion,
          quality_tier: 'silver',  // Upgrade to silver after AI improvement
          freshness_score: 90,  // Fresh content
          updated_at: new Date().toISOString()
        })
        .eq('id', rec.vaultItemId);

      if (error) throw error;

      toast({
        title: 'Vault Item Updated! ✨',
        description: 'The improved version has been saved to your vault.'
      });

      // Remove from recommendations
      setRecommendations(prev => prev.filter(r => r.vaultItemId !== rec.vaultItemId));

      if (onItemUpdated) onItemUpdated();

    } catch (error: any) {
      console.error('Error accepting recommendation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update vault item',
        variant: 'destructive'
      });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleRejectRecommendation = (rec: Recommendation) => {
    setRecommendations(prev => prev.filter(r => r.vaultItemId !== rec.vaultItemId));
    toast({
      title: 'Recommendation Dismissed',
      description: 'You can keep the current version.'
    });
  };

  const getIssueIcon = (issue: string) => {
    if (issue.toLowerCase().includes('vague') || issue.toLowerCase().includes('generic')) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (issue.toLowerCase().includes('quantif') || issue.toLowerCase().includes('metric')) {
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Analyzing your vault for improvement opportunities...</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle>Your Vault is Performing Well!</AlertTitle>
        <AlertDescription>
          No low-performing items found. Your vault items have good effectiveness scores.
          Keep using your vault to continue tracking performance.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Vault Quality Improvement Opportunity</AlertTitle>
          <AlertDescription>
            Found {summary.recommendationsGenerated} items with low effectiveness scores
            (avg: {summary.avgCurrentEffectiveness}%). Accepting these recommendations could
            improve your vault quality by <strong>{summary.estimatedVaultQualityIncrease}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {recommendations.map((rec, index) => (
        <Card key={rec.vaultItemId} className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {getIssueIcon(rec.diagnosis.mainIssue)}
                  Recommendation #{index + 1}
                </CardTitle>
                <CardDescription>
                  {rec.vaultCategory.replace(/_/g, ' ')} • Effectiveness: {(rec.effectivenessScore * 100).toFixed(0)}%
                  (removed {rec.timesRemoved}/{rec.timesUsed} times)
                </CardDescription>
              </div>
              <Badge variant={
                rec.recommendedAction === 'replace' ? 'default' :
                rec.recommendedAction === 'enhance' ? 'secondary' :
                'destructive'
              }>
                {rec.recommendedAction}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Diagnosis */}
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Issues Detected
              </h4>
              <p className="text-sm mb-2">
                <strong>Main Issue:</strong> {rec.diagnosis.mainIssue}
              </p>
              {rec.diagnosis.secondaryIssues.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Also: {rec.diagnosis.secondaryIssues.join(', ')}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2 italic">
                {rec.diagnosis.likelyReason}
              </p>
            </div>

            {/* Current vs Improved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-600">Current Version</h4>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-sm">
                    {typeof rec.currentVersion === 'object' ?
                      (rec.currentVersion.phrase || rec.currentVersion.skill || rec.currentVersion.competency || JSON.stringify(rec.currentVersion)) :
                      rec.currentVersion}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-600">✨ Improved Version</h4>
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                  <p className="text-sm font-medium">
                    {rec.improvedVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Improvements */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Improvements</h4>
              <ul className="space-y-1">
                {rec.keyImprovements.map((improvement, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Impact */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm">
                <strong>Expected Impact:</strong> {rec.expectedImpact}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleAcceptRecommendation(rec)}
                disabled={processingItem === rec.vaultItemId}
                className="flex-1 gap-2"
              >
                {processingItem === rec.vaultItemId ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept & Update Vault
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRejectRecommendation(rec)}
                disabled={processingItem === rec.vaultItemId}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Reload Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={loadRecommendations}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
};
