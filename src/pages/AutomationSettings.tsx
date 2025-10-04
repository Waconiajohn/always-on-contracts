import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppNav } from '@/components/AppNav';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const AutomationSettingsContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [matchThresholdQueue, setMatchThresholdQueue] = useState(70);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setAutomationEnabled(profile.automation_enabled || false);
        setMatchThresholdQueue(profile.match_threshold_queue || 70);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load automation settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        automation_enabled: automationEnabled,
        match_threshold_queue: matchThresholdQueue,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Settings className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Automation Settings</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Configure how the system searches for and matches contract opportunities
          </p>
        </div>

        {/* Enable Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Daily Job Matching</CardTitle>
            <CardDescription>
              Enable automated job search and matching (runs daily)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="automation-enabled" className="text-base font-semibold">
                  Enable Automated Job Search
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will search for new career opportunities daily and match them to your profile
                </p>
              </div>
              <Switch
                id="automation-enabled"
                checked={automationEnabled}
                onCheckedChange={setAutomationEnabled}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>How it works:</strong> The system searches 50+ job boards daily, filters for opportunities 
                matching your preferences (permanent, contract, and contract-to-hire), and adds high-quality matches to your Opportunities page. You maintain full 
                control over which opportunities to pursue.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Match Score Threshold */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Match Quality Filter</CardTitle>
            <CardDescription>
              Set the minimum match score for opportunities to appear in your feed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold" className="text-base font-semibold">
                  Minimum Match Score
                </Label>
                <span className="text-2xl font-bold text-primary">{matchThresholdQueue}%</span>
              </div>
              <Input
                id="threshold"
                type="range"
                min="0"
                max="100"
                step="5"
                value={matchThresholdQueue}
                onChange={(e) => setMatchThresholdQueue(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Only jobs scoring {matchThresholdQueue}% or higher will be shown. Higher scores indicate better alignment 
                with your skills, experience, and job preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Future Features Notice */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription>
              Additional automation features in development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
              <p className="text-base text-muted-foreground">
                <strong>Auto-Application:</strong> Automatically submit applications for high-match opportunities
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
              <p className="text-base text-muted-foreground">
                <strong>Email Notifications:</strong> Get alerted when new high-quality matches are found
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
              <p className="text-base text-muted-foreground">
                <strong>Application Tracking:</strong> Monitor submitted applications and follow-up automatically
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

const AutomationSettings = () => {
  return (
    <ProtectedRoute>
      <AutomationSettingsContent />
    </ProtectedRoute>
  );
};

export default AutomationSettings;