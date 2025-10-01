import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AutomationSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationMode, setAutomationMode] = useState<"auto" | "queue" | "notify">("queue");
  const [matchThresholdAutoApply, setMatchThresholdAutoApply] = useState(90);
  const [matchThresholdQueue, setMatchThresholdQueue] = useState(70);
  const [maxDailyApplications, setMaxDailyApplications] = useState(5);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setAutomationEnabled(data.automation_enabled || false);
        setAutomationMode((data.automation_mode as "auto" | "queue" | "notify") || "queue");
        setMatchThresholdAutoApply(data.match_threshold_auto_apply || 90);
        setMatchThresholdQueue(data.match_threshold_queue || 70);
        setMaxDailyApplications(data.max_daily_applications || 5);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load automation settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        automation_enabled: automationEnabled,
        automation_mode: automationMode,
        match_threshold_auto_apply: matchThresholdAutoApply,
        match_threshold_queue: matchThresholdQueue,
        max_daily_applications: maxDailyApplications,
        automation_activated_at: automationEnabled ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation settings saved successfully!",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automation Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure how the system automatically finds and applies to opportunities on your behalf
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Master Automation Control</CardTitle>
            <CardDescription>
              Enable or disable the entire automation system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="automation-enabled">Enable Automation</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will automatically process job matches
                </p>
              </div>
              <Switch
                id="automation-enabled"
                checked={automationEnabled}
                onCheckedChange={setAutomationEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {automationEnabled && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Automation Mode</CardTitle>
                <CardDescription>
                  Choose how you want the system to handle high-quality matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={automationMode} onValueChange={(value) => setAutomationMode(value as "auto" | "queue" | "notify")}>
                  <div className="flex items-start space-x-3 space-y-0 mb-4">
                    <RadioGroupItem value="auto" id="auto" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="auto" className="font-semibold">
                        Fully Automatic
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically apply to matches above the auto-apply threshold. You'll receive daily reports.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 mb-4">
                    <RadioGroupItem value="queue" id="queue" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="queue" className="font-semibold">
                        Queue for Approval (Recommended)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        High-quality matches are queued for your review. You approve before applying.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value="notify" id="notify" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="notify" className="font-semibold">
                        Notify Only
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about matches but take no automatic action.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {automationMode !== "notify" && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Score Thresholds</CardTitle>
                  <CardDescription>
                    Set minimum match scores for different automation actions (0-100%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {automationMode === "auto" && (
                    <div className="space-y-2">
                      <Label htmlFor="auto-apply-threshold">
                        Auto-Apply Threshold: {matchThresholdAutoApply}%
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically apply to matches scoring at or above this level
                      </p>
                      <Input
                        id="auto-apply-threshold"
                        type="number"
                        min="0"
                        max="100"
                        value={matchThresholdAutoApply}
                        onChange={(e) => setMatchThresholdAutoApply(Number(e.target.value))}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="queue-threshold">
                      {automationMode === "auto" ? "Queue" : "Minimum Match"} Threshold: {matchThresholdQueue}%
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {automationMode === "auto" 
                        ? "Queue matches between this level and auto-apply threshold for review"
                        : "Only queue matches scoring at or above this level"
                      }
                    </p>
                    <Input
                      id="queue-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={matchThresholdQueue}
                      onChange={(e) => setMatchThresholdQueue(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Application Limits</CardTitle>
                <CardDescription>
                  Set daily limits to maintain quality and avoid overwhelming yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="max-daily">
                    Maximum Daily Applications: {maxDailyApplications}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    The system will not exceed this number of applications per day
                  </p>
                  <Input
                    id="max-daily"
                    type="number"
                    min="1"
                    max="50"
                    value={maxDailyApplications}
                    onChange={(e) => setMaxDailyApplications(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}