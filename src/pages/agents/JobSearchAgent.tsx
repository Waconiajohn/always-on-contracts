import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookmarkCheck, TrendingUp, Brain, AlertTriangle, FileText, BookmarkPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const JobSearchAgentContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("search");
  const [useTransferableSkills, setUseTransferableSkills] = useState(false);
  const [warChestStats, setWarChestStats] = useState<any>(null);

  useEffect(() => {
    fetchWarChestStats();
  }, []);

  const fetchWarChestStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('total_transferable_skills')
      .eq('user_id', user.id)
      .single();

    setWarChestStats(warChest);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Search Agent</h1>
          <p className="text-muted-foreground">War Chest-powered job discovery</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left: AI Chat Interface */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Search Assistant</h2>
                <p className="text-sm text-muted-foreground">Your AI job finder</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-100px)]">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    📋 Search powered by your War Chest:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Find matching opportunities</li>
                    <li>Filter by location, rate, skills</li>
                    <li>Save interesting positions</li>
                    <li>Track market trends</li>
                    <li>Get personalized recommendations</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Advanced Search Options</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="transferable-skills" className="text-xs">
                        Include Transferable Skills
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Search outside your industry (use as last resort)
                      </p>
                      {warChestStats && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {warChestStats.total_transferable_skills} skills available
                        </Badge>
                      )}
                    </div>
                    <Switch 
                      id="transferable-skills"
                      checked={useTransferableSkills}
                      onCheckedChange={setUseTransferableSkills}
                    />
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Companies prefer hiring within their industry. Enable only if limited options.
                  </p>
                </div>

                <div className="text-center text-muted-foreground text-sm py-4">
                  Search functionality coming soon...
                </div>
              </div>
            </ScrollArea>
          </Card>

          {/* Right: Search Results Workspace */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-4 w-4" />
                  Latest Search
                </TabsTrigger>
                <TabsTrigger value="saved" className="gap-2">
                  <BookmarkCheck className="h-4 w-4" />
                  Saved
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="space-y-4">
                    {/* Example job card - will be replaced with real results */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Senior Software Engineer</h3>
                          <p className="text-sm text-muted-foreground">Tech Corp • San Francisco, CA</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate('/agents/resume-builder')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Apply
                        </Button>
                      </div>
                      <p className="text-sm">
                        Looking for an experienced engineer to join our team building scalable cloud infrastructure...
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <BookmarkPlus className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center text-muted-foreground py-8">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">More results will appear here after search</p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <BookmarkCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Your saved jobs will appear here</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="trending" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Trending opportunities in your field</p>
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

export default function JobSearchAgent() {
  return (
    <ProtectedRoute>
      <JobSearchAgentContent />
    </ProtectedRoute>
  );
}
