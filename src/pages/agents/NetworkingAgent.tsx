import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Users, Calendar, MessageSquare } from "lucide-react";

export default function NetworkingAgent() {
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
              <div className="text-3xl font-bold">0</div>
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
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
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
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

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
                      <h3 className="font-semibold mb-1">Outreach Templates</h3>
                      <p className="text-sm text-muted-foreground">
                        AI-generated personalized messages for different scenarios
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

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• LinkedIn connection request automation</li>
                    <li>• Relationship strength scoring</li>
                    <li>• Mutual connection discovery</li>
                    <li>• Event networking recommendations</li>
                    <li>• Coffee chat scheduling assistant</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1" disabled>
                  Add Contact
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  View Network Map
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}