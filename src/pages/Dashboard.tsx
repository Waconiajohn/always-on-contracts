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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      {/* Greeting Section */}
      <div className="border-b bg-card animate-fade-in">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile?.full_name || session?.user?.email?.split('@')[0]}</h1>
            <p className="text-lg text-muted-foreground">Your contract work command center</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-8 space-y-12 animate-slide-up">
        {/* Welcome Section */}
        <div>
          <h2 className="text-4xl font-bold mb-4">Contract Work Dashboard</h2>
          <p className="text-xl text-muted-foreground">
            Manage your contract job search, connect with staffing agencies, and land premium opportunities.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/resume-upload')}>
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

          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/opportunities')}>
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

          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/agencies')}>
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


          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/rate-calculator')}>
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

          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/templates')}>
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

          <Card className="hover-scale cursor-pointer transition-all" onClick={() => navigate('/api-keys')}>
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
              <div className="text-3xl font-bold text-primary mb-2">
                {profile?.automation_enabled ? 'Active' : 'Setup Mode'}
              </div>
              <p className="text-lg text-muted-foreground">
                {profile?.automation_enabled 
                  ? 'Your automation is running' 
                  : 'Configure your preferences to get started'
                }
              </p>
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
