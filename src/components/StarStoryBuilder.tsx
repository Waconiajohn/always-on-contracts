import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GenerateStarStorySchema,
  safeValidateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  skills: any;
  metrics: any;
  industry: string | null;
  timeframe: string | null;
}

export function StarStoryBuilder() {
  const [stories, setStories] = useState<StarStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [editingStory, setEditingStory] = useState<Partial<StarStory>>({
    title: "",
    situation: "",
    task: "",
    action: "",
    result: "",
    skills: [],
    industry: "",
    timeframe: ""
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('star_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories((data || []) as StarStory[]);
    } catch (error) {
      logger.error('Error fetching stories', error);
      toast.error("Failed to load STAR stories");
    }
  };

  const generateFromRaw = async () => {
    if (!rawInput.trim()) {
      toast.error("Please enter an achievement description");
      return;
    }

    setIsGenerating(true);
    try {
      const validation = safeValidateInput(GenerateStarStorySchema, {
        rawStory: rawInput,
        action: 'generate'
      });

      if (!validation.success) {
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'generate-star-story',
        validation.data
      );

      if (error) return;

      setEditingStory(data.starStory);
      setRawInput("");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = async () => {
    if (!editingStory.title || !editingStory.situation || !editingStory.task || 
        !editingStory.action || !editingStory.result) {
      toast.error("Please fill in all STAR components");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('star_stories')
        .insert([{
          user_id: user.id,
          title: editingStory.title!,
          situation: editingStory.situation!,
          task: editingStory.task!,
          action: editingStory.action!,
          result: editingStory.result!,
          skills: editingStory.skills || [],
          metrics: editingStory.metrics || {},
          industry: editingStory.industry || null,
          timeframe: editingStory.timeframe || null
        }]);

      if (error) throw error;

      toast.success("STAR story saved successfully!");
      setEditingStory({
        title: "",
        situation: "",
        task: "",
        action: "",
        result: "",
        skills: [],
        industry: "",
        timeframe: ""
      });
      fetchStories();
    } catch (error) {
      logger.error('Error saving story', error);
      toast.error("Failed to save STAR story");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('star_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Story deleted");
      fetchStories();
    } catch (error) {
      logger.error('Error deleting story', error);
      toast.error("Failed to delete story");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create">Create Story</TabsTrigger>
          <TabsTrigger value="library">My Stories ({stories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate from Achievement</CardTitle>
              <CardDescription>
                Describe an achievement and let AI structure it using the STAR method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Example: Led a digital transformation project that increased operational efficiency by 35% and reduced costs by $2M annually..."
                className="min-h-[120px]"
              />
              <Button onClick={generateFromRaw} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate STAR Story
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>STAR Story Components</CardTitle>
              <CardDescription>
                Review and edit the generated story or create one manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingStory.title}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                  placeholder="Brief, compelling title"
                />
              </div>

              <div>
                <Label htmlFor="situation">Situation</Label>
                <Textarea
                  id="situation"
                  value={editingStory.situation}
                  onChange={(e) => setEditingStory({ ...editingStory, situation: e.target.value })}
                  placeholder="Context and background..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="task">Task</Label>
                <Textarea
                  id="task"
                  value={editingStory.task}
                  onChange={(e) => setEditingStory({ ...editingStory, task: e.target.value })}
                  placeholder="What needed to be accomplished..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Textarea
                  id="action"
                  value={editingStory.action}
                  onChange={(e) => setEditingStory({ ...editingStory, action: e.target.value })}
                  placeholder="Specific actions taken..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="result">Result</Label>
                <Textarea
                  id="result"
                  value={editingStory.result}
                  onChange={(e) => setEditingStory({ ...editingStory, result: e.target.value })}
                  placeholder="Quantifiable outcomes and impact..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={editingStory.industry ?? ''}
                    onChange={(e) => setEditingStory({ ...editingStory, industry: e.target.value })}
                    placeholder="e.g., SaaS, Manufacturing"
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Input
                    id="timeframe"
                    value={editingStory.timeframe ?? ''}
                    onChange={(e) => setEditingStory({ ...editingStory, timeframe: e.target.value })}
                    placeholder="e.g., 2020-2022"
                  />
                </div>
              </div>

              <Button onClick={saveStory} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Save STAR Story
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <div className="space-y-4">
            {stories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No STAR stories yet. Create your first one to get started!
                </CardContent>
              </Card>
            ) : (
              stories.map((story) => (
                <Card key={story.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          {story.industry && (
                            <Badge variant="secondary">{story.industry}</Badge>
                          )}
                          {story.timeframe && (
                            <Badge variant="outline">{story.timeframe}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Situation</p>
                      <p className="text-sm">{story.situation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Task</p>
                      <p className="text-sm">{story.task}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Action</p>
                      <p className="text-sm">{story.action}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Result</p>
                      <p className="text-sm">{story.result}</p>
                    </div>
                    {story.skills && Array.isArray(story.skills) && story.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {story.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
