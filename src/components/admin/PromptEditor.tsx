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

// Edge function prompts that can be edited via admin panel
const PROMPT_OPTIONS = [
  { 
    id: 'instant-resume-score', 
    name: 'Quick Score Analysis',
    defaultPrompt: `You are an expert resume analyst. Analyze the resume against the job description.

EXTRACTION RULES:
1. Extract the TOP 20 most important matched keywords (critical/high priority first)
2. Extract the TOP 15 most important missing keywords (critical/high priority first)
3. Keywords should be single terms or short phrases (1-4 words max)
4. Focus on technical skills, certifications, key competencies, and industry-specific terms
5. DO NOT include context phrases - just the keyword itself

SCORING WEIGHTS: jdMatch=60%, industryBenchmark=20%, atsCompliance=12%, humanVoice=8%`
  },
  { 
    id: 'hiring-manager-review', 
    name: 'Hiring Manager Review',
    defaultPrompt: `You are a senior hiring manager reviewing resumes. Provide critical, honest feedback on whether you would interview this candidate and what would make their resume stand out.

Be specific about:
1. First impressions (would you continue reading?)
2. Key strengths that catch your eye
3. Red flags or concerns
4. Missing elements for this role
5. Overall interview decision (Yes/Maybe/No)`
  },
  { 
    id: 'optimize-resume', 
    name: 'Resume Optimization',
    defaultPrompt: `You are an expert resume writer. Optimize the resume to better match the job description while maintaining authenticity.

RULES:
1. Never fabricate experience or skills
2. Reframe existing experience to highlight relevance
3. Add missing keywords where genuine experience supports them
4. Improve bullet points with metrics and impact
5. Maintain the candidate's authentic voice`
  },
  { 
    id: 'keyword-analysis', 
    name: 'Keyword Analysis',
    defaultPrompt: `You are an ATS and keyword expert. Analyze keywords from the job description and identify which are present or missing in the resume.

OUTPUT RULES:
1. Return only the keyword text - no context phrases needed
2. Classify each as critical, high, or medium priority
3. Include technical skills, soft skills, certifications, and industry terms
4. Limit to most important keywords (20 matched, 15 missing max)`
  },
  { 
    id: 'resume-generation', 
    name: 'Resume Generation',
    defaultPrompt: `You are an expert executive resume writer with 20+ years of experience crafting C-suite resumes. Create compelling, achievement-focused content that demonstrates strategic leadership and measurable business impact.`
  },
  { 
    id: 'job-analysis', 
    name: 'Job Description Analysis',
    defaultPrompt: `You are an expert career analyst specializing in executive-level positions. Analyze job descriptions to extract key requirements, qualifications, and cultural indicators.`
  },
];

export default function PromptEditor() {
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePromptSelect = async (promptId: string) => {
    setSelectedPromptId(promptId);
    setIsLoading(true);
    
    try {
      // First check for existing override in database
      const { data: override } = await supabase
        .from('admin_prompt_overrides')
        .select('override_prompt, original_prompt')
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (override?.override_prompt) {
        // Use database override
        setOriginalPrompt(override.original_prompt || override.override_prompt);
        setEditedPrompt(override.override_prompt);
      } else {
        // Use default from registry
        const prompt = PROMPT_OPTIONS.find(p => p.id === promptId);
        const defaultPrompt = prompt?.defaultPrompt || `System prompt for ${promptId}`;
        setOriginalPrompt(defaultPrompt);
        setEditedPrompt(defaultPrompt);
      }
    } catch (err) {
      console.error('Error loading prompt:', err);
      // Fallback to default
      const prompt = PROMPT_OPTIONS.find(p => p.id === promptId);
      const defaultPrompt = prompt?.defaultPrompt || `System prompt for ${promptId}`;
      setOriginalPrompt(defaultPrompt);
      setEditedPrompt(defaultPrompt);
    } finally {
      setIsLoading(false);
    }
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

        {selectedPromptId && !isLoading && (
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
