import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FileText, TrendingUp, Users, DollarSign, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AppNav } from "@/components/AppNav";

const DashboardContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingAutomation, setActivatingAutomation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkAnalysis(session.user.id);
        fetchResumes(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkAnalysis(session.user.id);
        fetchResumes(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAnalysis = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("resume_analysis")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (error) throw error;
      setHasAnalysis(data && data.length > 0);
    } catch (error) {
      console.error("Error checking analysis:", error);
    }
  };

  const fetchResumes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const handleActivateAutomation = async () => {
    if (!profile?.strategy_customized) {
      toast({
        title: "Complete Step 2 First",
        description: "Please customize your strategy before activating automation",
        variant: "destructive",
      });
      return;
    }

    setActivatingAutomation(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          automation_enabled: true,
          automation_activated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      setProfile({ ...profile, automation_enabled: true });
      toast({
        title: "🚀 Automation Activated!",
        description: "Your Always-On system is now working for you in the background",
      });
    } catch (error) {
      console.error("Error activating automation:", error);
      toast({
        title: "Error",
        description: "Failed to activate automation",
        variant: "destructive",
      });
    } finally {
      setActivatingAutomation(false);
    }
  };

  const handleDeactivateAutomation = async () => {
    setActivatingAutomation(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          automation_enabled: false,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      setProfile({ ...profile, automation_enabled: false });
      toast({
        title: "Automation Paused",
        description: "You can reactivate it anytime from this dashboard",
      });
    } catch (error) {
      console.error("Error deactivating automation:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate automation",
        variant: "destructive",
      });
    } finally {
      setActivatingAutomation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      {/* Greeting Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile?.full_name || session?.user?.email?.split('@')[0]}</h1>
            <p className="text-lg text-muted-foreground">Here's your career management overview</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to Your Dashboard</h2>
          <p className="text-xl text-muted-foreground">
            Let's get started by uploading your resume and building your career strategy.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/resume-upload')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Upload Resume</CardTitle>
              <CardDescription className="text-lg">
                {resumes.length > 0 
                  ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} uploaded`
                  : 'Get AI-powered analysis and strategy recommendations'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{resumes[0].file_name}</span>
                  </div>
                  <Button className="w-full text-lg py-6">
                    Upload New Resume
                  </Button>
                </div>
              ) : (
                <Button className="w-full text-lg py-6">
                  Start Here
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/opportunities')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Contract Opportunities</CardTitle>
              <CardDescription className="text-lg">
                AI-matched contract positions based on your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Find Opportunities
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/agencies')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Staffing Agencies</CardTitle>
              <CardDescription className="text-lg">
                Access 200+ recruiting firms and track outreach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Browse Agencies
              </Button>
            </CardContent>
          </Card>


          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rate-calculator')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Rate Calculator</CardTitle>
              <CardDescription className="text-lg">
                Calculate your premium hourly rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Calculate Rate
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/templates')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Templates</CardTitle>
              <CardDescription className="text-lg">
                Customize your outreach communication templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Manage Templates
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/api-keys')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">API Keys</CardTitle>
              <CardDescription className="text-lg">
                Connect with AI assistants via MCP protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Manage API Keys
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">Setup Mode</div>
              <p className="text-lg text-muted-foreground">Complete your profile to activate automation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Active Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">0</div>
              <p className="text-lg text-muted-foreground">Opportunities being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recruiter Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">0/200</div>
              <p className="text-lg text-muted-foreground">Recruiters in your network</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-12 bg-muted">
          <CardHeader>
            <CardTitle className="text-2xl">Next Steps</CardTitle>
            <CardDescription className="text-lg">Complete these steps to activate your Always-On system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-start gap-4 p-4 bg-card rounded-lg ${hasAnalysis ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 ${hasAnalysis ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                {hasAnalysis ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                <p className="text-lg text-muted-foreground">Let our AI analyze your experience and create a personalized strategy</p>
              </div>
            </div>

            <div className={`flex items-start gap-4 p-4 bg-card rounded-lg ${!hasAnalysis ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 ${profile?.strategy_customized ? 'bg-primary text-primary-foreground' : hasAnalysis ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-card'} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                {profile?.strategy_customized ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Review Your Strategy</h3>
                <p className="text-lg text-muted-foreground">View AI recommendations and customize your target rate and industries</p>
                {hasAnalysis && (
                  <Button onClick={() => navigate('/strategy')} className="mt-3">
                    {profile?.strategy_customized ? 'Review & Edit Strategy' : 'Review Your Strategy'}
                  </Button>
                )}
              </div>
            </div>

            <div className={`flex items-start gap-4 p-4 bg-card rounded-lg ${!profile?.strategy_customized ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 ${profile?.automation_enabled ? 'bg-primary text-primary-foreground' : profile?.strategy_customized ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-card'} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                {profile?.automation_enabled ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Activate Automation</h3>
                <p className="text-lg text-muted-foreground">Turn on the Always-On system and let it work for you</p>
                {profile?.strategy_customized && !profile?.automation_enabled && (
                  <Button
                    onClick={handleActivateAutomation}
                    disabled={activatingAutomation}
                    className="mt-3"
                  >
                    {activatingAutomation ? "Activating..." : "🚀 Activate Now"}
                  </Button>
                )}
                {profile?.automation_enabled && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-primary font-semibold">✓ Automation Active</div>
                    <Button
                      onClick={handleDeactivateAutomation}
                      disabled={activatingAutomation}
                      variant="outline"
                      size="sm"
                    >
                      Pause Automation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
};

export default Dashboard;
