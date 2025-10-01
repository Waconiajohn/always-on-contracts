import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, Save, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const StrategyCustomizeContent = () => {
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
      toast({
        title: "Error",
        description: "Failed to load your strategy data",
        variant: "destructive",
      });
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

      navigate("/dashboard");
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
        <div className="text-2xl">Loading...</div>
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
              Please upload your resume first
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
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Customize Your Strategy</h1>
            <p className="text-xl text-muted-foreground">
              Adjust your target rate and preferred industries to match your goals
            </p>
          </div>

          {/* Target Rate Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-primary" />
                Target Hourly Rate
              </CardTitle>
              <CardDescription className="text-lg">
                AI Recommendation: ${analysis.target_hourly_rate_min} - ${analysis.target_hourly_rate_max}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
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

          {/* Industry Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Target Industries</CardTitle>
              <CardDescription className="text-lg">
                Select the industries you want to focus on (based on your expertise)
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              <p className="text-sm text-muted-foreground mt-4">
                Selected: {selectedIndustries.length} of {analysis.industry_expertise?.length || 0}
              </p>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const StrategyCustomize = () => {
  return (
    <ProtectedRoute>
      <StrategyCustomizeContent />
    </ProtectedRoute>
  );
};

export default StrategyCustomize;
