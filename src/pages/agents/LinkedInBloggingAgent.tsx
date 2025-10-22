import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, BarChart3, Save, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLinkedInDrafts } from "@/hooks/useLinkedInDrafts";
import type { LinkedInPost, ContentAnalysis } from "@/types/linkedin";
import { WeeklyPostingCalendar } from "@/components/linkedin/WeeklyPostingCalendar";
import { SeriesPlanner } from "@/components/linkedin/SeriesPlanner";
import { HumanWritingAnalyzer } from "@/components/linkedin/HumanWritingAnalyzer";
import { QualityCheckModal } from "@/components/linkedin/QualityCheckModal";
import { SeriesDashboard } from "@/components/linkedin/SeriesDashboard";
import { CharacterCounter } from "@/components/linkedin/CharacterCounter";
import { VaultContentTracker } from "@/components/linkedin/VaultContentTracker";

export default function LinkedInBloggingAgent() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [postType, setPostType] = useState("thought-leadership");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [generatedPost, setGeneratedPost] = useState<LinkedInPost | null>(null);
  const [analysisContent, setAnalysisContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [_editingDraft, _setEditingDraft] = useState<string | null>(null);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [vaultTopics, setVaultTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const { toast } = useToast();
  const { drafts, loading: draftsLoading, deleteDraft, updateDraft, fetchDrafts } = useLinkedInDrafts();

  const postsThisWeek = [
    { day: 'Monday', status: 'published' as const, title: '5 Ways to Position Your Executive Experience' },
    { day: 'Tuesday', status: 'draft' as const, title: 'The Hidden Competency Recruiters Miss' },
    { day: 'Wednesday', status: 'not_started' as const },
    { day: 'Thursday', status: 'not_started' as const },
  ];

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    toast({ 
      title: "Generating weekly posts...", 
      description: "Creating 4 posts from your Career Vault insights" 
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get next Monday-Thursday dates
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const postTopics = [
        "5 ways to position your executive experience in a competitive market",
        "The hidden competency recruiters miss on your resume",
        "How to articulate transferable skills for career transitions",
        "Building a personal brand that attracts executive recruiters"
      ];

      for (let i = 0; i < 4; i++) {
        const scheduledDate = new Date(nextMonday);
        scheduledDate.setDate(nextMonday.getDate() + i);
        scheduledDate.setHours(9, 0, 0, 0); // 9 AM

        const { data: post, error: generateError } = await supabase.functions.invoke('generate-linkedin-post', {
          body: {
            topic: postTopics[i],
            tone: 'professional',
            postType: 'thought-leadership',
            targetAudience: 'executive recruiters and hiring managers',
            keyPoints: []
          }
        });

        if (generateError) throw generateError;

        await supabase.from('linkedin_posts').insert({
          user_id: user.id,
          title: post.title,
          content: post.content,
          hashtags: post.hashtags,
          post_type: post.postType,
          tone: 'professional',
          status: 'draft',
          scheduled_for: scheduledDate.toISOString(),
          engagement_score: parseInt(post.hookStrength) || 0
        });
      }

      toast({ 
        title: "Week scheduled!", 
        description: "4 posts generated and scheduled for next week"
      });
      fetchDrafts();
    } catch (error: any) {
      toast({ 
        title: "Generation failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic for your post", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: {
          topic,
          tone,
          postType,
          targetAudience,
          keyPoints: keyPoints.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      setGeneratedPost(data);
      toast({ title: "Post generated!", description: "Your LinkedIn post is ready" });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisContent.trim()) {
      toast({ title: "Content required", description: "Please paste content to analyze", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-linkedin-post-with-audit', {
        body: { content: analysisContent }
      });

      if (error) throw error;
      setAnalysisResult(data);
      toast({ title: "Analysis complete with dual AI audit!", description: "Check the results below" });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveWithCheck = () => {
    if (!generatedPost) return;
    setEditingContent(generatedPost.content);
    setShowQualityCheck(true);
  };

  const handleSave = async () => {
    if (!generatedPost) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('linkedin_posts').insert({
        user_id: user.id,
        title: generatedPost.title,
        content: generatedPost.content,
        hashtags: generatedPost.hashtags,
        post_type: generatedPost.postType,
        tone: tone,
        status: 'draft',
        engagement_score: parseInt(generatedPost.hookStrength) || 0
      });

      if (error) throw error;
      toast({ title: "Saved!", description: "Post saved to your drafts" });
      setShowQualityCheck(false);
      fetchDrafts();
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (generatedPost?.content) {
      navigator.clipboard.writeText(generatedPost.content);
      toast({ title: "Copied!", description: "Post copied to clipboard" });
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    await deleteDraft(id);
  };

  const handlePublishDraft = async (id: string) => {
    await updateDraft(id, { status: 'published' });
  };

  const handleLoadVaultTopics = async () => {
    setLoadingTopics(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-linkedin-topics-from-vault');

      if (error) throw error;

      if (data.topics && data.topics.length > 0) {
        setVaultTopics(data.topics);
        toast({
          title: "Topics loaded!",
          description: `Found ${data.topics.length} post ideas from your vault`
        });
      } else {
        toast({
          title: "No topics yet",
          description: data.message || "Complete your Career Vault to get topic suggestions",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error loading vault topics:', error);
      toast({
        title: "Failed to load topics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleUseVaultTopic = (topicSuggestion: any) => {
    setTopic(topicSuggestion.topic);
    setPostType(topicSuggestion.angle === 'how-to' || topicSuggestion.angle === 'lessons-learned' ? 'thought-leadership' : 'personal-story');
    toast({
      title: "Topic selected",
      description: "Click 'Generate Post' to create content"
    });
  };

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">LinkedIn Blogging Agent</h1>
            <p className="text-muted-foreground">AI-powered content for thought leadership (M/T/W/Th)</p>
          </div>

          <WeeklyPostingCalendar 
            postsThisWeek={postsThisWeek}
            onGenerateWeek={handleGenerateWeek}
          />

          <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="series">Series Builder</TabsTrigger>
          <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
          <TabsTrigger value="dashboard">My Series</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          {/* Vault Topic Suggestions */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                💡 Topic Ideas from Your Career Vault
              </CardTitle>
              <CardDescription>
                AI analyzes your achievements and suggests engaging LinkedIn post topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vaultTopics.length === 0 ? (
                <Button
                  onClick={handleLoadVaultTopics}
                  disabled={loadingTopics}
                  className="w-full"
                >
                  {loadingTopics ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Topics...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Get Topic Suggestions from Vault</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {vaultTopics.map((topic, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{topic.topic}</h4>
                          <p className="text-sm text-muted-foreground italic mb-2">"{topic.hook}"</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{topic.angle}</Badge>
                            <Badge
                              className={topic.estimatedEngagement === 'high' ? 'bg-green-500' : topic.estimatedEngagement === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}
                            >
                              {topic.estimatedEngagement} engagement
                            </Badge>
                          </div>
                          {topic.reasoning && (
                            <p className="text-xs text-muted-foreground mt-2">💡 {topic.reasoning}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseVaultTopic(topic)}
                        >
                          Use Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVaultTopics([])}
                    className="w-full"
                  >
                    Load New Topics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>Configure your LinkedIn post parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Leadership in AI era, Career pivoting strategies"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="postType">Post Type</Label>
                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thought-leadership">Thought Leadership</SelectItem>
                        <SelectItem value="short-post">Short Post</SelectItem>
                        <SelectItem value="industry-commentary">Industry Commentary</SelectItem>
                        <SelectItem value="personal-story">Personal Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., CTOs, HR Leaders, Job seekers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="keyPoints">Key Points (comma-separated)</Label>
                  <Textarea
                    id="keyPoints"
                    placeholder="e.g., AI adoption challenges, Team alignment, ROI metrics"
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Post
                </Button>
              </CardContent>
            </Card>

            {generatedPost && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{generatedPost.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <Badge>{generatedPost.postType}</Badge>
                        <Badge variant="outline" className="ml-2">Hook: {generatedPost.hookStrength}/10</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSaveWithCheck}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Generated Content</Label>
                      <CharacterCounter current={generatedPost.content.length} max={3000} />
                    </div>
                    <Textarea
                      value={generatedPost.content}
                      onChange={(e) => setGeneratedPost({ ...generatedPost, content: e.target.value })}
                      rows={12}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>
                  
                  <HumanWritingAnalyzer content={generatedPost.content} />

                  {generatedPost.hashtags?.length > 0 && (
                    <div>
                      <Label>Hashtags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {generatedPost.hashtags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Engagement Prediction</Label>
                    <p className="text-sm text-muted-foreground mt-1">{generatedPost.estimatedEngagement}</p>
                  </div>

                  {generatedPost.improvementTips?.length > 0 && (
                    <div>
                      <Label>Improvement Tips</Label>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {generatedPost.improvementTips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="series" className="space-y-6">
          <SeriesPlanner />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <SeriesDashboard />
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paste Your Content</CardTitle>
                <CardDescription>Analyze any LinkedIn post for engagement potential</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your LinkedIn post content here..."
                  value={analysisContent}
                  onChange={(e) => setAnalysisContent(e.target.value)}
                  rows={15}
                />
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                  Analyze Content
                </Button>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <div className="text-3xl font-bold text-primary mt-2">
                    {analysisResult.overallScore}/100
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Hook Strength</Label>
                      <span className="text-sm font-medium">{analysisResult.hookStrength?.score}/25</span>
                    </div>
                    <Progress value={(analysisResult.hookStrength?.score / 25) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">{analysisResult.hookStrength?.feedback}</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Value Density</Label>
                      <span className="text-sm font-medium">{analysisResult.valueDensity?.score}/25</span>
                    </div>
                    <Progress value={(analysisResult.valueDensity?.score / 25) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">{analysisResult.valueDensity?.feedback}</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>Readability</Label>
                      <span className="text-sm font-medium">{analysisResult.readability?.score}/20</span>
                    </div>
                    <Progress value={(analysisResult.readability?.score / 20) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">{analysisResult.readability?.feedback}</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>CTA Effectiveness</Label>
                      <span className="text-sm font-medium">{analysisResult.ctaEffectiveness?.score}/15</span>
                    </div>
                    <Progress value={(analysisResult.ctaEffectiveness?.score / 15) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">{analysisResult.ctaEffectiveness?.feedback}</p>
                  </div>

                  {analysisResult.strengths?.length > 0 && (
                    <div>
                      <Label>Strengths</Label>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {analysisResult.strengths.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.improvements?.length > 0 && (
                    <div>
                      <Label>Improvements</Label>
                      <div className="space-y-2 mt-1">
                        {analysisResult.improvements.map((imp: any, idx: number) => (
                          <div key={idx} className="border-l-2 border-primary pl-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={imp.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {imp.priority}
                              </Badge>
                              <p className="text-sm font-medium">{imp.suggestion}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{imp.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Viral Potential</Label>
                    <Badge className="mt-1" variant={analysisResult.viralPotential === 'high' || analysisResult.viralPotential === 'exceptional' ? 'default' : 'secondary'}>
                      {analysisResult.viralPotential}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Saved Drafts</CardTitle>
              <CardDescription>Access and manage your saved LinkedIn posts</CardDescription>
            </CardHeader>
            <CardContent>
              {draftsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No drafts yet. Generate your first post above!</p>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <Card key={draft.id} className="border-2">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{draft.title || "Untitled Post"}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge>{draft.status}</Badge>
                              {draft.post_type && <Badge variant="outline">{draft.post_type}</Badge>}
                              {draft.engagement_score && <Badge variant="secondary">Score: {draft.engagement_score}</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(draft.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePublishDraft(draft.id)}>
                              Publish
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteDraft(draft.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea value={draft.content} readOnly rows={6} className="font-mono text-sm" />
                        {draft.hashtags && draft.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {draft.hashtags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary">#{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <VaultContentTracker />
        </TabsContent>
      </Tabs>
        </div>
      </div>
      
      <QualityCheckModal
        open={showQualityCheck}
        onOpenChange={setShowQualityCheck}
        content={editingContent}
        onSave={handleSave}
      />
    </div>
  );
}