import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppNav } from "@/components/AppNav";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { AgencyMatcherPanel } from "@/components/AgencyMatcherPanel";
import { MarketInsightsPanel } from "@/components/MarketInsightsPanel";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Building2, TrendingUp } from "lucide-react";

export default function CareerDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppNav />
        <main className="container mx-auto py-8 px-4">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppNav />
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Career Command Center</h1>
          <p className="text-muted-foreground text-lg">
            Your comprehensive suite of AI-powered career tools
          </p>
        </div>

        <Tabs defaultValue="interview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interview" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Interview Prep
            </TabsTrigger>
            <TabsTrigger value="agencies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Agency Matcher
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview">
            <InterviewPrepPanel 
              userId={userId}
              jobDescription={profile?.target_positions?.[0]}
            />
          </TabsContent>

          <TabsContent value="agencies">
            <AgencyMatcherPanel
              userId={userId}
              targetRoles={profile?.target_positions || []}
              industries={profile?.target_industries || []}
            />
          </TabsContent>

          <TabsContent value="market">
            <MarketInsightsPanel
              userId={userId}
              targetRole={profile?.current_title || profile?.target_positions?.[0]}
              targetIndustry={profile?.target_industries?.[0]}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
