import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, TrendingUp, Copy, Check, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CharacterCounter } from "@/components/linkedin/CharacterCounter";
import { SkillsTagInput } from "@/components/linkedin/SkillsTagInput";
import { ProfileProgressTracker } from "@/components/linkedin/ProfileProgressTracker";

export default function LinkedInProfileBuilder() {
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [currentAbout, setCurrentAbout] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVaultData();
  }, []);

  const fetchVaultData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vault } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(power_phrase, category),
        vault_transferable_skills(stated_skill, evidence),
        vault_hidden_competencies(competency_area, inferred_capability)
      `)
      .eq('user_id', user.id)
      .single();

    setVaultData(vault);
  };

  const getSuggestedSkills = (): string[] => {
    if (!vaultData) return [];
    const suggestions: string[] = [];
    
    if (vaultData.vault_transferable_skills) {
      suggestions.push(...vaultData.vault_transferable_skills.map((s: any) => s.stated_skill));
    }
    
    return [...new Set(suggestions)].slice(0, 15);
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

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
      const { data, error } = await supabase.functions.invoke('optimize-linkedin-with-audit', {
        body: {
          currentHeadline,
          currentAbout,
          targetRole,
          industry,
          skills
        }
      });

      if (error) throw error;
      setOptimizationResult(data);
      
      // Save optimized sections to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data?.optimizedProfile) {
          // Save headline
          await supabase.from('linkedin_profile_sections').insert({
            user_id: user.id,
            section_type: 'headline',
            content: data.optimizedProfile.headline,
            optimization_score: data.scores?.overallScore || null
          });

          // Save about
          await supabase.from('linkedin_profile_sections').insert({
            user_id: user.id,
            section_type: 'about',
            content: data.optimizedProfile.about,
            optimization_score: data.scores?.overallScore || null
          });

          // Save skills
          if (data.optimizedProfile.skills) {
            await supabase.from('linkedin_profile_sections').insert({
              user_id: user.id,
              section_type: 'skills',
              content: JSON.stringify(data.optimizedProfile.skills),
              optimization_score: data.scores?.overallScore || null
            });
          }

          // Mark profile as complete
          await supabase
            .from('profiles')
            .update({ linkedin_profile_complete: true })
            .eq('user_id', user.id);
        }
      } catch (saveError) {
        console.error('Error saving LinkedIn sections:', saveError);
      }
      
      toast({ title: "Profile optimized with dual AI audit!", description: "Review your enhanced profile below" });
    } catch (error: any) {
      toast({ title: "Optimization failed", description: error.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              LinkedIn Brand Positioning
            </h1>
            <p className="text-muted-foreground">
              80% of employers skip job boards and search LinkedIn directly with keyword filters. 
              A 97% resume score won't help if your LinkedIn brand is weak. When recruiters search your role, 
              you need top 10 visibility. This is dimension 2 of 5 for becoming the benchmark candidate.
            </p>
          </div>

          {vaultData && (
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Package className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Your Career Vault Intelligence</h3>
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="font-medium">{vaultData.vault_power_phrases?.length || 0} Power Phrases</p>
                        <p className="text-muted-foreground">Extracted from experience</p>
                      </div>
                      <div>
                        <p className="font-medium">{vaultData.vault_transferable_skills?.length || 0} Transferable Skills</p>
                        <p className="text-muted-foreground">Identified capabilities</p>
                      </div>
                      <div>
                        <p className="font-medium">{vaultData.vault_hidden_competencies?.length || 0} Hidden Competencies</p>
                        <p className="text-muted-foreground">Discovered strengths</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-5 gap-6">
        <div className="space-y-6 md:col-span-2">
          <ProfileProgressTracker
            targetRole={targetRole}
            industry={industry}
            headline={currentHeadline}
            about={currentAbout}
            skills={skills}
          />

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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="headline">Current Headline</Label>
                  <CharacterCounter current={currentHeadline.length} max={220} />
                </div>
                <Input
                  id="headline"
                  placeholder="Your current LinkedIn headline"
                  value={currentHeadline}
                  onChange={(e) => setCurrentHeadline(e.target.value)}
                  maxLength={220}
                />
                {currentHeadline.length > 0 && currentHeadline.length < 20 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Add at least {20 - currentHeadline.length} more characters for better impact
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="about">Current About Section</Label>
                  <CharacterCounter current={currentAbout.length} max={2600} />
                </div>
                <Textarea
                  id="about"
                  placeholder="Your current 'About' section content"
                  value={currentAbout}
                  onChange={(e) => setCurrentAbout(e.target.value)}
                  rows={8}
                  maxLength={2600}
                />
                {currentAbout.length > 0 && currentAbout.length < 100 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Add at least {100 - currentAbout.length} more characters for completeness
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="skills">Current Skills</Label>
                <SkillsTagInput
                  skills={skills}
                  onChange={setSkills}
                  maxSkills={50}
                  suggestions={getSuggestedSkills()}
                />
              </div>

              <Button 
                onClick={handleOptimize} 
                disabled={isOptimizing || !targetRole.trim() || !industry.trim()} 
                className="w-full"
              >
                {isOptimizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Optimize Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {optimizationResult && (
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Optimized Profile - Copy & Paste Sections</CardTitle>
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
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base font-semibold">📝 Headline</Label>
                    <CharacterCounter 
                      current={optimizationResult.optimizedHeadline?.length || 0} 
                      max={220} 
                      className="ml-2"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(optimizationResult.optimizedHeadline, 'headline')}
                  >
                    {copiedSection === 'headline' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedSection === 'headline' ? 'Copied!' : `Copy (${optimizationResult.optimizedHeadline?.length || 0} chars)`}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md border-2 border-dashed">
                  <p className="text-sm">{optimizationResult.optimizedHeadline}</p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base font-semibold">📝 About Section</Label>
                    <CharacterCounter 
                      current={optimizationResult.optimizedAbout?.length || 0} 
                      max={2600} 
                      className="ml-2"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(optimizationResult.optimizedAbout, 'about')}
                  >
                    {copiedSection === 'about' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedSection === 'about' ? 'Copied!' : `Copy (${optimizationResult.optimizedAbout?.length || 0} chars)`}
                  </Button>
                </div>
                <Textarea
                  value={optimizationResult.optimizedAbout}
                  readOnly
                  rows={12}
                  className="font-mono text-sm border-2 border-dashed"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Formatting is preserved when pasting into LinkedIn
                </p>
              </div>

              <Separator />

              {optimizationResult.prioritizedSkills?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">📝 Featured Skills (50 max)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(optimizationResult.prioritizedSkills.join(', '), 'skills')}
                    >
                      {copiedSection === 'skills' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedSection === 'skills' ? 'Copied!' : 'Copy List'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md border-2 border-dashed">
                    {optimizationResult.prioritizedSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant={idx < 3 ? "default" : "secondary"}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Top 3 skills are heavily weighted by LinkedIn's recruiter search algorithm
                  </p>
                </div>
              )}

              <Separator />

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

              <Separator />

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-semibold text-sm mb-2">✅ LinkedIn Brand Dimension Complete</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Strong LinkedIn positioning is 1 of 5 dimensions. Next: Ensure resume (90%+), interview prep, 
                  market intelligence leverage, and strategic networking are equally strong.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-mono">☐</span>
                    <p><strong>Step 1:</strong> Open LinkedIn → Edit profile → Click headline section</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono">☐</span>
                    <p><strong>Step 2:</strong> Copy optimized headline above and paste into LinkedIn</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono">☐</span>
                    <p><strong>Step 3:</strong> Edit About section → Copy and paste optimized content</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono">☐</span>
                    <p><strong>Step 4:</strong> Go to Skills section → Add skills in priority order (top 3 first)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono">☐</span>
                    <p><strong>Step 5:</strong> Check profile completeness → Target: 100% "All-Star" profile</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}