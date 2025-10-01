import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, TrendingUp, Briefcase, Target, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const StrategyContent = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customRateMin, setCustomRateMin] = useState<string>("");
  const [customRateMax, setCustomRateMax] = useState<string>("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from("resume_analysis")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (analysisError) throw analysisError;
      setAnalysis(analysisData);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Set initial values
      setCustomRateMin(profileData.custom_target_rate_min?.toString() || analysisData.target_hourly_rate_min?.toString() || "");
      setCustomRateMax(profileData.custom_target_rate_max?.toString() || analysisData.target_hourly_rate_max?.toString() || "");
      setSelectedIndustries(profileData.target_industries || analysisData.industry_expertise || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          custom_target_rate_min: parseFloat(customRateMin) || null,
          custom_target_rate_max: parseFloat(customRateMax) || null,
          target_industries: selectedIndustries,
          strategy_customized: true,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Strategy Updated",
        description: "Your preferences have been saved successfully",
      });

      // Refresh data to show updated values
      await fetchData();
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        title: "Error",
        description: "Failed to save your preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  const displayRateMin = profile?.custom_target_rate_min || analysis.target_hourly_rate_min;
  const displayRateMax = profile?.custom_target_rate_max || analysis.target_hourly_rate_max;
  const displayIndustries = profile?.target_industries || analysis.industry_expertise;

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

          {/* Target Rate Card with Customization */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-primary" />
                Target Hourly Rate
                {profile?.strategy_customized && (
                  <Badge variant="secondary" className="ml-auto">Customized</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                AI Recommendation: ${analysis.target_hourly_rate_min} - ${analysis.target_hourly_rate_max}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-5xl font-bold text-primary mb-4">
                ${displayRateMin} - ${displayRateMax}
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {profile?.strategy_customized 
                  ? "Your customized target rate range"
                  : "Customize your target rate to match your goals"}
              </p>
              
              {/* Rate Customization Inputs */}
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="rateMin" className="text-base">Minimum Rate ($)</Label>
                  <Input
                    id="rateMin"
                    type="number"
                    value={customRateMin}
                    onChange={(e) => setCustomRateMin(e.target.value)}
                    placeholder="Enter minimum rate"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateMax" className="text-base">Maximum Rate ($)</Label>
                  <Input
                    id="rateMax"
                    type="number"
                    value={customRateMax}
                    onChange={(e) => setCustomRateMax(e.target.value)}
                    placeholder="Enter maximum rate"
                    className="text-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <TrendingUp className="h-7 w-7 text-primary" />
                    Your Target Hourly Rate
                    {profile?.strategy_customized && (
                      <Badge variant="secondary" className="ml-auto">Customized</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-primary mb-4">
                    ${displayRateMin} - ${displayRateMax}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {profile?.strategy_customized 
                      ? "Your customized target rate range"
                      : "AI-recommended rate based on your experience level and industry expertise"}
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

          {/* Target Industries with Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Target className="h-7 w-7 text-primary" />
                Target Industries
                {profile?.strategy_customized && (
                  <Badge variant="secondary" className="ml-auto">Customized</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                Click industries to select/deselect your target focus areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {analysis.industry_expertise?.map((industry: string) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                    className="text-base px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedIndustries.length} of {analysis.industry_expertise?.length || 0}
              </p>
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

          {/* Save Preferences */}
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-end items-center">
                <p className="text-sm text-muted-foreground flex-1">
                  {profile?.strategy_customized 
                    ? "Update your preferences anytime" 
                    : "Save your preferences to complete Step 2 and unlock automation"}
                </p>
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
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
                  <h3 className="text-xl font-semibold mb-2">Browse Staffing Agencies</h3>
                  <p className="text-lg opacity-90">
                    Access 200+ firms specializing in interim executive placements
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
                    Personalize your outreach messages
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Activate Your Automation</h3>
                  <p className="text-lg opacity-90">
                    Start the continuous career management system
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full text-lg mt-4"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
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
