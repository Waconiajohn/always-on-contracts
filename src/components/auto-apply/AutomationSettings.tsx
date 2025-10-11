import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutomationSettingsProps {
  onSettingsChange?: (settings: AutomationConfig) => void;
}

export interface AutomationConfig {
  enabled: boolean;
  match_threshold: number;
  max_daily_applications: number;
  auto_customize_resume: boolean;
  require_manual_review: boolean;
}

export const AutomationSettings = ({ onSettingsChange }: AutomationSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AutomationConfig>({
    enabled: false,
    match_threshold: 85,
    max_daily_applications: 10,
    auto_customize_resume: true,
    require_manual_review: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('automation_enabled, match_threshold_auto_apply, max_daily_applications')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          enabled: data.automation_enabled || false,
          match_threshold: data.match_threshold_auto_apply || 85,
          max_daily_applications: data.max_daily_applications || 10,
          auto_customize_resume: true,
          require_manual_review: true
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          automation_enabled: config.enabled,
          match_threshold_auto_apply: config.match_threshold,
          max_daily_applications: config.max_daily_applications,
          automation_activated_at: config.enabled ? new Date().toISOString() : null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: config.enabled 
          ? "Auto-apply automation is now active"
          : "Auto-apply automation is paused"
      });

      onSettingsChange?.(config);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to update automation settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<AutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Automation Settings</CardTitle>
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Active" : "Paused"}
          </Badge>
        </div>
        <CardDescription>
          Configure how the auto-apply agent finds and applies to opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="automation-enabled" className="text-base font-semibold">
              Enable Auto-Apply
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically apply to qualified positions that match your criteria
            </p>
          </div>
          <Switch
            id="automation-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig({ enabled: checked })}
          />
        </div>

        {/* Match Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Minimum Match Score</Label>
            <Badge variant="outline">{config.match_threshold}%</Badge>
          </div>
          <Slider
            value={[config.match_threshold]}
            onValueChange={([value]) => updateConfig({ match_threshold: value })}
            min={70}
            max={95}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Only apply to jobs with at least {config.match_threshold}% match to your profile
          </p>
        </div>

        {/* Daily Application Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Daily Application Limit</Label>
            <Badge variant="outline">{config.max_daily_applications} apps/day</Badge>
          </div>
          <Slider
            value={[config.max_daily_applications]}
            onValueChange={([value]) => updateConfig({ max_daily_applications: value })}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of automated applications per day
          </p>
        </div>

        {/* Additional Options */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-customize" className="text-sm font-semibold">
                Auto-Customize Resume
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically tailor resume for each application
              </p>
            </div>
            <Switch
              id="auto-customize"
              checked={config.auto_customize_resume}
              onCheckedChange={(checked) => updateConfig({ auto_customize_resume: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="manual-review" className="text-sm font-semibold">
                Require Manual Review
              </Label>
              <p className="text-xs text-muted-foreground">
                Add to queue for your approval before submitting
              </p>
            </div>
            <Switch
              id="manual-review"
              checked={config.require_manual_review}
              onCheckedChange={(checked) => updateConfig({ require_manual_review: checked })}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button 
            variant="outline"
            onClick={loadSettings}
          >
            Reset
          </Button>
        </div>

        {/* Warning for High Volume */}
        {config.enabled && config.max_daily_applications > 25 && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-600 dark:text-orange-400">
              ⚠️ High application volume may affect quality. Consider lowering the daily limit for better results.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
