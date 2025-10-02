import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Brain, History, GitCompare } from "lucide-react";
import { useState } from "react";

const ResumeBuilderAgentContent = () => {
  const [activeTab, setActiveTab] = useState("current");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Resume Builder Agent</h1>
          <p className="text-muted-foreground">AI-powered resume optimization and customization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left: AI Coach Interface */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Resume Coach</h2>
                <p className="text-sm text-muted-foreground">Your AI writing assistant</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-100px)]">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    📝 I'm your resume writing coach! I can help you:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Optimize for specific jobs</li>
                    <li>Improve bullet points</li>
                    <li>Add quantifiable achievements</li>
                    <li>Match ATS keywords</li>
                    <li>Compare versions</li>
                  </ul>
                </div>

                <div className="text-center text-muted-foreground text-sm py-8">
                  Chat functionality coming soon...
                </div>
              </div>
            </ScrollArea>
          </Card>

          {/* Right: Resume Versions Workspace */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Current
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2">
                  <GitCompare className="h-4 w-4" />
                  Compare
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Your current resume will appear here</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Resume version history</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compare" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <GitCompare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Compare different resume versions side-by-side</p>
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

export default function ResumeBuilderAgent() {
  return (
    <ProtectedRoute>
      <ResumeBuilderAgentContent />
    </ProtectedRoute>
  );
}
