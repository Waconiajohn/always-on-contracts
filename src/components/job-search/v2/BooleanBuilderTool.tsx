import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Linkedin, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BooleanAIAssistant } from "@/components/job-search/BooleanAIAssistant";
import { QuickBooleanBuilder } from "@/components/job-search/QuickBooleanBuilder";

interface BooleanBuilderToolProps {
  booleanString: string;
  setBooleanString: (s: string) => void;
}

export function BooleanBuilderTool({ booleanString, setBooleanString }: BooleanBuilderToolProps) {
  const { toast } = useToast();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(booleanString);
    toast({
      title: "Copied for LinkedIn",
      description: "Paste this string directly into the LinkedIn job search bar."
    });
  };

  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10 mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Linkedin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">LinkedIn Boolean Builder</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Create precise search strings for LinkedIn. Does not affect CareerIQ search.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
            External Tool
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowQuickBuilder(true)}
            className="flex-1 bg-background"
          >
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            Quick Builder
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAIAssistant(true)}
            className="flex-1 bg-background"
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
            AI Assistant
          </Button>
        </div>

        <div className="relative">
          <Input
            value={booleanString}
            onChange={(e) => setBooleanString(e.target.value)}
            placeholder='(e.g. "Project Manager" OR "Program Manager") AND "SaaS"'
            className="font-mono text-sm pr-24 h-12 bg-background"
          />
          <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
            {booleanString && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 hover:bg-blue-100 text-blue-700"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            )}
          </div>
        </div>

        {booleanString && (
          <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-100/50 p-2 rounded">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Tip: Paste this into the main search bar on LinkedIn to find hidden roles that match your specific criteria.
            </p>
          </div>
        )}

        <BooleanAIAssistant
          open={showAIAssistant}
          onOpenChange={setShowAIAssistant}
          onApplySearch={(str) => {
            setBooleanString(str);
            setShowAIAssistant(false);
          }}
        />

        <QuickBooleanBuilder
          open={showQuickBuilder}
          onOpenChange={setShowQuickBuilder}
          onApply={(str) => {
            setBooleanString(str);
            setShowQuickBuilder(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
