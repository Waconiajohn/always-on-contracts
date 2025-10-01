import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TrendingUp, Briefcase, Target, Save, Plus, X, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { WhyMeBuilder } from "@/components/WhyMeBuilder";
import { AppNav } from "@/components/AppNav";

const StrategyContent = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customRateMin, setCustomRateMin] = useState<string>("");
  const [customRateMax, setCustomRateMax] = useState<string>("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [customPositions, setCustomPositions] = useState<string[]>([]);
  const [newPosition, setNewPosition] = useState("");
  const [generatingTitles, setGeneratingTitles] = useState(false);
  
  const [customAchievements, setCustomAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [generatingAchievements, setGeneratingAchievements] = useState(false);
  
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [generatingSkills, setGeneratingSkills] = useState(false);
  
  const [editingSummary, setEditingSummary] = useState(false);
  const [customSummary, setCustomSummary] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

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
      setCustomPositions(profileData.target_positions || analysisData.recommended_positions || []);
      setCustomAchievements(profileData.key_achievements || []);
      setCustomSkills(profileData.core_skills || []);
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

  const addPosition = () => {
    if (newPosition.trim() && !customPositions.includes(newPosition.trim())) {
      setCustomPositions(prev => [...prev, newPosition.trim()]);
      setNewPosition("");
    }
  };

  const removePosition = (position: string) => {
    setCustomPositions(prev => prev.filter(p => p !== position));
  };

  const generateJobTitles = async () => {
    setGeneratingTitles(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-titles', {
        body: { 
          resumeAnalysis: analysis,
          currentPositions: customPositions 
        }
      });

      if (error) throw error;

      if (data?.titles) {
        const newTitles = data.titles.filter((title: string) => !customPositions.includes(title));
        setCustomPositions(prev => [...prev, ...newTitles]);
        toast({
          title: "Job Titles Generated",
          description: `Added ${newTitles.length} new job title suggestions`,
        });
      }
    } catch (error) {
      console.error("Error generating job titles:", error);
      toast({
        title: "Error",
        description: "Failed to generate job titles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTitles(false);
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      const current = customAchievements.length > 0 ? customAchievements : analysis.key_achievements || [];
      setCustomAchievements([...current, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievement: string) => {
    setCustomAchievements(customAchievements.filter(a => a !== achievement));
  };

  const generateAchievements = async () => {
    setGeneratingAchievements(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-achievements', {
        body: { 
          resumeAnalysis: analysis,
          currentAchievements: customAchievements.length > 0 ? customAchievements : analysis.key_achievements || []
        }
      });

      if (error) throw error;

      if (data?.achievements) {
        const current = customAchievements.length > 0 ? customAchievements : analysis.key_achievements || [];
        const newAchievements = data.achievements.filter((a: string) => !current.includes(a));
        setCustomAchievements([...current, ...newAchievements]);
        toast({
          title: "Achievements Generated",
          description: `Added ${newAchievements.length} new achievement suggestions`,
        });
      }
    } catch (error) {
      console.error("Error generating achievements:", error);
      toast({
        title: "Error",
        description: "Failed to generate achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAchievements(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const current = customSkills.length > 0 ? customSkills : analysis.skills || [];
      setCustomSkills([...current, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
  };

  const generateSkills = async () => {
    setGeneratingSkills(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-skills', {
        body: { 
          resumeAnalysis: analysis,
          currentSkills: customSkills.length > 0 ? customSkills : analysis.skills || []
        }
      });

      if (error) throw error;

      if (data?.skills) {
        const current = customSkills.length > 0 ? customSkills : analysis.skills || [];
        const newSkills = data.skills.filter((s: string) => !current.includes(s));
        setCustomSkills([...current, ...newSkills]);
        toast({
          title: "Skills Generated",
          description: `Added ${newSkills.length} new skill suggestions`,
        });
      }
    } catch (error) {
      console.error("Error generating skills:", error);
      toast({
        title: "Error",
        description: "Failed to generate skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSkills(false);
    }
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
          target_positions: customPositions,
          key_achievements: customAchievements.length > 0 ? customAchievements : analysis.key_achievements,
          core_skills: customSkills.length > 0 ? customSkills : analysis.skills,
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
      <AppNav />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Contract Career Strategy</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Personalized recommendations based on your {analysis.years_experience} years of experience
            </p>
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-base text-muted-foreground">
                  💡 <strong>What's this for?</strong> This strategy profile will be used to automatically match you with relevant opportunities and craft personalized outreach to agencies. Customize your target rates, positions, and industries to improve your matches.
                </p>
              </CardContent>
            </Card>
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

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span>Executive Summary</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!editingSummary) {
                      setCustomSummary(analysis.analysis_summary || "");
                    }
                    setEditingSummary(!editingSummary);
                  }}
                >
                  {editingSummary ? "Cancel" : "Edit"}
                </Button>
              </CardTitle>
              <CardDescription className="text-lg">
                Your professional summary for automated communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingSummary ? (
                <Textarea
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  rows={6}
                  className="text-lg"
                  placeholder="Edit your executive summary..."
                />
              ) : (
                <p className="text-lg leading-relaxed">{customSummary || analysis.analysis_summary}</p>
              )}
            </CardContent>
          </Card>

          {/* Target Job Titles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-primary" />
                Target Job Titles
                {customPositions.length !== analysis.recommended_positions?.length && (
                  <Badge variant="secondary" className="ml-auto">Customized</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                Job titles the system will search for and match you with (click X to remove)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {customPositions.map((position: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-base px-4 py-2 group cursor-pointer">
                    {position}
                    <X 
                      className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => removePosition(position)}
                    />
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Add a job title..."
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                  className="text-base"
                />
                <Button onClick={addPosition} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button 
                  onClick={generateJobTitles} 
                  disabled={generatingTitles}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {generatingTitles ? "Generating..." : "AI Suggest"}
                </Button>
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
                Click to select/deselect industries for opportunity matching (outlined = disabled)
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
              <CardTitle className="text-2xl flex items-center gap-3">
                Key Achievements
                {customAchievements.length !== analysis.key_achievements?.length && (
                  <Badge variant="secondary" className="ml-auto">Customized</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                These will be used in automated outreach to highlight your value (click X to remove)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {(customAchievements.length > 0 ? customAchievements : analysis.key_achievements || []).map((achievement: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <span className="text-primary text-2xl">•</span>
                    <span className="text-lg flex-1">{achievement}</span>
                    <X 
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-destructive" 
                      onClick={() => removeAchievement(achievement)}
                    />
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Add an achievement..."
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                  className="text-base"
                />
                <Button onClick={addAchievement} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button 
                  onClick={generateAchievements} 
                  disabled={generatingAchievements}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {generatingAchievements ? "Generating..." : "AI Suggest"}
                </Button>
              </div>
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
              <CardTitle className="text-2xl flex items-center gap-3">
                Core Skills
                {customSkills.length !== analysis.skills?.length && (
                  <Badge variant="secondary" className="ml-auto">Customized</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                Technical and professional competencies for job matching (click X to remove)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(customSkills.length > 0 ? customSkills : analysis.skills || []).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-base px-3 py-1 group cursor-pointer">
                    {skill}
                    <X 
                      className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="text-base"
                />
                <Button onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button 
                  onClick={generateSkills} 
                  disabled={generatingSkills}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {generatingSkills ? "Generating..." : "AI Suggest"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Why Me Builder */}
          <WhyMeBuilder
            userId={userId}
            narratives={profile?.why_me_narratives || []}
            onUpdate={fetchData}
          />

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
