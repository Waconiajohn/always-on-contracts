import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalJobPreferences } from "@/components/search-profiles/GlobalJobPreferences";
import { SearchProfileEditor } from "@/components/search-profiles/SearchProfileEditor";
import { SearchProfileCard } from "@/components/search-profiles/SearchProfileCard";

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

function SearchProfilesContent() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Partial<SearchProfile> | null>(null);

  useEffect(() => {
    fetchProfiles();
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

  const saveProfile = async (profileData: Partial<SearchProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = { ...profileData };
      delete updateData.id;
      
      if (profileData.id) {
        const { error } = await supabase
          .from('user_search_profiles')
          .update(updateData)
          .eq('id', profileData.id);

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

        <GlobalJobPreferences />

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
          <SearchProfileEditor
            profile={editingProfile}
            onSave={saveProfile}
            onCancel={() => setEditingProfile(null)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <SearchProfileCard
                key={profile.id}
                profile={profile}
                onEdit={setEditingProfile}
                onDelete={deleteProfile}
                onToggleActive={toggleProfileActive}
              />
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