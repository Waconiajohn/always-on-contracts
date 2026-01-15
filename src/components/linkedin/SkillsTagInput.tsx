import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  suggestions?: string[];
}

export function SkillsTagInput({ 
  skills, 
  onChange, 
  maxSkills = 50,
  suggestions = []
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill) && skills.length < maxSkills) {
      onChange([...skills, trimmedSkill]);
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(s => s !== skillToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-3 min-h-[80px] border rounded-md bg-background">
        {skills.map((skill, idx) => (
          <Badge 
            key={idx} 
            variant={idx < 3 ? "default" : "secondary"}
            className="gap-1"
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:bg-background/20 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? "Type a skill and press Enter" : "Add more..."}
          className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0 h-6"
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(skills.length >= maxSkills && "text-destructive")}>
          {skills.length} of {maxSkills} skills
        </span>
        <span className="text-muted-foreground">Press Enter or comma to add</span>
      </div>

      {suggestions.length > 0 && skills.length < maxSkills && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Suggested from Master Resume:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions
              .filter(s => !skills.includes(s))
              .slice(0, 10)
              .map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addSkill(suggestion)}
                >
                  + {suggestion}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
