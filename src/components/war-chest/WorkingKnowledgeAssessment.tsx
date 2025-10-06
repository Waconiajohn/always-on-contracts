import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

interface WorkingKnowledgeAssessmentProps {
  skillName: string;
  onAssess: (level: 'none' | 'working' | 'strong_working') => void;
  onCancel?: () => void;
}

export const WorkingKnowledgeAssessment = ({
  skillName,
  onAssess,
  onCancel,
}: WorkingKnowledgeAssessmentProps) => {
  const [selectedLevel, setSelectedLevel] = useState<'none' | 'working' | 'strong_working'>('none');

  const handleSubmit = () => {
    onAssess(selectedLevel);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle>Assess Your Knowledge</CardTitle>
        </div>
        <CardDescription>
          We've identified <Badge variant="outline" className="mx-1">{skillName}</Badge> as a skill commonly required for your target roles.
          Do you have experience with this?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setSelectedLevel('none')}>
              <RadioGroupItem value="none" id="none" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="none" className="cursor-pointer font-medium">
                  No knowledge
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I haven't worked with this skill and would need to learn it from scratch
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setSelectedLevel('working')}>
              <RadioGroupItem value="working" id="working" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="working" className="cursor-pointer font-medium">
                  Working knowledge
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I understand the basics and could learn more with some guidance
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setSelectedLevel('strong_working')}>
              <RadioGroupItem value="strong_working" id="strong_working" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="strong_working" className="cursor-pointer font-medium">
                  Strong working knowledge
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I can discuss this topic confidently and apply it in practical situations
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            Continue
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Skip
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
