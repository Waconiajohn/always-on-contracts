import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import type { TitleRecommendation } from "@/hooks/useJobTitleRecommendations";

interface VaultSuggestionsProps {
  suggestedTitles: TitleRecommendation[];
  useTransferableSkills: boolean;
  setUseTransferableSkills: (use: boolean) => void;
  onSelectTitle: (recommendation: TitleRecommendation) => void;
}

export const VaultSuggestions = ({
  suggestedTitles,
  useTransferableSkills,
  setUseTransferableSkills,
  onSelectTitle,
}: VaultSuggestionsProps) => {
  if (suggestedTitles.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Suggested by Your Career Vault
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Job Titles</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedTitles.map((rec, idx) => {
              const confidenceColor = 
                rec.confidence > 85 ? 'border-green-500 text-green-700' : 
                rec.confidence > 70 ? 'border-amber-500 text-amber-700' : 
                'border-gray-400 text-gray-700';
              
              return (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${confidenceColor}`}
                  onClick={() => onSelectTitle(rec)}
                >
                  {rec.title}
                  <span className="ml-1 text-[10px] opacity-70">({rec.confidence}%)</span>
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor="transferable-skills" className="text-sm">
            Include Transferable Skills in Search
          </Label>
          <Switch
            id="transferable-skills"
            checked={useTransferableSkills}
            onCheckedChange={setUseTransferableSkills}
          />
        </div>
      </CardContent>
    </Card>
  );
};
