import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Brain, History, GitCompare, Zap, Target, Plus, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobImportDialog } from "@/components/JobImportDialog";

const ResumeBuilderAgentContent = () => {
  const [activeTab, setActiveTab] = useState("current");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [warChestData, setWarChestData] = useState<any>(null);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
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
      .select('*, war_chest_power_phrases(*), war_chest_transferable_skills(*), war_chest_hidden_competencies(*)')
      .eq('user_id', user.id)
      .single();

    setWarChestData(warChest);
    setLoading(false);
  };

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please enter a job description", variant: "destructive" });
      return;
    }

    toast({ title: "Generating custom resume...", description: "This may take a moment" });
    
    const { data, error } = await supabase.functions.invoke('customize-resume', {
      body: { 
        jobDescription,
        selectedPhrases,
        selectedSkills
      }
    });

    if (error) {
      toast({ title: "Error generating resume", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resume generated!", description: "Your custom resume is ready" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Resume Builder Agent</h1>
          <p className="text-muted-foreground">Build custom resumes from your War Chest</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: War Chest Explorer */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your War Chest</h2>
                <p className="text-sm text-muted-foreground">Select ammunition</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !warChestData ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No War Chest yet</p>
                  <Button onClick={() => window.location.href = '/agents/corporate-assistant'}>
                    Build Your War Chest
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Power Phrases ({warChestData.war_chest_power_phrases?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {warChestData.war_chest_power_phrases?.slice(0, 5).map((phrase: any) => (
                        <div key={phrase.id} className="p-2 bg-muted rounded text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedPhrases(prev => 
                            prev.includes(phrase.id) ? prev.filter(id => id !== phrase.id) : [...prev, phrase.id]
                          )}>
                          <Badge variant={selectedPhrases.includes(phrase.id) ? "default" : "outline"} className="mb-1">
                            {phrase.category}
                          </Badge>
                          <p className="line-clamp-2">{phrase.power_phrase}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Transferable Skills ({warChestData.war_chest_transferable_skills?.length || 0})
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {warChestData.war_chest_transferable_skills?.slice(0, 10).map((skill: any) => (
                        <Badge 
                          key={skill.id} 
                          variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedSkills(prev => 
                            prev.includes(skill.id) ? prev.filter(id => id !== skill.id) : [...prev, skill.id]
                          )}>
                          {skill.stated_skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Hidden Competencies ({warChestData.war_chest_hidden_competencies?.length || 0})
                    </h3>
                    <div className="space-y-1">
                      {warChestData.war_chest_hidden_competencies?.slice(0, 3).map((comp: any) => (
                        <Badge key={comp.id} variant="secondary" className="text-xs">
                          {comp.competency_area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right: Resume Builder Workspace */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Build
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2">
                  <GitCompare className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Job Description</label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Job
                  </Button>
                </div>
                
                {jobTitle && (
                  <div className="p-3 bg-muted rounded-md space-y-1">
                    <p className="text-sm font-semibold">{jobTitle}</p>
                    {companyName && <p className="text-sm text-muted-foreground">{companyName}</p>}
                  </div>
                )}
                
                <Textarea 
                  placeholder="Paste the job description here, or click 'Import Job' to upload from file/URL..."
                  className="min-h-[200px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                
                <Button onClick={handleGenerateResume} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Custom Resume
                </Button>
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedPhrases.length} power phrases, {selectedSkills.length} skills
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Resume versions will appear here</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compare" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Resume preview will appear here</p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <JobImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onJobImported={(jobData) => {
          setJobDescription(jobData.jobDescription);
          setJobTitle(jobData.jobTitle);
          setCompanyName(jobData.companyName || "");
          toast({
            title: "Job Imported",
            description: `Successfully imported: ${jobData.jobTitle}`,
          });
        }}
      />
    </div>
  );
};

export default function ResumeBuilderAgent() {
  return (
    <ProtectedRoute>
      <ResumeBuilderAgentContent />
    </ProtectedRoute>
  );
}