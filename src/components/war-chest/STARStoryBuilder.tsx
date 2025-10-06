import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface STARStoryBuilderProps {
  skillName?: string;
  resumeContext?: string;
  onComplete: (story: string) => void;
  onCancel?: () => void;
}

export const STARStoryBuilder = ({
  skillName,
  resumeContext,
  onComplete,
  onCancel,
}: STARStoryBuilderProps) => {
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  const minLengths = {
    situation: 100,
    task: 50,
    action: 150,
    result: 80,
  };

  const isFieldComplete = (field: string, minLength: number) => {
    return field.trim().length >= minLength;
  };

  const allFieldsComplete =
    isFieldComplete(situation, minLengths.situation) &&
    isFieldComplete(task, minLengths.task) &&
    isFieldComplete(action, minLengths.action) &&
    isFieldComplete(result, minLengths.result);

  const handleSubmit = () => {
    if (!allFieldsComplete) return;

    const story = `
**Situation:** ${situation.trim()}

**Task:** ${task.trim()}

**Action:** ${action.trim()}

**Result:** ${result.trim()}
    `.trim();

    onComplete(story);
  };

  const FieldStatus = ({ text, minLength }: { text: string; minLength: number }) => {
    const length = text.trim().length;
    const isComplete = length >= minLength;
    const remaining = Math.max(0, minLength - length);

    return (
      <div className="flex items-center gap-2 text-xs">
        {isComplete ? (
          <>
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Complete</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <span className="text-muted-foreground">{remaining} characters needed</span>
          </>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Share Your STAR Story</CardTitle>
          </div>
          {skillName && <Badge variant="outline">{skillName}</Badge>}
        </div>
        <CardDescription>
          Tell us about a specific example demonstrating your expertise. Be specific and include measurable outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Situation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="situation" className="font-semibold">
              Situation
            </Label>
            <FieldStatus text={situation} minLength={minLengths.situation} />
          </div>
          <p className="text-sm text-muted-foreground">
            Describe the context or challenge you faced (2-3 sentences)
          </p>
          <Textarea
            id="situation"
            placeholder="e.g., Our company was experiencing slow product releases due to manual deployment processes..."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Task */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="task" className="font-semibold">
              Task
            </Label>
            <FieldStatus text={task} minLength={minLengths.task} />
          </div>
          <p className="text-sm text-muted-foreground">
            What was your specific responsibility? (1-2 sentences)
          </p>
          <Textarea
            id="task"
            placeholder="e.g., I was tasked with implementing a CI/CD pipeline to automate deployments..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Action */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="action" className="font-semibold">
              Action
            </Label>
            <FieldStatus text={action} minLength={minLengths.action} />
          </div>
          <p className="text-sm text-muted-foreground">
            What specific steps did you take? List 2-3 key actions
          </p>
          <Textarea
            id="action"
            placeholder="e.g., 
1. Evaluated and selected Jenkins as our CI/CD tool
2. Set up automated testing pipelines
3. Trained the team on the new workflow..."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="result" className="font-semibold">
              Result
            </Label>
            <FieldStatus text={result} minLength={minLengths.result} />
          </div>
          <p className="text-sm text-muted-foreground">
            What measurable outcome did you achieve? Include numbers if possible
          </p>
          <Textarea
            id="result"
            placeholder="e.g., Reduced deployment time from 2 days to 30 minutes, decreased errors by 60%, and increased team productivity by 40%..."
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} disabled={!allFieldsComplete} className="flex-1">
            {allFieldsComplete ? 'Submit Story' : 'Complete All Fields'}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
