import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";

interface VaultSuggestionsProps {
  suggestedTitles: string[];
  useTransferableSkills: boolean;
  setUseTransferableSkills: (use: boolean) => void;
  onSelectTitle: (title: string) => void;
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
            {suggestedTitles.map((title, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onSelectTitle(title)}
              >
                {title}
              </Badge>
            ))}
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
