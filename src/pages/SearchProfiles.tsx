import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, Save, Search, Target, X, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface SearchProfile {
  id: string;
  profile_name: string;
  is_active: boolean | null;
  target_positions: string[] | null;
  target_industries: string[] | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  excluded_keywords: string[] | null;
  excluded_companies: string[] | null;
  min_hourly_rate: number | null;
  max_hourly_rate: number | null;
  min_contract_months: number | null;
  max_contract_months: number | null;
  remote_only: boolean | null;
  hybrid_acceptable: boolean | null;
  onsite_acceptable: boolean | null;
  preferred_locations: string[] | null;
  company_size_preferences: string[] | null;
  minimum_match_score: number | null;
}

const COMPANY_SIZES = ['startup', 'midsize', 'enterprise'];

function SearchProfilesContent() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Partial<SearchProfile> | null>(null);
  const [newItemInput, setNewItemInput] = useState("");
  const navigate = useNavigate();
  
  // Global job preferences
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetPositions, setTargetPositions] = useState<string[]>([]);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [savingGlobal, setSavingGlobal] = useState(false);

  useEffect(() => {
    fetchProfiles();
    fetchGlobalPreferences();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_search_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load search profiles');
    } finally {
      setLoading(false);
    }
  };

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

  const createNewProfile = () => {
    setEditingProfile({
      profile_name: "New Search Profile",
      is_active: true,
      target_positions: [],
      target_industries: [],
      required_skills: [],
      preferred_skills: [],
      excluded_keywords: [],
      excluded_companies: [],
      min_hourly_rate: null,
      max_hourly_rate: null,
      min_contract_months: null,
      max_contract_months: null,
      remote_only: false,
      hybrid_acceptable: true,
      onsite_acceptable: true,
      preferred_locations: [],
      company_size_preferences: [],
      minimum_match_score: 70,
    });
  };

  const saveProfile = async () => {
    if (!editingProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = { ...editingProfile };
      delete updateData.id;
      
      if (editingProfile.id) {
        const { error } = await supabase
          .from('user_search_profiles')
          .update(updateData)
          .eq('id', editingProfile.id);

        if (error) throw error;
        toast.success('Profile updated successfully');
      } else {
        const { error } = await supabase
          .from('user_search_profiles')
          .insert([{
            ...updateData,
            user_id: user.id,
          }]);

        if (error) throw error;
        toast.success('Profile created successfully');
      }

      setEditingProfile(null);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this search profile?')) return;

    try {
      const { error } = await supabase
        .from('user_search_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Profile deleted');
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const toggleProfileActive = async (profile: SearchProfile) => {
    try {
      const { error } = await supabase
        .from('user_search_profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profile.id);

      if (error) throw error;
      fetchProfiles();
    } catch (error: any) {
      console.error('Error toggling profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const addArrayItem = (field: keyof SearchProfile, value: string) => {
    if (!editingProfile || !value.trim()) return;
    
    const currentArray = (editingProfile[field] as string[]) || [];
    if (currentArray.includes(value.trim())) {
      toast.error('Item already exists');
      return;
    }

    setEditingProfile({
      ...editingProfile,
      [field]: [...currentArray, value.trim()],
    });
    setNewItemInput("");
  };

  const removeArrayItem = (field: keyof SearchProfile, index: number) => {
    if (!editingProfile) return;
    const currentArray = (editingProfile[field] as string[]) || [];
    setEditingProfile({
      ...editingProfile,
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Job Search Configuration</h1>
          <p className="text-xl text-muted-foreground">
            Configure your global preferences and create custom search profiles
          </p>
        </div>

        {/* Global Job Preferences */}
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (newPosition.trim() && !targetPositions.includes(newPosition.trim())) {
                        setTargetPositions([...targetPositions, newPosition.trim()]);
                        setNewPosition('');
                      }
                    }
                  }}
                  placeholder="e.g., Project Manager, Business Analyst"
                />
                <Button 
                  onClick={() => {
                    if (newPosition.trim() && !targetPositions.includes(newPosition.trim())) {
                      setTargetPositions([...targetPositions, newPosition.trim()]);
                      setNewPosition('');
                    }
                  }}
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {targetPositions.map((position) => (
                  <Badge 
                    key={position} 
                    variant="secondary" 
                    className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => setTargetPositions(targetPositions.filter(p => p !== position))}
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (newIndustry.trim() && !targetIndustries.includes(newIndustry.trim())) {
                        setTargetIndustries([...targetIndustries, newIndustry.trim()]);
                        setNewIndustry('');
                      }
                    }
                  }}
                  placeholder="e.g., Healthcare, Finance, Technology"
                />
                <Button 
                  onClick={() => {
                    if (newIndustry.trim() && !targetIndustries.includes(newIndustry.trim())) {
                      setTargetIndustries([...targetIndustries, newIndustry.trim()]);
                      setNewIndustry('');
                    }
                  }}
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {targetIndustries.map((industry) => (
                  <Badge 
                    key={industry} 
                    variant="secondary" 
                    className="text-base px-4 py-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => setTargetIndustries(targetIndustries.filter(i => i !== industry))}
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

        <Separator className="my-8" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Custom Search Profiles</h2>
              <p className="text-muted-foreground">Fine-tune specific search criteria for different scenarios</p>
            </div>
            <Button onClick={createNewProfile} className="gap-2">
              <Plus className="h-4 w-4" />
              New Profile
            </Button>
          </div>
        </div>

        {editingProfile ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                <Input
                  value={editingProfile.profile_name || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, profile_name: e.target.value })}
                  className="text-2xl font-bold border-none p-0 h-auto"
                  placeholder="Profile Name"
                />
              </CardTitle>
              <CardDescription>Configure your search criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="rates">Rates & Duration</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="space-y-4">
                  <div>
                    <Label>Target Positions</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('target_positions', newItemInput)}
                        placeholder="e.g., Software Engineer"
                      />
                      <Button onClick={() => addArrayItem('target_positions', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.target_positions?.map((pos, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {pos}
                          <button onClick={() => removeArrayItem('target_positions', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Target Industries</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('target_industries', newItemInput)}
                        placeholder="e.g., FinTech"
                      />
                      <Button onClick={() => addArrayItem('target_industries', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.target_industries?.map((ind, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {ind}
                          <button onClick={() => removeArrayItem('target_industries', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Company Size Preferences</Label>
                    <div className="flex gap-2 mt-2">
                      {COMPANY_SIZES.map((size) => (
                        <Button
                          key={size}
                          variant={editingProfile.company_size_preferences?.includes(size) ? "default" : "outline"}
                          onClick={() => {
                            const current = editingProfile.company_size_preferences || [];
                            setEditingProfile({
                              ...editingProfile,
                              company_size_preferences: current.includes(size)
                                ? current.filter(s => s !== size)
                                : [...current, size]
                            });
                          }}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <div>
                    <Label>Required Skills</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('required_skills', newItemInput)}
                        placeholder="e.g., React"
                      />
                      <Button onClick={() => addArrayItem('required_skills', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.required_skills?.map((skill, idx) => (
                        <Badge key={idx} variant="default" className="gap-1">
                          {skill}
                          <button onClick={() => removeArrayItem('required_skills', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Skills</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('preferred_skills', newItemInput)}
                        placeholder="e.g., TypeScript"
                      />
                      <Button onClick={() => addArrayItem('preferred_skills', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.preferred_skills?.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {skill}
                          <button onClick={() => removeArrayItem('preferred_skills', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Minimum Match Score: {editingProfile.minimum_match_score}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={editingProfile.minimum_match_score || 70}
                      onChange={(e) => setEditingProfile({ ...editingProfile, minimum_match_score: parseInt(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="rates" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={editingProfile.min_hourly_rate || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, min_hourly_rate: parseFloat(e.target.value) || null })}
                        placeholder="e.g., 75"
                      />
                    </div>
                    <div>
                      <Label>Maximum Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={editingProfile.max_hourly_rate || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, max_hourly_rate: parseFloat(e.target.value) || null })}
                        placeholder="e.g., 150"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Contract Duration (months)</Label>
                      <Input
                        type="number"
                        value={editingProfile.min_contract_months || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, min_contract_months: parseInt(e.target.value) || null })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div>
                      <Label>Maximum Contract Duration (months)</Label>
                      <Input
                        type="number"
                        value={editingProfile.max_contract_months || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, max_contract_months: parseInt(e.target.value) || null })}
                        placeholder="e.g., 12"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Remote Only</Label>
                      <Switch
                        checked={editingProfile.remote_only || false}
                        onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, remote_only: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Hybrid Acceptable</Label>
                      <Switch
                        checked={editingProfile.hybrid_acceptable ?? true}
                        onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, hybrid_acceptable: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>On-site Acceptable</Label>
                      <Switch
                        checked={editingProfile.onsite_acceptable ?? true}
                        onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, onsite_acceptable: checked })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Locations</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('preferred_locations', newItemInput)}
                        placeholder="e.g., San Francisco, CA"
                      />
                      <Button onClick={() => addArrayItem('preferred_locations', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.preferred_locations?.map((loc, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {loc}
                          <button onClick={() => removeArrayItem('preferred_locations', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exclusions" className="space-y-4">
                  <div>
                    <Label>Excluded Keywords</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Jobs containing these keywords will be filtered out
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('excluded_keywords', newItemInput)}
                        placeholder="e.g., on-call"
                      />
                      <Button onClick={() => addArrayItem('excluded_keywords', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.excluded_keywords?.map((keyword, idx) => (
                        <Badge key={idx} variant="destructive" className="gap-1">
                          {keyword}
                          <button onClick={() => removeArrayItem('excluded_keywords', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Excluded Companies</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('excluded_companies', newItemInput)}
                        placeholder="e.g., Company Name"
                      />
                      <Button onClick={() => addArrayItem('excluded_companies', newItemInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProfile.excluded_companies?.map((company, idx) => (
                        <Badge key={idx} variant="destructive" className="gap-1">
                          {company}
                          <button onClick={() => removeArrayItem('excluded_companies', idx)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
                <Button onClick={saveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.id} className={profile.is_active ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {profile.profile_name}
                        {profile.is_active && <Badge>Active</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {(profile.target_positions ?? []).length} positions • {(profile.required_skills ?? []).length} skills
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteProfile(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Rate Range</p>
                    <p className="text-sm text-muted-foreground">
                      ${profile.min_hourly_rate ?? '—'}/hr - ${profile.max_hourly_rate ?? '—'}/hr
                    </p>
                  </div>

                  {profile.target_positions && profile.target_positions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Target Positions</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.target_positions.slice(0, 3).map((pos, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {pos}
                          </Badge>
                        ))}
                        {profile.target_positions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.target_positions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingProfile(profile)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={profile.is_active ? "secondary" : "default"}
                      className="flex-1"
                      onClick={() => toggleProfileActive(profile)}
                    >
                      {profile.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {profiles.length === 0 && !editingProfile && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Search Profiles Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first search profile to start finding targeted contract opportunities
              </p>
              <Button onClick={createNewProfile} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchProfiles() {
  return (
    <ProtectedRoute>
      <SearchProfilesContent />
    </ProtectedRoute>
  );
}