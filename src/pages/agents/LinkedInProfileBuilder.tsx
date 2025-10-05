import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LinkedInProfileBuilder() {
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [currentAbout, setCurrentAbout] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const handleOptimize = async () => {
    if (!targetRole.trim() || !industry.trim()) {
      toast({ 
        title: "Missing information", 
        description: "Please enter target role and industry", 
        variant: "destructive" 
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-linkedin-profile', {
        body: {
          currentHeadline,
          currentAbout,
          targetRole,
          industry,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      setOptimizationResult(data);
      toast({ title: "Profile optimized!", description: "Review your enhanced profile below" });
    } catch (error: any) {
      toast({ title: "Optimization failed", description: error.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LinkedIn Profile Builder</h1>
        <p className="text-muted-foreground">Optimize your LinkedIn profile for maximum recruiter visibility</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Profile</CardTitle>
            <CardDescription>Enter your current LinkedIn information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetRole">Target Role *</Label>
              <Input
                id="targetRole"
                placeholder="e.g., VP of Product, Senior Data Scientist"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, FinTech, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="headline">Current Headline</Label>
              <Input
                id="headline"
                placeholder="Your current LinkedIn headline"
                value={currentHeadline}
                onChange={(e) => setCurrentHeadline(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="about">Current About Section</Label>
              <Textarea
                id="about"
                placeholder="Your current 'About' section content"
                value={currentAbout}
                onChange={(e) => setCurrentAbout(e.target.value)}
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="skills">Current Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                placeholder="e.g., Product Strategy, Data Analysis, Team Leadership"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full">
              {isOptimizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Optimize Profile
            </Button>
          </CardContent>
        </Card>

        {optimizationResult && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Optimized Profile</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default">Score: {optimizationResult.optimizationScore}/100</Badge>
                    <Badge variant="outline">{optimizationResult.recruiterAppeal}</Badge>
                  </div>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Optimized Headline</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm">{optimizationResult.optimizedHeadline}</p>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Optimized About Section</Label>
                <Textarea
                  value={optimizationResult.optimizedAbout}
                  readOnly
                  rows={12}
                  className="mt-2 font-mono text-sm"
                />
              </div>

              {optimizationResult.prioritizedSkills?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Prioritized Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {optimizationResult.prioritizedSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant={idx < 3 ? "default" : "secondary"}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Top 3 skills are heavily weighted by LinkedIn's algorithm
                  </p>
                </div>
              )}

              {optimizationResult.keywordStrategy && (
                <div>
                  <Label className="text-base font-semibold">Keyword Strategy</Label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <p className="text-sm font-medium">Primary Keywords:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {optimizationResult.keywordStrategy.primary?.map((kw: string, idx: number) => (
                          <Badge key={idx} variant="default" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Secondary Keywords:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {optimizationResult.keywordStrategy.secondary?.map((kw: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    {optimizationResult.keywordStrategy.placement && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {optimizationResult.keywordStrategy.placement}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {optimizationResult.improvements?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Key Improvements</Label>
                  <div className="space-y-2 mt-2">
                    {optimizationResult.improvements.map((imp: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary pl-3 py-1">
                        <p className="text-sm font-medium">{imp.area}: {imp.change}</p>
                        <p className="text-xs text-muted-foreground">{imp.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optimizationResult.beforeAfterComparison && (
                <div>
                  <Label className="text-base font-semibold">Before/After Comparison</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-medium mb-1">Searchability</p>
                      <p className="text-sm">{optimizationResult.beforeAfterComparison.searchability}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-medium mb-1">Clarity</p>
                      <p className="text-sm">{optimizationResult.beforeAfterComparison.clarity}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}