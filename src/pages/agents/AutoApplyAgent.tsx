import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Settings, Play, Pause } from "lucide-react";

export default function AutoApplyAgent() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">Auto-Apply Agent</h1>
          <Badge variant="outline">MCP-Powered</Badge>
        </div>
        <p className="text-muted-foreground">Automated job application submission with intelligent form-filling</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Automation Status</CardTitle>
            <CardDescription>Configure and monitor automated applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Automation Status</h3>
                  <p className="text-sm text-muted-foreground">Currently inactive - Configure settings to begin</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Applications Submitted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">—</div>
                    <p className="text-xs text-muted-foreground mt-1">No data yet</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Queue Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Pending applications</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Intelligent form field detection and auto-fill</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Resume customization per application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Cover letter generation and submission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Application tracking and follow-up reminders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Error handling and manual review queue</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1" disabled>
                  <Play className="mr-2 h-4 w-4" />
                  Start Automation
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Automation
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Full automation capabilities coming soon. Visit Application Queue for manual application management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}