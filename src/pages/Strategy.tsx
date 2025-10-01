import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, DollarSign, Briefcase, Save, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppNav } from '@/components/AppNav';
import { Separator } from '@/components/ui/separator';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const StrategyContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Job Preferences
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetPositions, setTargetPositions] = useState<string[]>([]);
  const [newIndustry, setNewIndustry] = useState('');
  const [newPosition, setNewPosition] = useState('');
  
  // Rate Expectations
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  
  // Skills & Experience (from resume analysis) - Read only
  const [coreSkills, setCoreSkills] = useState<string[]>([]);
  const [keyAchievements, setKeyAchievements] = useState<string[]>([]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch profile data
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
        setCoreSkills(profile.core_skills || []);
        setKeyAchievements(profile.key_achievements || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load your job preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !targetIndustries.includes(newIndustry.trim())) {
      setTargetIndustries([...targetIndustries, newIndustry.trim()]);
      setNewIndustry('');
    }
  };

  const handleAddPosition = () => {
    if (newPosition.trim() && !targetPositions.includes(newPosition.trim())) {
      setTargetPositions([...targetPositions, newPosition.trim()]);
      setNewPosition('');
    }
  };

  const handleRemoveIndustry = (industry: string) => {
    setTargetIndustries(targetIndustries.filter(i => i !== industry));
  };

  const handleRemovePosition = (position: string) => {
    setTargetPositions(targetPositions.filter(p => p !== position));
  };

  const handleSave = async () => {
    setSaving(true);
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

      toast({
        title: "Success",
        description: "Your job preferences have been saved.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences.",
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
      
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Job Preferences</h1>
          <p className="text-xl text-muted-foreground">
            Configure your contract job search criteria to find the best opportunities
          </p>
        </div>

        {/* Target Positions & Industries */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">What I'm Looking For</CardTitle>
            </div>
            <CardDescription>
              Specify the types of contract positions and industries you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Positions */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Target Job Titles</Label>
              <div className="flex gap-2">
                <Input
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPosition()}
                  placeholder="e.g., Project Manager, Business Analyst"
                  className="text-base"
                />
                <Button onClick={handleAddPosition} size="lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {targetPositions.map((position) => (
                  <Badge 
                    key={position} 
                    variant="secondary" 
                    className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleRemovePosition(position)}
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIndustry()}
                  placeholder="e.g., Healthcare, Finance, Technology"
                  className="text-base"
                />
                <Button onClick={handleAddIndustry} size="lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {targetIndustries.map((industry) => (
                  <Badge 
                    key={industry} 
                    variant="secondary" 
                    className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleRemoveIndustry(industry)}
                  >
                    {industry} <X className="ml-2 h-4 w-4" />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Expectations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Hourly Rate Range</CardTitle>
            </div>
            <CardDescription>
              Set your minimum and maximum acceptable hourly contract rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minRate" className="text-base">Minimum Rate ($/hr)</Label>
                <Input
                  id="minRate"
                  type="number"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  placeholder="e.g., 75"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRate" className="text-base">Maximum Rate ($/hr)</Label>
                <Input
                  id="maxRate"
                  type="number"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  placeholder="e.g., 150"
                  className="text-base"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Jobs outside this range will be filtered out during matching
            </p>
          </CardContent>
        </Card>

        {/* Skills & Experience Summary */}
        {(coreSkills.length > 0 || keyAchievements.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Your Skills & Experience</CardTitle>
              </div>
              <CardDescription>
                Based on your resume analysis (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {coreSkills.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Core Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {coreSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-base px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {keyAchievements.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Key Achievements</Label>
                  <ul className="space-y-2">
                    {keyAchievements.map((achievement, idx) => (
                      <li key={idx} className="text-base text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
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
            <Save className="mr-2 h-5 w-5" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

const Strategy = () => {
  return (
    <ProtectedRoute>
      <StrategyContent />
    </ProtectedRoute>
  );
};

export default Strategy;