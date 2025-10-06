import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Briefcase, Lightbulb, TrendingUp, CheckCircle2 } from 'lucide-react';

interface SkillCardProps {
  skill: {
    id: string;
    skill_name: string;
    source: 'resume' | 'inferred' | 'growth';
    confidence_score: number;
    sub_attributes: string[];
    market_frequency?: number;
  };
  onConfirm: (data: {
    proficiency: string;
    selectedAttributes: string[];
    wantToDevelop: boolean;
  }) => void;
  onSkip: () => void;
}

export const SkillCard = ({ skill, onConfirm, onSkip }: SkillCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [proficiency, setProficiency] = useState<string>(
    skill.source === 'growth' ? 'none' : 'proficient'
  );
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [wantToDevelop, setWantToDevelop] = useState(skill.source === 'growth');
  const [confirmed, setConfirmed] = useState(false);

  const getSourceIcon = () => {
    switch (skill.source) {
      case 'resume':
        return <Briefcase className="h-4 w-4" />;
      case 'inferred':
        return <Lightbulb className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (skill.source) {
      case 'resume':
        return 'From Resume';
      case 'inferred':
        return 'Inferred';
      case 'growth':
        return 'Growth Opportunity';
    }
  };

  const getSourceColor = () => {
    switch (skill.source) {
      case 'resume':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'inferred':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'growth':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  const toggleAttribute = (attr: string) => {
    setSelectedAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const handleSave = () => {
    onConfirm({
      proficiency,
      selectedAttributes,
      wantToDevelop,
    });
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <span className="font-medium">{skill.skill_name}</span>
              <span className="text-sm text-muted-foreground ml-2">- Confirmed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isExpanded ? 'border-primary' : ''}>
      <CardContent className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            {getSourceIcon()}
            <div className="flex-1">
              <h3 className="font-medium">{skill.skill_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getSourceColor()}>
                  {getSourceLabel()}
                </Badge>
                {skill.market_frequency && (
                  <span className="text-xs text-muted-foreground">
                    Appears in {skill.market_frequency}% of target roles
                  </span>
                )}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Proficiency Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your experience level:</Label>
              <RadioGroup value={proficiency} onValueChange={setProficiency}>
                {skill.source === 'growth' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id={`${skill.id}-none`} />
                      <Label htmlFor={`${skill.id}-none`} className="cursor-pointer">
                        No knowledge
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="working" id={`${skill.id}-working`} />
                      <Label htmlFor={`${skill.id}-working`} className="cursor-pointer">
                        Working knowledge (understand basics)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="strong_working" id={`${skill.id}-strong`} />
                      <Label htmlFor={`${skill.id}-strong`} className="cursor-pointer">
                        Strong working knowledge (can discuss/apply)
                      </Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="proficient" id={`${skill.id}-proficient`} />
                      <Label htmlFor={`${skill.id}-proficient`} className="cursor-pointer">
                        Proficient (3+ years)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expert" id={`${skill.id}-expert`} />
                      <Label htmlFor={`${skill.id}-expert`} className="cursor-pointer">
                        Expert (led major initiatives)
                      </Label>
                    </div>
                  </>
                )}
              </RadioGroup>
            </div>

            {/* Sub-attributes */}
            {skill.sub_attributes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {skill.source === 'growth'
                    ? 'Related areas (if any):'
                    : 'Which of these apply to you?'}
                </Label>
                <div className="space-y-2">
                  {skill.sub_attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => toggleAttribute(attr)}
                    >
                      <Checkbox
                        checked={selectedAttributes.includes(attr)}
                        onCheckedChange={() => toggleAttribute(attr)}
                      />
                      <label className="flex-1 cursor-pointer text-sm">{attr}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Want to Develop */}
            <div className="flex items-center space-x-2 p-3 bg-accent/50 rounded">
              <Checkbox
                checked={wantToDevelop}
                onCheckedChange={(checked) => setWantToDevelop(checked === true)}
              />
              <label
                className="cursor-pointer text-sm"
                onClick={() => setWantToDevelop(!wantToDevelop)}
              >
                Mark as "Want to Develop"
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button onClick={onSkip} variant="ghost">
                Skip
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
