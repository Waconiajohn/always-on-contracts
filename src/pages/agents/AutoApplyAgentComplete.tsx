import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, Settings, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AutoApplyAgentComplete() {
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(70);
  const [maxDaily, setMaxDaily] = useState(5);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ submitted: 0, queueSize: 0, successRate: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('automation_enabled, match_threshold_queue, max_daily_applications')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setAutomationEnabled(data.automation_enabled || false);
        setMatchThreshold(data.match_threshold_queue || 70);
        setMaxDaily(data.max_daily_applications || 5);
      }
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days applications
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: applications, error } = await supabase
        .from('application_tracking')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      const submitted = applications?.length || 0;
      const successful = applications?.filter(a => a.status === 'applied').length || 0;
      const successRate = submitted > 0 ? Math.round((successful / submitted) * 100) : 0;

      // Get queue size
      const { data: queue, error: queueError } = await supabase
        .from('application_queue')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (queueError) throw queueError;

      setStats({
        submitted,
        successRate,
        queueSize: queue?.length || 0
      });
    } catch (error: any) {
      toast({
        title: "Error loading stats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          automation_enabled: automationEnabled,
          match_threshold_queue: matchThreshold,
          max_daily_applications: maxDaily,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "Settings saved", description: "Automation settings updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">Auto-Apply Agent</h1>
          <Badge variant="outline">MCP-Powered</Badge>
          {automationEnabled && <Badge>Active</Badge>}
        </div>
        <p className="text-muted-foreground">Automated job application submission with intelligent form-filling</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Statistics</CardTitle>
            <CardDescription>Your automation performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Applications Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.submitted}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {stats.successRate}%
                    {stats.successRate > 0 && <TrendingUp className="h-5 w-5 text-green-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully submitted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Queue Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.queueSize}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pending applications</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
            <CardDescription>Configure how the auto-apply agent works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Automation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically apply to jobs that meet your criteria
                </p>
              </div>
              <Switch checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Match Threshold</Label>
                <span className="text-sm font-medium">{matchThreshold}%</span>
              </div>
              <Slider
                value={[matchThreshold]}
                onValueChange={([value]) => setMatchThreshold(value)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Only apply to jobs with a match score above this threshold
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Max Daily Applications</Label>
                <span className="text-sm font-medium">{maxDaily}</span>
              </div>
              <Slider
                value={[maxDaily]}
                onValueChange={([value]) => setMaxDaily(value)}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Limit the number of applications submitted per day
              </p>
            </div>

            <Button onClick={saveSettings} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
