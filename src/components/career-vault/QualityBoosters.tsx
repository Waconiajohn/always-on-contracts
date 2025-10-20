import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Sparkles, CheckCircle, X } from 'lucide-react';

interface QualityBoostersProps {
  quantificationScore: number;
  modernTermsScore: number;
  totalPhrases: number;
  onAddMetrics: () => void;
  onModernizeLanguage: () => void;
}

export const QualityBoosters = ({
  quantificationScore,
  modernTermsScore,
  totalPhrases,
  onAddMetrics,
  onModernizeLanguage
}: QualityBoostersProps) => {
  const phrasesWithMetrics = Math.round((quantificationScore / 15) * totalPhrases);
  const phrasesWithModernTerms = Math.round((modernTermsScore / 15) * totalPhrases);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-1">Vault Quality Boosters</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Enhance your vault's impact with these proven techniques
      </p>

      <div className="space-y-6">
        {/* Quantification Booster */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex gap-3 flex-1">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Add Metrics to Phrases</h4>
                <div className="flex items-center gap-2 mb-2">
                  {phrasesWithMetrics > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {phrasesWithMetrics} of {totalPhrases} phrases have metrics
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      0 phrases include numbers
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Why it matters:</strong> ATS systems prioritize quantified results. Adding metrics increases resume impact by 40%.
                </p>
                
                {/* Example */}
                <div className="bg-background border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Example Improvement:</p>
                  <div className="flex items-start gap-2">
                    <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm">"Led digital transformation"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">"Led $2.3M digital transformation affecting 45% of operations over 18 months"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button 
            onClick={onAddMetrics}
            className="w-full"
            variant={phrasesWithMetrics === 0 ? "default" : "outline"}
          >
            {phrasesWithMetrics === 0 ? "Add Metrics to Phrases" : "Add More Metrics"}
          </Button>
        </div>

        {/* Modernization Booster */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex gap-3 flex-1">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Modernize Your Language</h4>
                <div className="flex items-center gap-2 mb-2">
                  {phrasesWithModernTerms > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {phrasesWithModernTerms} phrases use modern terms
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      0 phrases use current tech/business terms
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Why it matters:</strong> Shows you're current with industry trends and increases keyword matches.
                </p>
                
                {/* Suggested Terms */}
                <div className="bg-background border rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Suggested Terms for Your Field:</p>
                  <div className="flex flex-wrap gap-2">
                    {['AI', 'ML', 'Cloud', 'Automation', 'Data Analytics', 'Agile', 'DevOps', 'Digital Transformation'].map((term) => (
                      <Badge key={term} variant="outline" className="text-xs">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button 
            onClick={onModernizeLanguage}
            className="w-full"
            variant={phrasesWithModernTerms === 0 ? "default" : "outline"}
          >
            {phrasesWithModernTerms === 0 ? "Modernize Language" : "Update More Phrases"}
          </Button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          💡 <strong>Pro Tip:</strong> Use "Re-Analyze All" after uploading updated documents to recalculate these scores automatically.
        </p>
      </div>
    </Card>
  );
};
