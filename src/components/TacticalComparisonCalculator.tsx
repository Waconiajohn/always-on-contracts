import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Shield, DollarSign } from "lucide-react";

export const TacticalComparisonCalculator = () => {
  const [portfolioValue, setPortfolioValue] = useState("1000000");
  const [results, setResults] = useState<any>(null);

  const calculateComparison = () => {
    const value = parseFloat(portfolioValue) || 0;
    
    // 2008 Crisis scenario
    const buyAndHoldLoss2008 = value * 0.54; // -54%
    const buyAndHoldRemaining2008 = value - buyAndHoldLoss2008;
    const tacticalLoss2008 = value * 0.12; // -12%
    const tacticalRemaining2008 = value - tacticalLoss2008;
    const protectionDifference2008 = tacticalRemaining2008 - buyAndHoldRemaining2008;

    // Recovery timeline
    const buyAndHoldRecoveryYears = 5.5;
    const tacticalRecoveryYears = 1.5;

    // Long-term growth comparison (20 years)
    const buyAndHoldReturn = 0.1005; // 10.05% S&P 500 historical
    const tacticalReturn = 0.143; // 14.3% Top Tier Firm #1
    const buyAndHold20Year = value * Math.pow(1 + buyAndHoldReturn, 20);
    const tactical20Year = value * Math.pow(1 + tacticalReturn, 20);
    const longTermDifference = tactical20Year - buyAndHold20Year;

    // Sideways market (3% environment - Vanguard/Goldman projection)
    const buyAndHoldLowReturn = value * Math.pow(1.03, 10);
    const tacticalLowReturn = value * Math.pow(1.08, 10); // Tactical still outperforms
    const lowReturnDifference = tacticalLowReturn - buyAndHoldLowReturn;

    setResults({
      value,
      buyAndHoldLoss2008,
      buyAndHoldRemaining2008,
      tacticalLoss2008,
      tacticalRemaining2008,
      protectionDifference2008,
      buyAndHoldRecoveryYears,
      tacticalRecoveryYears,
      buyAndHold20Year,
      tactical20Year,
      longTermDifference,
      buyAndHoldLowReturn,
      tacticalLowReturn,
      lowReturnDifference,
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Tactical vs Buy-and-Hold Comparison</CardTitle>
        <CardDescription>
          See how tactical management would have protected your wealth in 2008—and how it performs in low-return environments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="portfolioValue">Your Portfolio Value</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="portfolioValue"
                type="number"
                placeholder="1000000"
                className="pl-9 text-lg"
                value={portfolioValue}
                onChange={(e) => setPortfolioValue(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={calculateComparison} size="lg">
            <Shield className="h-4 w-4 mr-2" />
            Calculate Protection
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6 pt-6 border-t">
            {/* 2008 Crisis Scenario */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                2008 Financial Crisis Scenario
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 text-destructive">Buy-and-Hold Approach</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting value:</span>
                        <span className="font-semibold">${results.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loss (54%):</span>
                        <span className="font-semibold text-destructive">-${results.buyAndHoldLoss2008.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-destructive/20">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-bold text-lg">${results.buyAndHoldRemaining2008.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">
                        Recovery time: {results.buyAndHoldRecoveryYears} years to break even
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 text-primary">Tactical Management</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting value:</span>
                        <span className="font-semibold">${results.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loss (12%):</span>
                        <span className="font-semibold text-destructive">-${results.tacticalLoss2008.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-bold text-lg text-primary">${results.tacticalRemaining2008.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">
                        Recovery time: {results.tacticalRecoveryYears} years to break even
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4 bg-primary/10 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Wealth Protected in 2008</div>
                      <div className="text-3xl font-bold text-primary">${results.protectionDifference2008.toLocaleString()}</div>
                    </div>
                    <Shield className="h-12 w-12 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    This protected wealth continued compounding during recovery while buy-and-hold investors 
                    waited {results.buyAndHoldRecoveryYears} years just to break even.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Long-Term Growth Comparison */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                20-Year Growth Comparison
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground mb-2">Buy-and-Hold (10.05% avg)</div>
                    <div className="text-2xl font-bold">${results.buyAndHold20Year.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="border-primary/50">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground mb-2">Tactical Management (14.3% avg)</div>
                    <div className="text-2xl font-bold text-primary">${results.tactical20Year.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-4 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Additional Wealth Created</div>
                  <div className="text-3xl font-bold text-primary">${results.longTermDifference.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on Top Tier Firm #1's audited 22.7-year track record vs S&P 500 benchmark
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Low-Return Environment */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Low-Return Environment (Next 10 Years)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vanguard projects 2.4-4.4% returns; Goldman Sachs forecasts 3% for S&P 500. 
                In sideways markets, tactical management's downside protection becomes even more valuable.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground mb-2">Buy-and-Hold (3% projected)</div>
                    <div className="text-2xl font-bold">${results.buyAndHoldLowReturn.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Only {((results.buyAndHoldLowReturn / results.value - 1) * 100).toFixed(1)}% total growth over decade
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-primary/50">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground mb-2">Tactical (8% conservative est.)</div>
                    <div className="text-2xl font-bold text-primary">${results.tacticalLowReturn.toLocaleString()}</div>
                    <div className="text-xs text-primary mt-1">
                      {((results.tacticalLowReturn / results.value - 1) * 100).toFixed(1)}% total growth over decade
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-4 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Projected Advantage in Low-Return Decade</div>
                  <div className="text-3xl font-bold text-primary">${results.lowReturnDifference.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
