import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Save, Target, X, Loader2 } from "lucide-react";

export function GlobalJobPreferences() {
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetPositions, setTargetPositions] = useState<string[]>([]);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [savingGlobal, setSavingGlobal] = useState(false);

  useEffect(() => {
    fetchGlobalPreferences();
  }, []);

  const fetchGlobalPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setTargetIndustries(profile.target_industries || []);
        setTargetPositions(profile.target_positions || []);
        setMinRate(profile.custom_target_rate_min?.toString() || '');
        setMaxRate(profile.custom_target_rate_max?.toString() || '');
      }
    } catch (error: any) {
      console.error('Error fetching global preferences:', error);
    }
  };

  const saveGlobalPreferences = async () => {
    setSavingGlobal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        target_industries: targetIndustries,
        target_positions: targetPositions,
        custom_target_rate_min: minRate ? parseFloat(minRate) : null,
        custom_target_rate_max: maxRate ? parseFloat(maxRate) : null,
        strategy_customized: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Global job preferences saved');
    } catch (error: any) {
      console.error('Error saving global preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSavingGlobal(false);
    }
  };

  const addPosition = () => {
    if (newPosition.trim() && !targetPositions.includes(newPosition.trim())) {
      setTargetPositions([...targetPositions, newPosition.trim()]);
      setNewPosition('');
    }
  };

  const removePosition = (position: string) => {
    setTargetPositions(targetPositions.filter(p => p !== position));
  };

  const addIndustry = () => {
    if (newIndustry.trim() && !targetIndustries.includes(newIndustry.trim())) {
      setTargetIndustries([...targetIndustries, newIndustry.trim()]);
      setNewIndustry('');
    }
  };

  const removeIndustry = (industry: string) => {
    setTargetIndustries(targetIndustries.filter(i => i !== industry));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-2xl">Global Job Preferences</CardTitle>
            <CardDescription>
              These settings apply across all your search profiles
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Positions */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Target Job Titles</Label>
          <div className="flex gap-2">
            <Input
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPosition()}
              placeholder="e.g., Project Manager, Business Analyst"
            />
            <Button onClick={addPosition} size="lg">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {targetPositions.map((position) => (
              <Badge 
                key={position} 
                variant="secondary" 
                className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => removePosition(position)}
              >
                {position} <X className="ml-2 h-4 w-4" />
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Target Industries */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Target Industries</Label>
          <div className="flex gap-2">
            <Input
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
              placeholder="e.g., Healthcare, Finance, Technology"
            />
            <Button onClick={addIndustry} size="lg">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {targetIndustries.map((industry) => (
              <Badge 
                key={industry} 
                variant="secondary" 
                className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => removeIndustry(industry)}
              >
                {industry} <X className="ml-2 h-4 w-4" />
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rate Range */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Hourly Rate Range</Label>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minRate">Minimum Rate ($/hr)</Label>
              <Input
                id="minRate"
                type="number"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
                placeholder="e.g., 75"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRate">Maximum Rate ($/hr)</Label>
              <Input
                id="maxRate"
                type="number"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                placeholder="e.g., 150"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={saveGlobalPreferences} disabled={savingGlobal} size="lg">
            {savingGlobal && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Save className="mr-2 h-5 w-5" />
            Save Global Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
