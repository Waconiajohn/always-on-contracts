import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Gem, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Copy,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface IdealExampleCardProps {
  sectionType: 'summary' | 'skills' | 'experience_bullets' | 'education';
  idealContent: string;
  structureNotes: string;
  keyElements: string[];
  keywordsIncluded: string[];
  wordCount: number;
  onUseIdeal: () => void;
  onPersonalize: () => void;
  isLoading?: boolean;
}

export function IdealExampleCard({
  sectionType,
  idealContent,
  structureNotes,
  keyElements,
  keywordsIncluded,
  wordCount,
  onUseIdeal,
  onPersonalize,
  isLoading = false,
}: IdealExampleCardProps) {
  const sectionLabels: Record<string, string> = {
    summary: 'Professional Summary',
    skills: 'Skills Section',
    experience_bullets: 'Experience Bullets',
    education: 'Education Section',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(idealContent);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gem className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Industry Standard Example
              </CardTitle>
              <CardDescription className="text-sm">
                Platinum standard {sectionLabels[sectionType] || 'section'} based on industry research
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {wordCount} words
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Ideal Content Display */}
        <div className="relative">
          <div className="p-4 bg-card rounded-lg border border-border/60">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {idealContent}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Quality Indicators
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {keyElements.slice(0, 6).map((element, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="truncate">{element}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords Included */}
        {keywordsIncluded.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Keywords Included
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {keywordsIncluded.slice(0, 8).map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-2 py-0.5"
                >
                  {keyword}
                </Badge>
              ))}
              {keywordsIncluded.length > 8 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{keywordsIncluded.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Structure Notes */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground italic">
            <Sparkles className="h-3 w-3 inline mr-1" />
            {structureNotes}
          </p>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onUseIdeal}
            disabled={isLoading}
          >
            Use This Version
          </Button>
          <Button
            className="flex-1"
            onClick={onPersonalize}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Personalize with My Data
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
