import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Eye, MessageCircle, Lightbulb } from "lucide-react";

export function PanelInterviewGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Panel Interview Dynamics
          </CardTitle>
          <CardDescription>
            Understanding multi-interviewer scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Panel interviews involve multiple interviewers (typically 2-6 people) evaluating you simultaneously. 
            Each panelist brings a different perspective - technical, cultural, leadership - and may ask questions 
            from their unique vantage point.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Eye className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Multiple Perspectives</p>
                <p className="text-xs text-muted-foreground">
                  HR focuses on culture fit, tech leads assess skills, managers evaluate leadership potential
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Rotating Questions</p>
                <p className="text-xs text-muted-foreground">
                  Panelists may build on each other's questions or explore different angles of the same topic
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Preparation Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <p className="text-sm font-medium mb-1">Research All Panelists</p>
                <p className="text-xs text-muted-foreground">
                  Check LinkedIn profiles, company bios. Understand each person's role and expertise.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <p className="text-sm font-medium mb-1">Prepare Broader Topics</p>
                <p className="text-xs text-muted-foreground">
                  Expect questions on leadership, collaboration, conflict resolution, technical depth, and culture fit.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p className="text-sm font-medium mb-1">Practice Multi-Perspective Follow-ups</p>
                <p className="text-xs text-muted-foreground">
                  One panelist may dive technical, another may ask "How would your team describe your approach?"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <p className="text-sm font-medium mb-1">Keep Answers Concise</p>
                <p className="text-xs text-muted-foreground">
                  With multiple people, time is limited. Be clear, specific, and inclusive in your responses.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <div>
                <p className="text-sm font-medium mb-1">Questions for Each Panelist</p>
                <p className="text-xs text-muted-foreground">
                  Prepare 1-2 role-specific questions for different panelists (e.g., ask CTO about tech strategy, ask HR about team culture).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded">
              <h4 className="font-semibold text-sm mb-2">👁️ Eye Contact Distribution</h4>
              <p className="text-xs text-muted-foreground">
                Make eye contact with the person asking the question, but scan the group periodically. 
                Don't neglect the "quiet" panelists—they're evaluating too.
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded">
              <h4 className="font-semibold text-sm mb-2">🎯 Address Everyone</h4>
              <p className="text-xs text-muted-foreground">
                When answering, acknowledge the asker but deliver to the group. 
                Example: "That's a great question about our CI/CD approach [to asker]. 
                From my experience [to group]..."
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded">
              <h4 className="font-semibold text-sm mb-2">📝 Take Notes</h4>
              <p className="text-xs text-muted-foreground">
                It's OK to jot down names/questions during intro rounds. Shows you're engaged and helps you 
                tailor follow-up questions to each panelist.
              </p>
            </div>
            <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded">
              <h4 className="font-semibold text-sm mb-2">🤝 Manage Disagreements</h4>
              <p className="text-xs text-muted-foreground">
                If panelists seem to have differing views, acknowledge both perspectives diplomatically. 
                Example: "I understand there are multiple approaches here, and I've seen success with..."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
