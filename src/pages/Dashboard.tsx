import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FileText, TrendingUp, Users, DollarSign, LogOut, Bell, Settings, Upload, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DashboardContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkAnalysis(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkAnalysis(session.user.id);
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
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">ContractCareer Pro</h1>
              <p className="text-lg text-muted-foreground">Welcome, {profile?.full_name || session?.user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="lg">
                <Bell className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="lg" onClick={() => navigate('/profile')}>
                <Settings className="h-6 w-6" />
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                Get AI-powered analysis and strategy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                Start Here
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/outreach')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">My Outreach</CardTitle>
              <CardDescription className="text-lg">
                Manage and track your agency communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-6">
                View Outreach
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
                {hasAnalysis && (
                  <Button onClick={() => navigate('/strategy')} className="mt-3">
                    View Your Strategy
                  </Button>
                )}
              </div>
            </div>

            <div className={`flex items-start gap-4 p-4 bg-card rounded-lg ${!hasAnalysis ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 ${hasAnalysis ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-card'} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Review Your Strategy</h3>
                <p className="text-lg text-muted-foreground">Customize your target rate, industries, and communication templates</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg opacity-60">
              <div className="w-8 h-8 bg-muted-foreground text-card rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Activate Automation</h3>
                <p className="text-lg text-muted-foreground">Turn on the Always-On system and let it work for you</p>
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
