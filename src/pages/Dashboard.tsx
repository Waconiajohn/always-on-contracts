import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Users, DollarSign, Briefcase, Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">ContractCareer Pro</h1>
              <p className="text-lg text-muted-foreground">Your Always-On Career Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="lg">
                <Bell className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="lg">
                <Settings className="h-6 w-6" />
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

          <Card className="hover:shadow-lg transition-shadow">
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
              <Button variant="outline" className="w-full text-lg py-6" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
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
              <Button variant="outline" className="w-full text-lg py-6" disabled>
                Coming Soon
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
            <div className="flex items-start gap-4 p-4 bg-card rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                <p className="text-lg text-muted-foreground">Let our AI analyze your experience and create a personalized strategy</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg opacity-60">
              <div className="w-8 h-8 bg-muted-foreground text-card rounded-full flex items-center justify-center font-bold flex-shrink-0">
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

export default Dashboard;
