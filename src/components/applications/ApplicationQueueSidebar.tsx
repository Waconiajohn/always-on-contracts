import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, MessageSquare, Database } from "lucide-react";

export const ApplicationQueueSidebar = () => {
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-full border-r bg-muted/30">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
          <Button 
            onClick={() => navigate('/job-search')} 
            className="w-full justify-start"
          >
            <Search className="h-4 w-4 mr-2" />
            Find More Jobs
          </Button>
        </div>

        {/* Related Tools */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Related Tools</h3>
          
          {/* Resume Builder Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 bg-card"
            onClick={() => navigate('/agents/resume-builder')}
          >
            <CardHeader className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Resume Builder</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Create tailored resumes for each application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Interview Prep Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 bg-card"
            onClick={() => navigate('/interview-prep')}
          >
            <CardHeader className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Interview Prep</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Prepare for upcoming interviews
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Master Resume Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 bg-card"
            onClick={() => navigate('/master-resume')}
          >
            <CardHeader className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shrink-0">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Master Resume</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Update your profile for better AI matches
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};
