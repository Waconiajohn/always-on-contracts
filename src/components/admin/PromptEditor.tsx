import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit3, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const PROMPT_OPTIONS = [
  { id: 'RESUME_GENERATION_V1', name: 'Resume Generation' },
  { id: 'POWER_PHRASE_EXTRACTION', name: 'Power Phrase Extraction' },
  { id: 'TRANSFERABLE_SKILLS', name: 'Transferable Skills Detection' },
  { id: 'HIDDEN_COMPETENCIES', name: 'Hidden Competencies Inference' },
  { id: 'SOFT_SKILLS_ANALYSIS', name: 'Soft Skills Analysis' },
  { id: 'JOB_ANALYSIS_V1', name: 'Job Description Analysis' },
];

export default function PromptEditor() {
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    // In a real implementation, fetch the actual prompt from the database
    const mockPrompt = `System prompt for ${promptId}...\n\nThis is a placeholder prompt that would normally be loaded from your prompt registry.`;
    setOriginalPrompt(mockPrompt);
    setEditedPrompt(mockPrompt);
  };

  const savePromptMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to admin_prompt_overrides
      const { error: overrideError } = await supabase
        .from('admin_prompt_overrides')
        .upsert({
          prompt_id: selectedPromptId,
          original_prompt: originalPrompt,
          override_prompt: editedPrompt,
          is_active: true,
          created_by: user.id
        });

      if (overrideError) throw overrideError;

      // Get current version number
      const { data: versions } = await supabase
        .from('prompt_version_history')
        .select('version_number')
        .eq('prompt_id', selectedPromptId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      // Save to version history
      const { error: historyError } = await supabase
        .from('prompt_version_history')
        .insert({
          prompt_id: selectedPromptId,
          version_number: nextVersion,
          prompt_content: editedPrompt,
          changed_by: user.id,
          change_reason: changeReason
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      toast({
        title: 'Prompt saved',
        description: 'Your changes have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['prompt-overrides'] });
      setChangeReason('');
    },
    onError: (error) => {
      toast({
        title: 'Error saving prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReset = () => {
    setEditedPrompt(originalPrompt);
    toast({
      title: 'Prompt reset',
      description: 'Changes have been discarded.',
    });
  };

  const hasChanges = editedPrompt !== originalPrompt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Live Prompt Editor
        </CardTitle>
        <CardDescription>
          Edit and update AI prompts in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt-select">Select Prompt</Label>
          <Select value={selectedPromptId} onValueChange={handlePromptSelect}>
            <SelectTrigger id="prompt-select">
              <SelectValue placeholder="Choose a prompt to edit" />
            </SelectTrigger>
            <SelectContent>
              {PROMPT_OPTIONS.map((prompt) => (
                <SelectItem key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPromptId && (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes will affect all future AI requests using this prompt. Test thoroughly before saving.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt-content">Prompt Content</Label>
                {hasChanges && (
                  <Badge variant="secondary">Modified</Badge>
                )}
              </div>
              <Textarea
                id="prompt-content"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter your prompt here..."
              />
              <p className="text-xs text-muted-foreground">
                {editedPrompt.length} characters
              </p>
            </div>

            {hasChanges && (
              <div className="space-y-2">
                <Label htmlFor="change-reason">Change Reason (Optional)</Label>
                <Textarea
                  id="change-reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Describe why you're making this change..."
                  className="h-20"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => savePromptMutation.mutate()}
                disabled={!hasChanges || savePromptMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {savePromptMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
