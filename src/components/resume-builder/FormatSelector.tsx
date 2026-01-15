import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { RESUME_FORMATS, ResumeFormat, recommendFormat } from "@/lib/resumeFormats";
import { cn } from "@/lib/utils";

interface FormatSelectorProps {
  jobAnalysis: any;
  selectedFormat: string | null;
  onSelectFormat: (formatId: string) => void;
  onContinue: () => void;
}

export const FormatSelector = ({
  jobAnalysis,
  selectedFormat,
  onSelectFormat,
  onContinue
}: FormatSelectorProps) => {
  const recommendedFormatId = recommendFormat(jobAnalysis);

  const renderFormatCard = (format: ResumeFormat) => {
    const isSelected = selectedFormat === format.id;
    const isRecommended = recommendedFormatId === format.id;

    return (
      <Card
        key={format.id}
        className={cn(
          "p-6 cursor-pointer transition-all hover:shadow-md relative",
          isSelected
            ? "border-2 border-primary bg-primary/5"
            : "border hover:border-primary/50"
        )}
        onClick={() => onSelectFormat(format.id)}
      >
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-1">
              <Sparkles className="h-3 w-3" />
              AI Recommended
            </Badge>
          </div>
        )}

        {isSelected && (
          <div className="absolute -top-3 -right-3">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="text-4xl">{format.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{format.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {format.description}
            </p>

            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Best for:</p>
              <div className="flex flex-wrap gap-1">
                {format.bestFor.map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Sections ({format.sections.length}):
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {format.sections.slice(0, 4).map((section, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-primary">•</span>
                    {section.title}
                    {section.required && <span className="text-xs">(Required)</span>}
                  </li>
                ))}
                {format.sections.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    +{format.sections.length - 4} more sections
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Choose Your Resume Format</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Based on your target role ({jobAnalysis.roleProfile?.title || 'Not specified'}),
          we recommend a format that will best showcase your experience and match employer expectations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {RESUME_FORMATS.map(renderFormatCard)}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!selectedFormat}
          className="gap-2"
        >
          Continue with {selectedFormat ? RESUME_FORMATS.find(f => f.id === selectedFormat)?.name : 'Selected Format'}
        </Button>
      </div>

      {selectedFormat && (
        <Card className="p-6 bg-primary/5 border-primary/30">
          <h4 className="font-semibold mb-2">What to expect:</h4>
          <p className="text-sm text-muted-foreground">
            We'll guide you through each section step-by-step. For each section, you'll:
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
            <li>1. See AI guidance on what should be included</li>
            <li>2. Select relevant items from your Master Resume</li>
            <li>3. Review AI-generated content tailored to this job</li>
            <li>4. Edit if needed, then approve to continue</li>
          </ol>
        </Card>
      )}
    </div>
  );
};
