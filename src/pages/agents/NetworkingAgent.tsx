import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Network, Users, Calendar, MessageSquare, Sparkles, Copy, Check } from "lucide-react";
import { usePersonaRecommendation } from "@/hooks/usePersonaRecommendation";
import { PersonaSelector } from "@/components/PersonaSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkingContacts } from "@/hooks/useNetworkingContacts";
import { ReferralPathwayVisualizer } from "@/components/networking/ReferralPathwayVisualizer";

export default function NetworkingAgent() {
  const { contacts } = useNetworkingContacts();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  const { 
    recommendation, 
    loading: recommendationLoading, 
    getRecommendation 
  } = usePersonaRecommendation('networking');

  const handleGetRecommendation = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to get persona recommendations",
        variant: "destructive"
      });
      return;
    }
    await getRecommendation(jobDescription);
  };

  const handleGenerateEmail = async () => {
    if (!selectedPersona) {
      toast({
        title: "Select a persona",
        description: "Please select a networking persona first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-networking-email', {
        body: {
          context: jobDescription,
          persona: selectedPersona,
          purpose: 'informational_interview'
        }
      });

      if (error) throw error;

      setGeneratedEmail(data.body);
      toast({
        title: "Email generated",
        description: "Your networking email is ready!"
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Email copied to clipboard"
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy email",
        variant: "destructive"
      });
    }
  };

  const upcomingFollowUps = contacts.filter(c => 
    c.next_follow_up_date && new Date(c.next_follow_up_date) >= new Date()
  ).length;

  const recentInteractions = contacts.filter(c => {
    if (!c.last_contact_date) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(c.last_contact_date) >= thirtyDaysAgo;
  }).length;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">Networking Agent</h1>
          <Badge variant="outline">MCP-Powered</Badge>
        </div>
        <p className="text-muted-foreground">Strategic networking guidance and relationship management</p>
      </div>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contacts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Managed contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Follow-ups Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingFollowUps}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Recent Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recentInteractions}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Networking Assistant</CardTitle>
            <CardDescription>Get personalized networking strategies and outreach messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Role or Company Context
                </label>
                <Textarea
                  placeholder="Describe the role, company, or networking context you're targeting..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleGetRecommendation}
                disabled={recommendationLoading || !jobDescription.trim()}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {recommendationLoading ? "Analyzing..." : "Get Networking Strategy"}
              </Button>
            </div>

            {recommendation && (
              <div className="space-y-6">
                <PersonaSelector
                  personas={recommendation.personas}
                  recommendedPersona={recommendation.recommendedPersona}
                  reasoning={recommendation.reasoning}
                  confidence={recommendation.confidence}
                  selectedPersona={selectedPersona}
                  onSelectPersona={setSelectedPersona}
                  agentType="networking"
                />

                {selectedPersona && (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleGenerateEmail}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isGenerating ? "Generating..." : "Generate Networking Email"}
                    </Button>

                    {generatedEmail && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Your Networking Email</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCopyEmail}
                            >
                              {isCopied ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {isCopied ? "Copied" : "Copy"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                            {generatedEmail}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <ReferralPathwayVisualizer />

        <Card>
          <CardHeader>
            <CardTitle>Networking Features</CardTitle>
            <CardDescription>Strategic relationship building and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Network className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Contact Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Track relationships, interaction history, and follow-up schedules
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">AI Outreach Generator</h3>
                      <p className="text-sm text-muted-foreground">
                        Personalized messages with your selected networking persona
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Follow-up Reminders</h3>
                      <p className="text-sm text-muted-foreground">
                        Automated scheduling and notification system
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Referral Pathways</h3>
                      <p className="text-sm text-muted-foreground">
                        Identify and leverage connections for job opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
