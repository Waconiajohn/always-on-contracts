import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, DollarSign, Heart, FileText, Award, BookOpen, ExternalLink } from "lucide-react";
import { executiveSummaryStats, topTierManagers, marketComparisons, citations, disclaimerText } from "@/data/researchContent";
import { SchedulingCTA } from "@/components/SchedulingCTA";

const ResearchHub = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Award className="h-3 w-3 mr-1" />
            Evidence-Based Career & Financial Intelligence
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Research Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive data backing CareerIQ's integrated career transition and financial protection methodology
          </p>
        </div>

        <Tabs defaultValue="summary" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Career</span>
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Investment</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Tax</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Planning</span>
            </TabsTrigger>
            <TabsTrigger value="longevity" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Longevity</span>
            </TabsTrigger>
            <TabsTrigger value="estate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Estate</span>
            </TabsTrigger>
            <TabsTrigger value="citations" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Citations</span>
            </TabsTrigger>
          </TabsList>

          {/* Executive Summary */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Executive Summary Dashboard</CardTitle>
                <CardDescription>
                  Key statistics powering CareerIQ + FirstSource Team integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {executiveSummaryStats.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-primary mb-2">{item.stat}</div>
                        <div className="text-sm font-medium mb-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.source}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>The Integration Advantage</CardTitle>
                <CardDescription>
                  Why coordinated career + financial planning delivers superior outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-destructive">Traditional Fragmented Approach</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 10.8 month average executive unemployment</li>
                      <li>• Buy-and-hold loses 54% in crashes</li>
                      <li>• $47K annual tax overpayment</li>
                      <li>• 42% reduced outcomes (fragmentation)</li>
                      <li>• Career and finance managed separately</li>
                      <li>• Crisis response takes 3x longer</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-primary">CareerIQ + FirstSource Integration</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>3-5 month average placement (FirstSource methodology)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Tactical management: -12% avg in 2008 ($420K protected)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>$234K lifetime tax savings (strategic Roth conversions)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Coordinated planning (no fragmentation loss)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Career transitions create financial opportunities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Guaranteed income + tactical growth strategy</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Transition Research */}
          <TabsContent value="career" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Career Transition Crisis Research</CardTitle>
                <CardDescription>
                  Age discrimination data and FirstSource Team proven solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">The 10.8-Month Crisis</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">AARP 2024 Research</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>10.8 months</strong> average executive unemployment (50+)</li>
                        <li>• <strong>90%</strong> experience age discrimination</li>
                        <li>• <strong>74%</strong> believe age is hiring barrier</li>
                        <li>• <strong>69%</strong> never regain previous compensation</li>
                        <li>• <strong>$280,000+</strong> lifetime earnings loss</li>
                        <li>• <strong>78%</strong> eliminated by AI screening</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">FirstSource Team Results</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>3-5 months</strong> average placement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>3-5x faster</strong> reemployment vs traditional</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>100,000+ professionals</strong> served</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>43-60 day</strong> documented placements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>Age-neutral positioning</strong> eliminates bias</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          <span><strong>Direct decision-maker</strong> access bypasses AI</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Real Success Stories</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-primary mb-2">43 days</div>
                        <p className="text-sm text-muted-foreground">
                          "First Source Team helped me land a VP role in just 8 weeks. Their strategic approach made all the difference."
                          <span className="block mt-2 font-medium text-foreground">— Jeffrey</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-primary mb-2">60 days</div>
                        <p className="text-sm text-muted-foreground">
                          "I interviewed with three companies and had two offers in 60 days."
                          <span className="block mt-2 font-medium text-foreground">— Anonymous Executive</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-primary mb-2">Consistent</div>
                        <p className="text-sm text-muted-foreground">
                          "I landed a job! It was not fast, but it was a steady stream of recruiters."
                          <span className="block mt-2 font-medium text-foreground">— Sherrille</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Protection */}
          <TabsContent value="investment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Protection: Tactical Management Evidence</CardTitle>
                <CardDescription>
                  AdvisorShare + Potomac Fund Management institutional-grade results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">The $420,000 Protection Difference (2008)</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-destructive/10 border-destructive/20">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3 text-destructive">Buy-and-Hold Approach</h4>
                        <div className="text-4xl font-bold text-destructive mb-2">-54%</div>
                        <p className="text-sm mb-4">$1M → $460,000</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Rode entire crash down</li>
                          <li>• 5.5 years to break even</li>
                          <li>• Forced selling at bottom</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3 text-primary">Tactical Management</h4>
                        <div className="text-4xl font-bold text-primary mb-2">-12%</div>
                        <p className="text-sm mb-4">$1M → $880,000</p>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Moved to 100% cash early</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>$420K wealth protected</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Continued growing in recovery</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Tier Tactical Managers: Audited Results</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    After evaluating 200+ tactical management firms, AdvisorShare selected 15 meeting strict criteria. 
                    Below are anonymized results of top-performing managers with GIPS or auditor-verified track records.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Manager</th>
                          <th className="text-right p-2">Years</th>
                          <th className="text-right p-2">Return %</th>
                          <th className="text-right p-2">Max DD %</th>
                          <th className="text-right p-2">vs S&P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topTierManagers.map((manager) => (
                          <tr key={manager.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">Top Tier Firm #{manager.id}</td>
                            <td className="text-right p-2">{manager.years}</td>
                            <td className="text-right p-2 font-semibold text-primary">{manager.annualizedReturn}%</td>
                            <td className="text-right p-2">{manager.maxDrawdown}%</td>
                            <td className="text-right p-2 font-semibold text-primary">+{manager.outperformance}%</td>
                          </tr>
                        ))}
                        <tr className="border-b bg-muted/30">
                          <td className="p-2 font-semibold">S&P 500 Benchmark</td>
                          <td className="text-right p-2">22.7</td>
                          <td className="text-right p-2">10.05%</td>
                          <td className="text-right p-2 text-destructive">-51.00%</td>
                          <td className="text-right p-2">0.00%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Bear & Sideways Market Outperformance</h3>
                  <div className="space-y-3">
                    {marketComparisons.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.period}</div>
                        </div>
                        <div className="flex gap-8 items-center text-sm">
                          <div>
                            <div className="text-muted-foreground">Tactical</div>
                            <div className={`font-semibold ${item.tactical >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {item.tactical > 0 ? '+' : ''}{item.tactical}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">S&P 500</div>
                            <div className="font-semibold text-destructive">{item.sp500}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Advantage</div>
                            <div className="font-semibold text-primary">+{item.outperformance}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Optimization */}
          <TabsContent value="tax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Optimization Research</CardTitle>
                <CardDescription>
                  Strategic Roth conversions and coordinated tax planning evidence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary mb-2">$234,000</div>
                      <div className="font-semibold mb-2">Average Roth Conversion Savings</div>
                      <p className="text-sm text-muted-foreground">
                        Strategic Roth conversions during low-income periods (like career transitions) 
                        save the average executive $234K in lifetime taxes.
                      </p>
                      <p className="text-xs text-muted-foreground mt-3">Source: American Institute of CPAs</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-destructive">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-destructive mb-2">$47,000</div>
                      <div className="font-semibold mb-2">Annual Tax Overpayment</div>
                      <p className="text-sm text-muted-foreground">
                        Poor coordination between advisors, CPAs, and investment managers causes 
                        average executive to overpay $47K annually—$1.41M over career.
                      </p>
                      <p className="text-xs text-muted-foreground mt-3">Source: Tax Foundation</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Perfect Conversion Windows</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        During Career Transition
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        10.8-month average unemployment creates rare low-income window
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Convert months 3-8 of job search</li>
                        <li>• Tax cost: 12-22% bracket</li>
                        <li>• vs 24-37% during employment</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Market Downturn
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Portfolio values temporarily depressed
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Convert more shares at lower tax cost</li>
                        <li>• Maximize tax-free growth potential</li>
                        <li>• Time with tactical management signals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Citations Library */}
          <TabsContent value="citations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Research Citations Library</CardTitle>
                <CardDescription>
                  All claims backed by peer-reviewed research, government data, and industry reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {citations.map((citation) => (
                    <div key={citation.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{citation.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{citation.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium">{citation.source}</span>
                            {citation.date && <span>• {citation.date}</span>}
                          </div>
                        </div>
                        {citation.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={citation.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="my-12">
          <SchedulingCTA />
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground whitespace-pre-line">{disclaimerText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResearchHub;
