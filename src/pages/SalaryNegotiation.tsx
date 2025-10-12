import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, TrendingUp, Copy, Check, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SalaryNegotiation = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<any>(null);
  const [aiNegotiationScript, setAiNegotiationScript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    location: "",
    yearsExperience: "",
    offeredBase: "",
    offeredBonus: "",
    offeredEquity: ""
  });

  // Pre-fill from Projects page if navigated from there
  useEffect(() => {
    if (location.state) {
      setFormData({
        jobTitle: location.state.jobTitle || "",
        location: location.state.location || "",
        yearsExperience: formData.yearsExperience,
        offeredBase: location.state.offeredBase?.toString() || "",
        offeredBonus: location.state.offeredBonus?.toString() || "",
        offeredEquity: location.state.offeredEquity?.toString() || ""
      });
    }
  }, [location]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Negotiation script copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateReport = async () => {
    if (!formData.jobTitle || !formData.location || !formData.yearsExperience) {
      toast({
        title: "Missing information",
        description: "Please fill in job title, location, and years of experience",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-salary-report', {
        body: {
          job_title: formData.jobTitle,
          location: formData.location,
          years_experience: parseInt(formData.yearsExperience),
          offer_details: {
            base_salary: parseFloat(formData.offeredBase) || null,
            bonus_percent: parseFloat(formData.offeredBonus) || null,
            equity_value: parseFloat(formData.offeredEquity) || null
          }
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.success) {
        setMarketData(data.market_data);
        setCompetitiveAnalysis(data.competitive_analysis);
        setAiNegotiationScript(data.negotiation_script);
        
        toast({
          title: "Salary Intelligence Generated!",
          description: "Your personalized salary report is ready",
        });
      } else {
        throw new Error(data?.error || 'Failed to generate report');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate salary report';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleScript = `Thank you for the offer. I'm excited about the opportunity to bring my experience in ${formData.jobTitle || '[your expertise]'} to [Company Name].

Based on my research of the market for similar roles in ${formData.location || '[location]'}, combined with my ${formData.yearsExperience || '[X]'} years of experience delivering [specific results], I was expecting a base salary in the range of $[target range].

Would there be flexibility to meet at $[your target] base, maintaining the same bonus and equity structure?

I'm confident that my track record of [key achievement 1], [key achievement 2], and [key achievement 3] will deliver significant value to your team.

I'm happy to discuss this further and find a mutually beneficial arrangement.`;

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <AppNav />
        <div className="container py-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Salary Negotiation Assistant</h1>
            <p className="text-muted-foreground text-lg">
              Market data and negotiation scripts to maximize your offer
            </p>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">AI-Powered Salary Intelligence</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get real-time market research from multiple sources, competitive positioning analysis from your Career Vault, and a personalized negotiation script.
                  </p>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating || !formData.jobTitle || !formData.location || !formData.yearsExperience}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? "Researching Market Data..." : "Generate Salary Intelligence Report"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {marketData && (
            <>
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Market Data Analysis
                  </CardTitle>
                  <CardDescription>Real-time salary data from multiple sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">25th Percentile</p>
                      <p className="text-2xl font-bold">
                        ${marketData?.extracted_data?.percentile_25?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Median (50th)</p>
                      <p className="text-2xl font-bold text-primary">
                        ${marketData?.extracted_data?.percentile_50?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">75th Percentile</p>
                      <p className="text-2xl font-bold">
                        ${marketData?.extracted_data?.percentile_75?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">90th Percentile</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${marketData?.extracted_data?.percentile_90?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {formData.offeredBase && marketData?.extracted_data?.percentile_50 && (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        Your offer is {' '}
                        <strong>
                          {((parseFloat(formData.offeredBase) / marketData.extracted_data.percentile_50 - 1) * 100).toFixed(1)}%
                        </strong>
                        {' '}{parseFloat(formData.offeredBase) > marketData.extracted_data.percentile_50 ? 'above' : 'below'} market median
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {marketData?.data_sources?.map((source: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {competitiveAnalysis && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      Your Competitive Position
                    </CardTitle>
                    <CardDescription>Analysis based on your Career Vault</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-green-600">
                          {competitiveAnalysis.competitive_score}/100
                        </p>
                        <p className="text-xs text-muted-foreground">Competitive Score</p>
                      </div>
                      <Separator orientation="vertical" className="h-16" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">
                          You rank in the <strong>{competitiveAnalysis.target_percentile}th percentile</strong> for this role
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {competitiveAnalysis.recommended_positioning}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Your Above-Market Strengths</h4>
                      <div className="grid gap-2">
                        {competitiveAnalysis.above_market_strengths?.map((strength: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {competitiveAnalysis.skill_premiums && Object.keys(competitiveAnalysis.skill_premiums).length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Skill Premium Analysis</h4>
                          {Object.entries(competitiveAnalysis.skill_premiums).map(([skill, data]: [string, any]) => (
                            data.has_skill && (
                              <div key={skill} className="flex justify-between items-center text-sm">
                                <span>{skill}</span>
                                <Badge variant="outline" className="text-green-600">
                                  +${data.estimated_value_add?.toLocaleString() || 'TBD'}
                                </Badge>
                              </div>
                            )
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
                <CardDescription>Enter your job offer information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., VP of Operations"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    placeholder="15"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                  />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="offeredBase">Offered Base Salary</Label>
                  <Input
                    id="offeredBase"
                    type="number"
                    placeholder="190000"
                    value={formData.offeredBase}
                    onChange={(e) => setFormData({...formData, offeredBase: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="offeredBonus">Offered Bonus (%)</Label>
                  <Input
                    id="offeredBonus"
                    type="number"
                    placeholder="20"
                    value={formData.offeredBonus}
                    onChange={(e) => setFormData({...formData, offeredBonus: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="offeredEquity">Offered Equity (4-year vest)</Label>
                  <Input
                    id="offeredEquity"
                    type="number"
                    placeholder="50000"
                    value={formData.offeredEquity}
                    onChange={(e) => setFormData({...formData, offeredEquity: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offer Analysis</CardTitle>
                <CardDescription>Understanding your offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.offeredBase ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Base Salary</span>
                        <Badge variant="outline">
                          ${parseInt(formData.offeredBase).toLocaleString()}
                        </Badge>
                      </div>
                      {formData.offeredBonus && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Annual Bonus ({formData.offeredBonus}%)</span>
                          <Badge variant="outline">
                            ${Math.round(parseInt(formData.offeredBase) * parseInt(formData.offeredBonus) / 100).toLocaleString()}
                          </Badge>
                        </div>
                      )}
                      {formData.offeredEquity && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Equity (Year 1)</span>
                          <Badge variant="outline">
                            ${Math.round(parseInt(formData.offeredEquity) / 4).toLocaleString()}
                          </Badge>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Year 1 Comp</span>
                        <Badge variant="default">
                          ${(
                            parseInt(formData.offeredBase || "0") +
                            Math.round(parseInt(formData.offeredBase || "0") * parseInt(formData.offeredBonus || "0") / 100) +
                            Math.round(parseInt(formData.offeredEquity || "0") / 4)
                          ).toLocaleString()}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Negotiation Strategy</h4>
                      <p className="text-xs text-muted-foreground">
                        Research similar roles on Glassdoor, Levels.fyi, and PayScale.com to determine if this offer is competitive.
                      </p>
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Key Negotiation Levers:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li>Base salary increase</li>
                          <li>Signing bonus ($25k-$50k)</li>
                          <li>Equity increase (+25-50%)</li>
                          <li>Bonus percentage (ask for 5-10% more)</li>
                          <li>Accelerated review (6 months)</li>
                          <li>Additional PTO (+5 days)</li>
                          <li>Professional development budget</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter your offer details to see analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Negotiation Script</CardTitle>
                  <CardDescription>
                    {aiNegotiationScript ? "AI-generated personalized script" : "Professional counter-offer template"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(aiNegotiationScript || sampleScript)}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Script"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={aiNegotiationScript || sampleScript}
                readOnly
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-4">
                {aiNegotiationScript ? (
                  <>✨ This script was generated using your Career Vault data and real-time market research</>
                ) : (
                  <>💡 Tip: Generate your Salary Intelligence Report above to get a personalized script with market data and your achievements</>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p><strong>Always negotiate:</strong> 85% of candidates who negotiate receive a higher offer. The worst they can say is no.</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p><strong>Be specific with numbers:</strong> Don't say "higher salary." Say "I was expecting $X based on market research."</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p><strong>Show enthusiasm:</strong> Always express excitement about the role before discussing compensation.</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <p><strong>Use data:</strong> Reference market research from PayScale, Glassdoor, or Levels.fyi to justify your ask.</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">5</Badge>
                <p><strong>Time it right:</strong> Negotiate after receiving the written offer, not during interviews.</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">6</Badge>
                <p><strong>Have alternatives ready:</strong> If base is fixed, negotiate signing bonus, equity, PTO, or professional development budget.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalaryNegotiation;
