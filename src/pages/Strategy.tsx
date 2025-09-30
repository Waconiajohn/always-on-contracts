import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, TrendingUp, Briefcase, Target, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StrategyContent = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("resume_analysis")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setAnalysis(data);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading your strategy...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">No Analysis Found</CardTitle>
            <CardDescription className="text-lg">
              Please upload your resume first to generate your strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/resume-upload")} className="w-full">
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Contract Career Strategy</h1>
            <p className="text-xl text-muted-foreground">
              Personalized recommendations based on your {analysis.years_experience} years of experience
            </p>
          </div>

          {/* Target Rate Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-primary" />
                Your Target Hourly Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary mb-4">
                ${analysis.target_hourly_rate_min} - ${analysis.target_hourly_rate_max}
              </div>
              <p className="text-lg text-muted-foreground">
                Based on your experience level and industry expertise, you should target premium interim executive rates.
              </p>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.analysis_summary}</p>
            </CardContent>
          </Card>

          {/* Recommended Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-primary" />
                Recommended Positions
              </CardTitle>
              <CardDescription className="text-lg">
                High-value contract roles that match your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {analysis.recommended_positions?.map((position: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-lg px-4 py-2">
                    {position}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Target className="h-7 w-7 text-primary" />
                Industry Expertise
              </CardTitle>
              <CardDescription className="text-lg">
                Sectors where you can command premium rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {analysis.industry_expertise?.map((industry: string, index: number) => (
                  <Badge key={index} className="text-lg px-4 py-2">
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Key Achievements</CardTitle>
              <CardDescription className="text-lg">
                Quantifiable results that demonstrate your value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.key_achievements?.map((achievement: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary text-2xl">•</span>
                    <span className="text-lg">{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Management Capabilities */}
          {analysis.management_capabilities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Leadership Capabilities</CardTitle>
                <CardDescription className="text-lg">
                  Executive skills that set you apart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.management_capabilities.map((capability: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-lg">
                      <span className="text-primary">✓</span>
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Core Skills</CardTitle>
              <CardDescription className="text-lg">
                Technical and professional competencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-base px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Review Staffing Agencies</h3>
                  <p className="text-lg opacity-90">
                    Browse 200+ firms specializing in interim executive placements
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Customize Communication Templates</h3>
                  <p className="text-lg opacity-90">
                    Personalize outreach messages with your achievements
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Activate Your Autopilot</h3>
                  <p className="text-lg opacity-90">
                    Start the continuous career management system
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full text-lg mt-4"
                onClick={() => navigate("/agencies")}
              >
                Browse Staffing Agencies
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
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
