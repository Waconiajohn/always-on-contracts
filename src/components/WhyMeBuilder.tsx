import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Save, Sparkles, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { 
  GenerateWhyMeQuestionsSchema,
  validateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

interface WhyMeNarrative {
  id: string;
  category: string;
  narrative: string;
  keywords: string[];
  created_at: string;
}

interface WhyMeBuilderProps {
  userId: string;
  narratives: WhyMeNarrative[];
  onUpdate: () => void;
}

export const WhyMeBuilder: React.FC<WhyMeBuilderProps> = ({ userId, narratives, onUpdate }) => {
  const { toast } = useToast();
  const [currentNarrative, setCurrentNarrative] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    'Leadership',
    'Technical Expertise',
    'Project Management',
    'Team Building',
    'Strategic Planning',
    'Crisis Management',
    'Innovation',
    'Client Relations'
  ];

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const validated = validateInput(GenerateWhyMeQuestionsSchema, {
        jobDescription: currentCategory // Using category as job description context
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-why-me-questions',
        validated,
        { successMessage: 'Questions generated!' }
      );

      if (error) return;

      // You could display these questions in a dialog
      logger.debug('Generated questions:', { data });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNarrative = async () => {
    if (!currentNarrative.trim() || !currentCategory) {
      toast({
        title: "Missing information",
        description: "Please select a category and write your narrative",
        variant: "destructive",
      });
      return;
    }

    try {
      const newNarrative: WhyMeNarrative = {
        id: crypto.randomUUID(),
        category: currentCategory,
        narrative: currentNarrative,
        keywords: [], // Could extract keywords using AI
        created_at: new Date().toISOString(),
      };

      const updatedNarratives = [...narratives, newNarrative];

      const { error } = await supabase
        .from('profiles')
        .update({ why_me_narratives: updatedNarratives as any })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Narrative saved",
        description: "Your success story has been added",
      });

      setCurrentNarrative('');
      setCurrentCategory('');
      onUpdate();
    } catch (error) {
      console.error('Error saving narrative:', error);
      toast({
        title: "Error",
        description: "Failed to save narrative",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNarrative = async (narrativeId: string) => {
    try {
      const updatedNarratives = narratives.filter(n => n.id !== narrativeId);

      const { error } = await supabase
        .from('profiles')
        .update({ why_me_narratives: updatedNarratives as any })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Narrative deleted",
        description: "Success story removed",
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting narrative:', error);
      toast({
        title: "Error",
        description: "Failed to delete narrative",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          Why Me? - Your Success Stories
        </CardTitle>
        <CardDescription>
          Share your achievements and what makes you exceptional. These narratives will be used to customize your resumes for each opportunity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Narratives */}
        {narratives.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Your Success Stories</h3>
            {narratives.map((narrative) => (
              <Card key={narrative.id} className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{narrative.category}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNarrative(narrative.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{narrative.narrative}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Narrative */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Success Story
          </h3>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={currentCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCurrentCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          <Textarea
            placeholder="Share a specific achievement or success story related to this category. Be specific about what you did, how you did it, and the results you achieved..."
            value={currentNarrative}
            onChange={(e) => setCurrentNarrative(e.target.value)}
            rows={6}
            className="resize-none"
          />

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateQuestions}
              variant="outline"
              disabled={!currentCategory || isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Get Guided Questions'}
            </Button>
            <Button
              onClick={handleSaveNarrative}
              disabled={!currentNarrative.trim() || !currentCategory}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Story
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
