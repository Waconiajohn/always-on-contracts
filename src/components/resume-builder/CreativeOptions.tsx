import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface CreativeOptionsProps {
  options: Array<{
    content: string;
    reasoning: string;
    keywords: string[];
    strength: string;
  }>;
  onSelectOption: (index: number) => void;
}

export const CreativeOptions = ({ options, onSelectOption }: CreativeOptionsProps) => (
  <div className="space-y-4">
    {options.map((option, index) => (
      <Card key={index} className="hover:border-primary transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold">Option {index + 1}</h4>
            <Badge variant="outline">{option.strength || 'Strong'}</Badge>
          </div>
          <p className="text-sm leading-relaxed">{option.content}</p>
          {option.reasoning && (
            <p className="text-xs text-muted-foreground">{option.reasoning}</p>
          )}
          {option.keywords && option.keywords.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {option.keywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
          <Button onClick={() => onSelectOption(index)} className="w-full" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Select This Option
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
);
