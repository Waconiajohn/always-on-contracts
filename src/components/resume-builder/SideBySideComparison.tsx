import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gem, 
  User, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Blend,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ComparisonData {
  idealContent: string;
  personalizedContent: string;
  idealWordCount: number;
  personalizedWordCount: number;
  similarityScore: number;
  gapsIdentified: string[];
  evidenceUsed: Array<{
    evidence_text: string;
    how_used: string;
  }>;
}

interface SideBySideComparisonProps {
  data: ComparisonData;
  onSelectIdeal: () => void;
  onSelectPersonalized: () => void;
  onBlend: () => void;
  isLoading?: boolean;
}

export function SideBySideComparison({
  data,
  onSelectIdeal,
  onSelectPersonalized,
  onBlend,
  isLoading = false,
}: SideBySideComparisonProps) {
  const {
    idealContent,
    personalizedContent,
    idealWordCount,
    personalizedWordCount,
    similarityScore,
    gapsIdentified,
    evidenceUsed,
  } = data;

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} copied to clipboard`);
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', variant: 'default' as const };
    if (score >= 60) return { label: 'Good Match', variant: 'secondary' as const };
    return { label: 'Needs Work', variant: 'outline' as const };
  };

  const similarity = getSimilarityLabel(similarityScore);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{similarityScore}%</p>
            <p className="text-xs text-muted-foreground">Structure Match</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <Badge variant={similarity.variant}>{similarity.label}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{evidenceUsed.length} evidence points used</span>
          <span>•</span>
          <span>{gapsIdentified.length} gaps identified</span>
        </div>
      </div>

      {/* Side by Side Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ideal Version */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Industry Standard</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {idealWordCount} words
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="relative group">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {idealContent}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(idealContent, 'Industry Standard')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <Button
              variant="outline"
              className="w-full"
              onClick={onSelectIdeal}
              disabled={isLoading}
            >
              Use Industry Standard
            </Button>
          </CardContent>
        </Card>

        {/* Personalized Version */}
        <Card className={cn(
          'border-2',
          gapsIdentified.length === 0 ? 'border-primary' : 'border-border'
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-foreground" />
                <CardTitle className="text-base">Your Personalized</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {personalizedWordCount} words
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="relative group">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {personalizedContent}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(personalizedContent, 'Personalized')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <Button
              className="w-full"
              onClick={onSelectPersonalized}
              disabled={isLoading}
            >
              Use Personalized
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Evidence & Gaps Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Evidence Used */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Evidence Incorporated ({evidenceUsed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {evidenceUsed.slice(0, 5).map((item, index) => (
                  <div key={index} className="text-xs">
                    <p className="text-muted-foreground truncate">{item.evidence_text}</p>
                    <p className="text-primary/80 italic">→ {item.how_used}</p>
                  </div>
                ))}
                {evidenceUsed.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No evidence points were incorporated
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gaps Identified */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Gaps Identified ({gapsIdentified.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {gapsIdentified.slice(0, 5).map((gap, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {gap}
                  </p>
                ))}
                {gapsIdentified.length === 0 && (
                  <p className="text-xs text-primary italic">
                    ✓ All areas covered with your evidence
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Blend Option */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onBlend}
          disabled={isLoading}
          className="gap-2"
        >
          <Blend className="h-5 w-5" />
          Open Blend Editor
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
