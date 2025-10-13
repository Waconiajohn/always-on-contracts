import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Target, Brain, Lightbulb, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PersonaSelector } from "@/components/PersonaSelector";
import { usePersonaRecommendation } from "@/hooks/usePersonaRecommendation";
import { InterviewFollowupPanel } from "@/components/InterviewFollowupPanel";
import { InterviewResponsesTab } from "@/components/InterviewResponsesTab";
import { JobSelector } from "@/components/interview/JobSelector";
import { AppNav } from "@/components/AppNav";
import { Separator } from "@/components/ui/separator";
import { CompanyResearchPanel } from "@/components/interview/CompanyResearchPanel";
import { ElevatorPitchBuilder } from "@/components/interview/ElevatorPitchBuilder";
import { ThirtyPlanBuilder } from "@/components/interview/ThirtyPlanBuilder";
import { ThreeTwoOneFramework } from "@/components/interview/ThreeTwoOneFramework";
import { PanelInterviewGuide } from "@/components/interview/PanelInterviewGuide";

const InterviewPrepAgentContent = () => {
  const [activeTab, setActiveTab] = useState("select-job");
  const [vaultData, setVaultData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [companyResearch] = useState<any>(null);
  const { toast } = useToast();
  const { recommendation, loading: personaLoading, getRecommendation } = usePersonaRecommendation('interview');

  useEffect(() => {
    fetchVaultData();
  }, []);

  const fetchVaultData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vault } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(*),
        vault_transferable_skills(*),
        vault_hidden_competencies(*)
      `)
      .eq('user_id', user.id)
      .single();

    setVaultData(vault);
    setLoading(false);
  };

  const handleGetRecommendation = () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to get persona recommendations",
        variant: "destructive"
      });
      return;
    }
    getRecommendation(jobDescription);
  };

  const handleJobSelected = (job: any) => {
    setSelectedJob(job);
    setJobDescription(job.job_description || "");
    setActiveTab("practice");
    
    // Create interview prep session
    createPrepSession(job);
    
    toast({
      title: "Job Selected",
      description: `Preparing interview materials for ${job.job_title}`,
    });
  };

  const createPrepSession = async (job: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('interview_prep_sessions')
        .insert({
          user_id: user.id,
          job_project_id: job.id,
          interview_stage: job.interview_stage || 'hr_screen',
          interview_date: job.interview_date || null,
          prep_materials: {
            job_title: job.job_title,
            company_name: job.company_name,
            job_description: job.job_description
          },
          questions_prepared: []
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prep session:', error);
      } else {
        console.log('Prep session created:', data);
      }
    } catch (error) {
      console.error('Error in createPrepSession:', error);
    }
  };

  const generateInterviewQuestion = async () => {
    if (!vaultData) return;

    toast({ title: "Generating interview question..." });

    const { data, error } = await supabase.functions.invoke('generate-interview-question', {
      body: {
        vaultId: vaultData.id,
        phase: 'interview_prep',
        persona: selectedPersona
      }
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCurrentQuestion(data.question);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <AppNav />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Interview Prep Agent</h1>
            <p className="text-muted-foreground">Practice with job-specific materials from your pipeline</p>
          </div>

          {!selectedJob ? (
            <JobSelector onJobSelected={handleJobSelected} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Career Vault Reference */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Selected Job</h2>
                <p className="text-sm text-muted-foreground">{selectedJob.job_title}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Company</p>
                <p className="text-muted-foreground">{selectedJob.company_name}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Interview Stage</p>
                <Badge>{selectedJob.interviewStage}</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedJob(null)}>
                Change Job
              </Button>
            </div>

            <Separator className="my-4" />

            <h3 className="text-sm font-semibold mb-2">Your Talking Points</h3>
            <ScrollArea className="h-[calc(100vh-450px)]">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !vaultData ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No Career Vault yet</p>
                  <Button onClick={() => window.location.href = '/agents/corporate-assistant'}>
                    Build Your Career Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Hidden Competencies
                    </h3>
                    <div className="space-y-2">
                      {vaultData.vault_hidden_competencies?.map((comp: any) => (
                        <div key={comp.id} className="p-3 bg-muted rounded-lg">
                          <Badge variant="secondary" className="mb-2">{comp.competency_area}</Badge>
                          <p className="text-xs text-muted-foreground">{comp.inferred_capability}</p>
                          {comp.certification_equivalent && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              ≈ {comp.certification_equivalent}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Transferable Skills</h3>
                    <div className="space-y-2">
                      {vaultData.vault_transferable_skills?.slice(0, 5).map((skill: any) => (
                        <div key={skill.id} className="p-2 bg-muted rounded text-xs">
                          <p className="font-medium">{skill.stated_skill}</p>
                          <p className="text-muted-foreground mt-1">{skill.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right: Interview Practice */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-8 text-xs">
                <TabsTrigger value="research">Research</TabsTrigger>
                <TabsTrigger value="pitch">Pitch</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="responses">Responses</TabsTrigger>
                <TabsTrigger value="321">3-2-1</TabsTrigger>
                <TabsTrigger value="plan">30-60-90</TabsTrigger>
                <TabsTrigger value="followup">Follow-up</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="research" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <CompanyResearchPanel 
                    companyName={selectedJob.company_name}
                    jobDescription={selectedJob.job_description}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pitch" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {vaultData ? (
                    <ElevatorPitchBuilder 
                      jobDescription={selectedJob.job_description}
                      vaultId={vaultData.id}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Career Vault required
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="321" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {vaultData ? (
                    <ThreeTwoOneFramework 
                      jobDescription={selectedJob.job_description}
                      companyResearch={companyResearch}
                      vaultId={vaultData.id}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Career Vault required
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="plan" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {vaultData ? (
                    <ThirtyPlanBuilder 
                      jobDescription={selectedJob.job_description}
                      companyResearch={companyResearch}
                      vaultId={vaultData.id}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Career Vault required
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="practice" className="mt-4 space-y-4">
                {!recommendation ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium mb-2">Interview Details</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• Job: {selectedJob.job_title}</p>
                        <p>• Stage: {selectedJob.interviewStage}</p>
                        <p>• Resume on file: {selectedJob.resume_version_id ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGetRecommendation} 
                      disabled={personaLoading}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {personaLoading ? "Analyzing..." : "Get Coaching Persona Recommendation"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <PersonaSelector
                      personas={recommendation.personas}
                      recommendedPersona={recommendation.recommendedPersona}
                      reasoning={recommendation.reasoning}
                      confidence={recommendation.confidence}
                      selectedPersona={selectedPersona}
                      onSelectPersona={setSelectedPersona}
                      agentType="interview"
                    />

                    {selectedPersona && (
                      <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
                        {currentQuestion ? (
                          <div>
                            <Badge className="mb-3">Interview Question</Badge>
                            <p className="text-lg">{currentQuestion}</p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4">Generate a practice question based on your Career Vault</p>
                            <Button onClick={generateInterviewQuestion} disabled={!vaultData}>
                              Generate Question
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion && (
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">💡 How to Answer</h3>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                        <li>• Reference specific achievements from your Career Vault</li>
                        <li>• Include quantifiable results when possible</li>
                        <li>• Connect to the hidden competencies identified</li>
                      </ul>
                    </div>
                    <Button onClick={generateInterviewQuestion} variant="outline" className="w-full">
                      Next Question
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="responses" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {currentQuestion && vaultData ? (
                    <InterviewResponsesTab 
                      question={currentQuestion}
                      vaultId={vaultData.id}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Generate a question in the Practice tab first
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="followup" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <InterviewFollowupPanel userId={vaultData?.user_id} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tips" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-6">
                    <PanelInterviewGuide />
                    <div className="space-y-4">
                      <h3 className="font-semibold">General Interview Tips</h3>
                      <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                        <h3 className="font-semibold mb-2">🎯 Leverage Hidden Competencies</h3>
                        <p className="text-sm">
                          Even without formal certification, you can discuss practical experience.
                        </p>
                      </div>
                      <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded">
                        <h3 className="font-semibold mb-2">🔄 Translate Technical Skills</h3>
                        <p className="text-sm">
                          Connect past experience to new technologies.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded">
                        <h3 className="font-semibold mb-2">📊 Quantify Everything</h3>
                        <p className="text-sm">
                          Use metrics from your power phrases.
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InterviewPrepAgent() {
  return (
    <ProtectedRoute>
      <InterviewPrepAgentContent />
    </ProtectedRoute>
  );
}
