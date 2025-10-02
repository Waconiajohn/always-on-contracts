import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Search, Bookmark, TrendingUp } from "lucide-react";
import { useState } from "react";

const JobSearchAgentContent = () => {
  const [activeSearch, setActiveSearch] = useState("search1");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Search Agent</h1>
          <p className="text-muted-foreground">Let AI help you find the perfect opportunities</p>
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
                    👋 Hi! I'm your job search assistant. I can help you find opportunities that match your skills and preferences.
                  </p>
                  <p className="text-sm mt-2">
                    Try asking me to:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Search for specific job titles</li>
                    <li>Find remote positions</li>
                    <li>Filter by location or salary</li>
                    <li>Compare similar roles</li>
                  </ul>
                </div>

                {/* Placeholder for chat messages */}
                <div className="text-center text-muted-foreground text-sm py-8">
                  Chat functionality coming soon...
                </div>
              </div>
            </ScrollArea>
          </Card>

          {/* Right: Search Results Workspace */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeSearch} onValueChange={setActiveSearch} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search1" className="gap-2">
                  <Search className="h-4 w-4" />
                  Latest Search
                </TabsTrigger>
                <TabsTrigger value="saved" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search1" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Start a search to see results here</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <Bookmark className="h-16 w-16 mx-auto mb-4 opacity-50" />
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
