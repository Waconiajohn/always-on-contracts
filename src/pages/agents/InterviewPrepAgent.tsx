import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Target, Brain, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const InterviewPrepAgentContent = () => {
  const [activeTab, setActiveTab] = useState("practice");
  const [warChestData, setWarChestData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWarChestData();
  }, []);

  const fetchWarChestData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select(`
        *,
        war_chest_power_phrases(*),
        war_chest_transferable_skills(*),
        war_chest_hidden_competencies(*)
      `)
      .eq('user_id', user.id)
      .single();

    setWarChestData(warChest);
    setLoading(false);
  };

  const generateInterviewQuestion = async () => {
    if (!warChestData) return;

    toast({ title: "Generating interview question..." });

    const { data, error } = await supabase.functions.invoke('generate-interview-question', {
      body: {
        warChestId: warChestData.id,
        phase: 'interview_prep'
      }
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCurrentQuestion(data.question);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Interview Prep Agent</h1>
          <p className="text-muted-foreground">Practice discussing your War Chest competencies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: War Chest Reference */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your Talking Points</h2>
                <p className="text-sm text-muted-foreground">From War Chest</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !warChestData ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No War Chest yet</p>
                  <Button onClick={() => window.location.href = '/agents/corporate-assistant'}>
                    Build Your War Chest
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
                      {warChestData.war_chest_hidden_competencies?.map((comp: any) => (
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
                      {warChestData.war_chest_transferable_skills?.slice(0, 5).map((skill: any) => (
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="practice" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="scenarios" className="gap-2">
                  <Target className="h-4 w-4" />
                  Scenarios
                </TabsTrigger>
                <TabsTrigger value="tips" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="mt-4 space-y-4">
                <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
                  {currentQuestion ? (
                    <div>
                      <Badge className="mb-3">Interview Question</Badge>
                      <p className="text-lg">{currentQuestion}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">Generate a practice question based on your War Chest</p>
                      <Button onClick={generateInterviewQuestion} disabled={!warChestData}>
                        Generate Question
                      </Button>
                    </div>
                  )}
                </div>

                {currentQuestion && (
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">💡 How to Answer</h3>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                        <li>• Reference specific achievements from your War Chest</li>
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

              <TabsContent value="scenarios" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Technical Deep-Dive</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice explaining complex technical concepts using examples from your War Chest
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Leadership & Impact</h3>
                      <p className="text-sm text-muted-foreground">
                        Discuss how your hidden competencies demonstrate leadership potential
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Transferable Skills</h3>
                      <p className="text-sm text-muted-foreground">
                        Explain how your experience in one domain applies to another
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tips" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                      <h3 className="font-semibold mb-2">🎯 Leverage Hidden Competencies</h3>
                      <p className="text-sm">
                        Even without formal certification, you can discuss practical experience. 
                        Example: "While I'm not Six Sigma certified, I spent 6 months in Japan learning 
                        Kaizen directly from its creators..."
                      </p>
                    </div>
                    <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded">
                      <h3 className="font-semibold mb-2">🔄 Translate Technical Skills</h3>
                      <p className="text-sm">
                        Connect past experience to new technologies. Example: "My Salesforce experience 
                        translates directly to Zoho - both require workflow automation, custom objects, 
                        and reporting dashboards..."
                      </p>
                    </div>
                    <div className="p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded">
                      <h3 className="font-semibold mb-2">📊 Quantify Everything</h3>
                      <p className="text-sm">
                        Use metrics from your power phrases. Numbers make impact memorable and credible.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
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
