import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, Clock } from "lucide-react";
import { SubscriptionGate } from "./SubscriptionGate";

export const AIMatchingPreferences = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    enabled: true,
    target_roles: [] as string[],
    target_industries: [] as string[],
    preferred_locations: [] as string[],
    min_salary: null as number | null,
    max_salary: null as number | null,
    remote_preference: 'any' as string,
    email_frequency: 'weekly' as string,
    last_match_run: null as string | null
  });
  const [stats, setStats] = useState({
    total_matches: 0,
    avg_score: 0,
    acceptance_rate: 0
  });

  useEffect(() => {
    fetchPreferences();
    fetchStats();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          enabled: data.enabled ?? true,
          target_roles: data.target_roles || [],
          target_industries: data.target_industries || [],
          preferred_locations: data.preferred_locations || [],
          min_salary: data.min_salary,
          max_salary: data.max_salary,
          remote_preference: data.remote_preference || 'any',
          email_frequency: data.email_frequency || 'weekly',
          last_match_run: data.last_match_run
        });
      } else {
        // Load defaults from Career Vault
        const { data: vault } = await supabase
          .from('career_vault')
          .select('target_roles, target_industries')
          .eq('user_id', user.id)
          .single();

        if (vault) {
          setPreferences(prev => ({
            ...prev,
            target_roles: vault.target_roles || [],
            target_industries: vault.target_industries || []
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load AI matching preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total matches this month
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: matches, error: matchesError } = await supabase
        .from('opportunity_matches')
        .select('match_score, status')
        .eq('user_id', user.id)
        .eq('source', 'ai_suggestion')
        .gte('created_at', thirtyDaysAgo);

      if (matchesError) throw matchesError;

      // Get feedback for acceptance rate
      const { data: feedback, error: feedbackError } = await supabase
        .from('ai_match_feedback')
        .select('action')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo);

      if (feedbackError) throw feedbackError;

      const totalMatches = matches?.length || 0;
      const avgScore = totalMatches > 0
        ? Math.round(matches.reduce((sum, m) => sum + (m.match_score || 0), 0) / totalMatches)
        : 0;
      
      const addedCount = feedback?.filter(f => f.action === 'added').length || 0;
      const acceptanceRate = feedback && feedback.length > 0
        ? Math.round((addedCount / feedback.length) * 100)
        : 0;

      setStats({
        total_matches: totalMatches,
        avg_score: avgScore,
        acceptance_rate: acceptanceRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_ai_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI matching preferences saved successfully"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubscriptionGate featureName="AI Job Matching" requiredTier="concierge_elite">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Job Matching Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure how our AI discovers and recommends opportunities for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_matches}</div>
              <div className="text-xs text-muted-foreground">Matches This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.avg_score}%</div>
              <div className="text-xs text-muted-foreground">Avg Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.acceptance_rate}%</div>
              <div className="text-xs text-muted-foreground">Acceptance Rate</div>
            </div>
          </div>

          {/* Last Run */}
          {preferences.last_match_run && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last match run: {new Date(preferences.last_match_run).toLocaleString()}
            </div>
          )}

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Enable AI Job Matching</Label>
              <div className="text-sm text-muted-foreground">
                Automatically discover opportunities that match your Career Vault
              </div>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {/* Target Roles */}
          <div className="space-y-2">
            <Label>Target Roles</Label>
            <Input
              placeholder="e.g., Senior Operations Manager, Project Manager"
              value={preferences.target_roles.join(', ')}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                target_roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of roles to prioritize
            </p>
          </div>

          {/* Target Industries */}
          <div className="space-y-2">
            <Label>Target Industries</Label>
            <Input
              placeholder="e.g., Technology, Healthcare, Finance"
              value={preferences.target_industries.join(', ')}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                target_industries: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
              }))}
            />
          </div>

          {/* Location Preferences */}
          <div className="space-y-2">
            <Label>Preferred Locations</Label>
            <Input
              placeholder="e.g., Minneapolis, Remote, Chicago"
              value={preferences.preferred_locations.join(', ')}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                preferred_locations: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              }))}
            />
          </div>

          {/* Remote Preference */}
          <div className="space-y-2">
            <Label>Remote Work Preference</Label>
            <Select
              value={preferences.remote_preference}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, remote_preference: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any (Remote, Hybrid, Onsite)</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="hybrid">Hybrid Preferred</SelectItem>
                <SelectItem value="onsite">Onsite Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Salary ($/hr)</Label>
              <Input
                type="number"
                placeholder="e.g., 75"
                value={preferences.min_salary || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  min_salary: e.target.value ? parseInt(e.target.value) : null
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Salary ($/hr)</Label>
              <Input
                type="number"
                placeholder="e.g., 150"
                value={preferences.max_salary || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  max_salary: e.target.value ? parseInt(e.target.value) : null
                }))}
              />
            </div>
          </div>

          {/* Email Frequency */}
          <div className="space-y-2">
            <Label>Email Notifications</Label>
            <Select
              value={preferences.email_frequency}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, email_frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off - No Emails</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="daily">Daily Updates</SelectItem>
                <SelectItem value="instant">Instant Alerts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Get notified when we find high-quality matches
            </p>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </SubscriptionGate>
  );
};