import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Check } from "lucide-react";

interface STARStory {
  situation: string;
  task: string;
  action: string;
  result: string;
  competency: string;
  fullStory: string;
}

interface STARStoryGeneratorProps {
  vaultId: string;
}

export function STARStoryGenerator({ vaultId }: STARStoryGeneratorProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<any>(null);
  const [powerPhrases, setPowerPhrases] = useState<any[]>([]);
  const [competency, setCompetency] = useState('');
  const [story, setStory] = useState<STARStory | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPowerPhrases = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', vaultId)
        .order('impact_metrics', { ascending: false });

      if (data) setPowerPhrases(data);
    };
    
    fetchPowerPhrases();
  }, [vaultId]);

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
      const { data, error } = await supabase.functions.invoke('generate-star-story', {
        body: {
          powerPhrase: selectedPhrase.power_phrase,
          impactMetrics: selectedPhrase.impact_metrics,
          competency,
          vaultId
        }
      });

      if (error) throw error;

      setStory(data);
      
      toast({
        title: "STAR Story Generated",
        description: "Story created successfully"
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
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
          <div className="p-3 bg-muted rounded-lg">
            <Badge variant="secondary" className="mb-2">{selectedPhrase.category}</Badge>
            <p className="text-sm font-medium">{selectedPhrase.power_phrase}</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedPhrase.impact_metrics}</p>
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
