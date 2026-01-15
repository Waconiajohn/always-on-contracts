import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Check } from "lucide-react";
import { validateInput, invokeEdgeFunction, GenerateStarStorySchema } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface STARStory {
  situation: string;
  task: string;
  action: string;
  result: string;
  competency: string;
  fullStory: string;
}

interface STARStoryGeneratorProps {
  resumeId: string;
}

export function STARStoryGenerator({ resumeId }: STARStoryGeneratorProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<any>(null);
  const [powerPhrases, setPowerPhrases] = useState<any[]>([]);
  const [softSkills, setSoftSkills] = useState<any[]>([]);
  const [leadershipPhilosophy, setLeadershipPhilosophy] = useState<any>(null);
  const [competency, setCompetency] = useState('');
  const [story, setStory] = useState<STARStory | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch power phrases
      const { data: phrasesData } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', resumeId)
        .order('impact_metrics', { ascending: false });

      if (phrasesData) setPowerPhrases(phrasesData);

      // Fetch soft skills with industry context
      const { data: skillsData } = await supabase
        .from('vault_soft_skills')
        .select('*')
        .eq('vault_id', resumeId)
        .limit(5);

      if (skillsData) setSoftSkills(skillsData);

      // Fetch leadership philosophy
      const { data: leadershipData } = await supabase
        .from('vault_leadership_philosophy')
        .select('*')
        .eq('vault_id', resumeId)
        .limit(1)
        .single();

      if (leadershipData) setLeadershipPhilosophy(leadershipData);
    };
    
    fetchResumeData();
  }, [resumeId]);

  const generateSTARStory = async () => {
    if (!selectedPhrase || !competency) {
      toast({
        title: "Missing Information",
        description: "Select a power phrase and competency",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const validated = validateInput(GenerateStarStorySchema, {
        rawStory: `${selectedPhrase.power_phrase}. ${selectedPhrase.impact_metrics}. Competency: ${competency}`,
        action: 'generate'
      });

      const { data, error } = await invokeEdgeFunction(
        'generate-star-story',
        validated
      );

      if (error || !data) {
        throw new Error(error?.message || 'Generation failed');
      }

      setStory(data.starStory);
    } catch (error: any) {
      logger.error('STAR story generation failed', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyStory = () => {
    if (story) {
      navigator.clipboard.writeText(story.fullStory);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          STAR Story Generator
        </CardTitle>
        <CardDescription>
          Convert your power phrases into interview-ready STAR stories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Power Phrase</label>
          <Select onValueChange={(id) => setSelectedPhrase(powerPhrases.find(p => p.id === id))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an achievement..." />
            </SelectTrigger>
            <SelectContent>
              {powerPhrases.map(phrase => (
                <SelectItem key={phrase.id} value={phrase.id}>
                  {phrase.power_phrase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPhrase && (
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <Badge variant="secondary" className="mb-2">{selectedPhrase.category}</Badge>
              <p className="text-sm font-medium">{selectedPhrase.power_phrase}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedPhrase.impact_metrics}</p>
            </div>

            {/* Interview Hooks from Soft Skills */}
            {softSkills.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Interview Hooks:</p>
                <div className="flex flex-wrap gap-1">
                  {softSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill.id} variant="outline" className="text-xs">
                      {skill.skill_name}
                      {skill.interview_question_map && Array.isArray(skill.interview_question_map) && skill.interview_question_map.length > 0 && 
                        ` → "${skill.interview_question_map[0].substring(0, 40)}..."`
                      }
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Leadership Philosophy Alignment */}
            {leadershipPhilosophy && leadershipPhilosophy.behavioral_interview_examples && Array.isArray(leadershipPhilosophy.behavioral_interview_examples) && leadershipPhilosophy.behavioral_interview_examples.length > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">🎯 Leadership Angle:</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {leadershipPhilosophy.behavioral_interview_examples[0]}
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Target Competency</label>
          <Select onValueChange={setCompetency}>
            <SelectTrigger>
              <SelectValue placeholder="What does this demonstrate?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="problem-solving">Problem Solving</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="innovation">Innovation</SelectItem>
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="strategic-thinking">Strategic Thinking</SelectItem>
              <SelectItem value="adaptability">Adaptability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateSTARStory} 
          disabled={generating || !selectedPhrase || !competency}
          className="w-full"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {generating ? "Generating..." : "Generate STAR Story"}
        </Button>

        {story && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your STAR Story</h3>
              <Button variant="outline" size="sm" onClick={copyStory}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-1">Situation</Badge>
                <p className="text-sm">{story.situation}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Task</Badge>
                <p className="text-sm">{story.task}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Action</Badge>
                <p className="text-sm">{story.action}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Result</Badge>
                <p className="text-sm">{story.result}</p>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Full Story:</p>
              <Textarea 
                value={story.fullStory}
                readOnly
                rows={8}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
