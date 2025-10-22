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
      <Card 
        key={index} 
        className="group hover:border-primary hover:shadow-md transition-all duration-300 bg-gradient-to-br from-card to-card/50"
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {index + 1}
              </div>
              <h4 className="font-semibold text-lg">Option {index + 1}</h4>
            </div>
            <Badge 
              variant="outline" 
              className="bg-primary/5 border-primary/20 text-primary"
            >
              {option.strength || 'Strong'}
            </Badge>
          </div>
          
          <p className="text-foreground leading-relaxed">{option.content}</p>
          
          {option.reasoning && (
            <div className="bg-muted/50 rounded-md p-3 border-l-4 border-primary/30">
              <p className="text-sm text-muted-foreground">{option.reasoning}</p>
            </div>
          )}
          
          {option.keywords && option.keywords.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2">
              {option.keywords.map((keyword, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
          
          <Button 
            onClick={() => onSelectOption(index)} 
            className="w-full bg-primary hover:bg-primary/90 shadow-sm group-hover:shadow-md transition-all"
          >
            <Check className="mr-2 h-4 w-4" />
            Select This Option
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
);
