import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Shield, Calendar, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const FivePhaseCalculator = () => {
  const [inputs, setInputs] = useState({
    monthlyExpenses: "",
    currentSavings: "",
    monthsSearching: "",
    currentSalary: "",
    ageBracket: "",
  });

  const [results, setResults] = useState<any>(null);

  const calculateResults = () => {
    const expenses = parseFloat(inputs.monthlyExpenses) || 0;
    const savings = parseFloat(inputs.currentSavings) || 0;
    const months = parseFloat(inputs.monthsSearching) || 0;
    const salary = parseFloat(inputs.currentSalary) || 0;

    // Runway calculations
    const runwayMonths = expenses > 0 ? savings / expenses : 0;
    const marketAverage = 10.8;
    const gap = marketAverage - runwayMonths;

    // Financial projections
    const savingsDepletion = expenses * marketAverage;
    const contractRateHourly = salary > 0 ? salary / 2080 : 0;
    const contractIncomePartTime = contractRateHourly * 20 * 4;
    const contractIncomeFull = contractRateHourly * 40 * 4;
    const runwayExtensionPart = contractIncomePartTime / expenses;
    const runwayExtensionFull = contractIncomeFull >= expenses ? 999 : 0;

    // Salary degradation warnings
    const degradationLow = salary * 0.15;
    const degradationAvg = salary * 0.25;
    const lifetimeImpactLow = degradationLow * 5;
    const lifetimeImpactAvg = degradationAvg * 5;

    // Risk scores (0-100)
    const careerRisk = months > 6 ? 90 : months > 3 ? 60 : 30;
    const investmentRisk = 70; // Placeholder - would integrate with actual portfolio
    const taxRisk = months > 0 ? 30 : 70; // Low income = opportunity
    const securityRisk = runwayMonths < 6 ? 90 : runwayMonths < 12 ? 60 : 30;
    const estateRisk = 50; // Placeholder

    setResults({
      runwayMonths,
      gap,
      savingsDepletion,
      contractRateHourly,
      contractIncomePartTime,
      contractIncomeFull,
      runwayExtensionPart,
      runwayExtensionFull,
      degradationLow,
      degradationAvg,
      lifetimeImpactLow,
      lifetimeImpactAvg,
      careerRisk,
      investmentRisk,
      taxRisk,
      securityRisk,
      estateRisk,
    });
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: "CRITICAL", color: "text-destructive" };
    if (score >= 40) return { label: "WARNING", color: "text-yellow-600" };
    return { label: "ADEQUATE", color: "text-primary" };
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>5-Phase Vulnerability Assessment</CardTitle>
        <CardDescription>
          Comprehensive career + financial health analysis based on FirstSource Team research
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyExpenses">Monthly Expenses</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthlyExpenses"
                type="number"
                placeholder="8000"
                className="pl-9"
                value={inputs.monthlyExpenses}
                onChange={(e) => setInputs({ ...inputs, monthlyExpenses: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSavings">Current Savings</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentSavings"
                type="number"
                placeholder="150000"
                className="pl-9"
                value={inputs.currentSavings}
                onChange={(e) => setInputs({ ...inputs, currentSavings: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthsSearching">Months Job Searching</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthsSearching"
                type="number"
                placeholder="3"
                className="pl-9"
                value={inputs.monthsSearching}
                onChange={(e) => setInputs({ ...inputs, monthsSearching: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSalary">Current/Target Salary</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentSalary"
                type="number"
                placeholder="200000"
                className="pl-9"
                value={inputs.currentSalary}
                onChange={(e) => setInputs({ ...inputs, currentSalary: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageBracket">Age Bracket</Label>
            <Select value={inputs.ageBracket} onValueChange={(value) => setInputs({ ...inputs, ageBracket: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select age bracket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-50">Under 50</SelectItem>
                <SelectItem value="50-55">50-55</SelectItem>
                <SelectItem value="55-60">55-60</SelectItem>
                <SelectItem value="60-plus">60+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculateResults} className="w-full" size="lg">
          <TrendingUp className="h-4 w-4 mr-2" />
          Calculate My 5-Phase Assessment
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-6 pt-6 border-t">
            {/* Runway Analysis */}
            <Card className={`border-2 ${results.gap > 0 ? 'border-destructive/50' : 'border-primary/50'}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Runway Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{results.runwayMonths.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Your Runway (months)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">10.8</div>
                    <div className="text-xs text-muted-foreground">Market Average (months)</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${results.gap > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {results.gap.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Gap (months)</div>
                  </div>
                </div>
                {results.gap > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold">CRITICAL:</span> Your runway is {results.gap.toFixed(1)} months short of the market average. Consider immediate action.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Risk Scores */}
            <div className="space-y-3">
              <h3 className="font-semibold">5-Phase Risk Assessment</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 1: Career & Income Risk</span>
                    <Badge variant={results.careerRisk >= 70 ? "destructive" : "outline"}>
                      {getRiskLevel(results.careerRisk).label}
                    </Badge>
                  </div>
                  <Progress value={results.careerRisk} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 2: Investment Protection</span>
                    <Badge variant={results.investmentRisk >= 70 ? "destructive" : "outline"}>
                      {getRiskLevel(results.investmentRisk).label}
                    </Badge>
                  </div>
                  <Progress value={results.investmentRisk} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 3: Tax Efficiency (Opportunity)</span>
                    <Badge variant={results.taxRisk < 40 ? "default" : "outline"}>
                      {results.taxRisk < 40 ? "HIGH OPPORTUNITY" : "STANDARD"}
                    </Badge>
                  </div>
                  <Progress value={100 - results.taxRisk} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 4: Financial Security</span>
                    <Badge variant={results.securityRisk >= 70 ? "destructive" : "outline"}>
                      {getRiskLevel(results.securityRisk).label}
                    </Badge>
                  </div>
                  <Progress value={results.securityRisk} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 5: Estate & Legacy</span>
                    <Badge variant="outline">ASSESSMENT NEEDED</Badge>
                  </div>
                  <Progress value={results.estateRisk} className="h-2" />
                </div>
              </div>
            </div>

            {/* Contract Bridge Strategy */}
            {results.contractRateHourly > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Income Bridge Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Target hourly rate: <span className="font-semibold text-foreground">${results.contractRateHourly.toFixed(2)}/hour</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Part-Time (20 hrs/week)</div>
                      <div className="text-2xl font-bold text-primary">${results.contractIncomePartTime.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Extends runway by {results.runwayExtensionPart.toFixed(1)} months
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Full-Time (40 hrs/week)</div>
                      <div className="text-2xl font-bold text-primary">${results.contractIncomeFull.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {results.runwayExtensionFull > 100 ? "Extends runway indefinitely" : "Extends runway significantly"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contract roles engage 83% faster (3-month average vs 10.8 months). Many convert to permanent within 12 months.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
