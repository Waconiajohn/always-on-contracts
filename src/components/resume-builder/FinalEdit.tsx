import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface FinalEditProps {
  content: string;
  onChange: (content: string) => void;
  requirement: any;
}

export const FinalEdit = ({ content, onChange, requirement }: FinalEditProps) => (
  <div className="space-y-4">
    <div>
      <Label className="text-base font-semibold mb-2 block">Final Edit</Label>
      <p className="text-sm text-muted-foreground mb-3">
        Review and edit before adding to your resume:
      </p>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="font-mono text-sm"
      />
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>This will address:</span>
      <Badge variant="outline">{requirement.text.substring(0, 50)}...</Badge>
    </div>
  </div>
);
