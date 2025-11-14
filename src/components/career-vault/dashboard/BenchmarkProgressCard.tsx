import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayerSection {
  name: string;
  target: number;
  current: number;
  percentage: number;
  details?: string;
  missing?: string[];
}

interface BenchmarkProgressCardProps {
  layer1: {
    total_current: number;
    total_target: number;
    sections: LayerSection[];
  };
  layer2: {
    total_current: number;
    total_target: number;
    sections: LayerSection[];
  };
  onViewDetails?: () => void;
}

const StatusIcon = ({ percentage }: { percentage: number }) => {
  if (percentage >= 100) return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (percentage >= 75) return <AlertCircle className="h-4 w-4 text-warning" />;
  return <Circle className="h-4 w-4 text-destructive" />;
};

const SectionRow = ({ section }: { section: LayerSection }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1">
          <StatusIcon percentage={section.percentage} />
          <span className="font-medium">{section.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {section.percentage}% ({section.current}/{section.target})
          </span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      
      {expanded && (
        <div className="ml-8 space-y-2 text-sm">
          <Progress value={section.percentage} className="h-2" />
          {section.details && (
            <p className="text-muted-foreground">{section.details}</p>
          )}
          {section.missing && section.missing.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">Missing:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {section.missing.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BenchmarkProgressCard = ({
  layer1,
  layer2,
  onViewDetails
}: BenchmarkProgressCardProps) => {
  const [layer1Expanded, setLayer1Expanded] = useState(false);
  const [layer2Expanded, setLayer2Expanded] = useState(false);

  const layer1Percentage = Math.round((layer1.total_current / layer1.total_target) * 100);
  const layer2Percentage = Math.round((layer2.total_current / layer2.total_target) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Benchmark Progress</span>
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              View Detailed Breakdown →
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer 1 */}
        <div className="space-y-3">
          <button
            onClick={() => setLayer1Expanded(!layer1Expanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {layer1Expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <div className="text-left">
                <h3 className="font-semibold">Layer 1: Resume Foundations</h3>
                <p className="text-sm text-muted-foreground">
                  {layer1.total_current}/{layer1.total_target} points ({layer1Percentage}%)
                </p>
              </div>
            </div>
            <Progress value={layer1Percentage} className="h-2 w-32" />
          </button>

          {layer1Expanded && (
            <div className="ml-4 space-y-2">
              {layer1.sections.map((section, i) => (
                <SectionRow key={i} section={section} />
              ))}
            </div>
          )}
        </div>

        {/* Layer 2 */}
        <div className="space-y-3">
          <button
            onClick={() => setLayer2Expanded(!layer2Expanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {layer2Expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <div className="text-left">
                <h3 className="font-semibold">Layer 2: Executive Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  {layer2.total_current}/{layer2.total_target} points ({layer2Percentage}%)
                </p>
              </div>
            </div>
            <Progress value={layer2Percentage} className="h-2 w-32" />
          </button>

          {layer2Expanded && (
            <div className="ml-4 space-y-2">
              {layer2.sections.map((section, i) => (
                <SectionRow key={i} section={section} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};