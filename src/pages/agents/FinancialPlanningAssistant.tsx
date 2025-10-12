import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FinancialPlanningAssistant() {
  const [currentAge, setCurrentAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("65");
  const [currentIncome, setCurrentIncome] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [advisoryType, setAdvisoryType] = useState("comprehensive");
  const [advisoryResult, setAdvisoryResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetAdvice = async () => {
    if (!currentAge || !currentIncome) {
      toast({ 
        title: "Missing information", 
        description: "Please enter your age and current income", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-planning-advisor', {
        body: {
          currentAge: parseInt(currentAge),
          retirementAge: parseInt(retirementAge),
          currentIncome: parseFloat(currentIncome),
          currentSavings: parseFloat(currentSavings || "0"),
          monthlyExpenses: parseFloat(monthlyExpenses || "0"),
          careerGoals,
          advisoryType
        }
      });

      if (error) throw error;
      setAdvisoryResult(data);
      toast({ title: "Analysis complete!", description: "Review your personalized financial guidance" });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Financial Planning Assistant</h1>
        <p className="text-muted-foreground">Career-aligned wealth building and retirement planning</p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This tool provides educational information only and is not professional financial advice. 
          Consult a licensed financial advisor for personalized guidance.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Profile</CardTitle>
            <CardDescription>Enter your current financial information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentAge">Current Age *</Label>
                <Input
                  id="currentAge"
                  type="number"
                  placeholder="30"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="retirementAge">Retirement Age</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  placeholder="65"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currentIncome">Annual Income *</Label>
              <Input
                id="currentIncome"
                type="number"
                placeholder="100000"
                value={currentIncome}
                onChange={(e) => setCurrentIncome(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="currentSavings">Current Savings/Investments</Label>
              <Input
                id="currentSavings"
                type="number"
                placeholder="50000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="monthlyExpenses">Monthly Expenses</Label>
              <Input
                id="monthlyExpenses"
                type="number"
                placeholder="5000"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                placeholder="e.g., Become VP in 5 years, Start consulting business, Switch to higher-paying industry"
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="advisoryType">Advisory Focus</Label>
              <Select value={advisoryType} onValueChange={setAdvisoryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-phase-vulnerability">5-Phase Vulnerability Assessment</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Planning</SelectItem>
                  <SelectItem value="retirement-planning">Retirement Planning</SelectItem>
                  <SelectItem value="career-transition">Career Transition</SelectItem>
                  <SelectItem value="income-optimization">Income Optimization</SelectItem>
                  <SelectItem value="wealth-acceleration">Wealth Acceleration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGetAdvice} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              Get Financial Guidance
            </Button>
          </CardContent>
        </Card>

        {advisoryResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Health Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-1">Financial Health</p>
                    <p className="text-sm">{advisoryResult.analysis?.currentFinancialHealth}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-1">Retirement Status</p>
                    <p className="text-sm">{advisoryResult.analysis?.retirementReadiness}</p>
                  </div>
                </div>

                {advisoryResult.analysis?.monthlyGap && (
                  <div className="p-3 bg-primary/10 rounded-md border border-primary">
                    <p className="text-xs font-semibold mb-1">Monthly Savings Gap</p>
                    <p className="text-lg font-bold">{advisoryResult.analysis.monthlyGap}</p>
                  </div>
                )}

                {advisoryResult.analysis?.projectedRetirementCorpus && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-1">Projected Retirement Corpus</p>
                    <p className="text-lg font-bold">{advisoryResult.analysis.projectedRetirementCorpus}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {advisoryResult.recommendations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {advisoryResult.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                        <div className="flex items-start gap-2 mb-1">
                          <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                        </div>
                        <p className="text-sm font-medium">{rec.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
                        <p className="text-xs text-muted-foreground">Timeline: {rec.timeline}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {advisoryResult.scenarioModeling && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Scenario Modeling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {advisoryResult.scenarioModeling.conservative && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-semibold mb-1">Conservative</p>
                      <p className="text-sm">{advisoryResult.scenarioModeling.conservative}</p>
                    </div>
                  )}
                  {advisoryResult.scenarioModeling.moderate && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-semibold mb-1">Moderate</p>
                      <p className="text-sm">{advisoryResult.scenarioModeling.moderate}</p>
                    </div>
                  )}
                  {advisoryResult.scenarioModeling.aggressive && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-semibold mb-1">Aggressive</p>
                      <p className="text-sm">{advisoryResult.scenarioModeling.aggressive}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {advisoryResult.actionPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Action Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {advisoryResult.actionPlan.immediate?.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Immediate Actions:</Label>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {advisoryResult.actionPlan.immediate.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {advisoryResult.actionPlan.shortTerm?.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Short-Term (3-12 months):</Label>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {advisoryResult.actionPlan.shortTerm.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {advisoryResult.actionPlan.longTerm?.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Long-Term (1+ years):</Label>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {advisoryResult.actionPlan.longTerm.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}