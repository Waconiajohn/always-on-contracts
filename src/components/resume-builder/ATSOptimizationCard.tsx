import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  detectATS,
  getATSTips,
  getAllATSSystems,
  type ATSSystem,
} from '@/lib/ats-detection';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Info,
} from 'lucide-react';

interface ATSOptimizationCardProps {
  jobUrl?: string;
  jobText?: string;
  onATSChange?: (system: ATSSystem) => void;
}

export function ATSOptimizationCard({ jobUrl, jobText, onATSChange }: ATSOptimizationCardProps) {
  const [detectedATS, setDetectedATS] = useState<ATSSystem>('unknown');
  const [selectedATS, setSelectedATS] = useState<ATSSystem | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('low');
  const [isExpanded, setIsExpanded] = useState(false);

  const activeATS = selectedATS || detectedATS;
  const tips = getATSTips(activeATS);
  const allSystems = getAllATSSystems();

  useEffect(() => {
    const result = detectATS(jobUrl, jobText);
    setDetectedATS(result.system);
    setConfidence(result.confidence);
  }, [jobUrl, jobText]);

  const handleATSChange = (system: ATSSystem) => {
    setSelectedATS(system);
    onATSChange?.(system);
  };

  const getConfidenceBadge = () => {
    if (selectedATS) {
      return <Badge variant="outline" className="text-xs">Manual selection</Badge>;
    }
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="text-xs">Auto-detected</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Likely detected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">ATS Optimization</CardTitle>
          </div>
          {getConfidenceBadge()}
        </div>
        <CardDescription>
          Tailored tips for {tips.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ATS Selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Target ATS:</span>
          <Select value={activeATS} onValueChange={(v) => handleATSChange(v as ATSSystem)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allSystems.map((sys) => (
                <SelectItem key={sys.id} value={sys.id}>
                  {sys.name}
                  {sys.id === detectedATS && !selectedATS && ' (detected)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{tips.description}</p>

        {/* Key Tips */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Key Tips for {tips.name}</h4>
          <ul className="space-y-1.5">
            {tips.tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-xs">
                {isExpanded ? 'Show less' : 'Show detailed recommendations'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Format Advice */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Format Requirements
              </h4>
              <ul className="space-y-1">
                {tips.formatAdvice.map((advice, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {advice}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keyword Advice */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Keyword Strategy
              </h4>
              <p className="text-xs text-muted-foreground">{tips.keywordAdvice}</p>
            </div>

            {/* Avoid List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Avoid These
              </h4>
              <div className="flex flex-wrap gap-1">
                {tips.avoidList.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Tips */}
            {tips.tips.length > 3 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Additional Tips</h4>
                <ul className="space-y-1">
                  {tips.tips.slice(3).map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
