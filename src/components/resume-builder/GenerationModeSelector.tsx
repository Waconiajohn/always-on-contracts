import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Edit3, Sparkles, Clock, Target } from "lucide-react";

interface GenerationModeSelectorProps {
  onSelectMode: (mode: 'full' | 'section-by-section') => void;
  sectionsCount: number;
}

export const GenerationModeSelector = ({
  onSelectMode,
  sectionsCount
}: GenerationModeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Generation Mode</h2>
        <p className="text-muted-foreground">
          Select how you'd like to build your resume
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Generation */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => onSelectMode('full')}>
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Fast
            </Badge>
          </div>
          
          <CardHeader>
            <div className="mb-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Generate Complete Resume</CardTitle>
            <CardDescription className="text-base">
              AI generates all {sectionsCount} sections at once using your Career Vault and job requirements
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>~2-3 minutes total</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Best for complete drafts</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">What you get:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>All sections generated sequentially</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Edit everything in final review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Optimal for time-sensitive needs</span>
                </li>
              </ul>
            </div>

            <Button className="w-full group-hover:bg-primary/90 transition-colors">
              Generate All Sections
            </Button>
          </CardContent>
        </Card>

        {/* Section by Section */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => onSelectMode('section-by-section')}>
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              Precise
            </Badge>
          </div>
          
          <CardHeader>
            <div className="mb-3">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Edit3 className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
            <CardTitle>Build Section-by-Section</CardTitle>
            <CardDescription className="text-base">
              Review and approve each section individually with dual AI generation and comparison
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>~20-30 seconds per section</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Best for precision control</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">What you get:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent-foreground mt-0.5">✓</span>
                  <span>Dual generation: industry vs. personalized</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-foreground mt-0.5">✓</span>
                  <span>Compare and blend versions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-foreground mt-0.5">✓</span>
                  <span>Fine-tune each section before proceeding</span>
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full group-hover:bg-accent/10 group-hover:border-accent transition-colors">
              Build Step-by-Step
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 You can always edit and regenerate sections later
        </p>
      </div>
    </div>
  );
};
