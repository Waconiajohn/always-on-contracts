import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AgencyMatcherPanel } from "@/components/AgencyMatcherPanel";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Search, Bookmark } from "lucide-react";

export default function Agencies() {
  const [userId, setUserId] = useState<string>("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Load user's career vault to get target roles and industries
      const { data: vault } = await supabase
        .from('career_vault')
        .select('target_roles, target_industries')
        .eq('user_id', user.id)
        .single();

      if (vault) {
        setTargetRoles(vault.target_roles || []);
        setIndustries(vault.target_industries || []);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Recruiting Agencies</h1>
              <p className="text-muted-foreground">
                Connect with agencies that specialize in your target roles
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            {targetRoles.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Set Your Target Roles</CardTitle>
                  <CardDescription>
                    Complete your Career Vault to get personalized agency recommendations based on your target roles and industries.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            <AgencyMatcherPanel 
              userId={userId}
              targetRoles={targetRoles}
              industries={industries}
            />
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saved Agencies</CardTitle>
                <CardDescription>
                  Agencies you've bookmarked for follow-up (Coming Soon)
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
