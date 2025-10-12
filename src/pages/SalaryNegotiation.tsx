import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SalaryNegotiation = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: "",
    location: "",
    yearsExperience: "",
    offeredBase: "",
    offeredBonus: "",
    offeredEquity: ""
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Negotiation script copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
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
                <TrendingUp className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Coming Soon: PayScale Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    We're integrating with PayScale.com to provide real-time market salary data. 
                    For now, use this tool to structure your negotiation approach.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <CardDescription>Professional counter-offer template</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(sampleScript)}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Script"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sampleScript}
                readOnly
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-4">
                💡 Tip: Customize this script with specific achievements from your Career Vault and research comparable salaries for your market.
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
