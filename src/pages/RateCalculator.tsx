import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RateCalculatorContent = () => {
  const navigate = useNavigate();
  const [yearsExperience, setYearsExperience] = useState("10");
  const [industry, setIndustry] = useState("operations");
  const [location, setLocation] = useState("national");
  const [certifications, setCertifications] = useState("yes");
  const [calculatedRate, setCalculatedRate] = useState<{ min: number; max: number } | null>(null);

  const calculateRate = () => {
    // Base rate calculation algorithm
    let baseRate = 50;
    const years = parseInt(yearsExperience);

    // Experience multiplier
    if (years >= 5 && years < 10) baseRate = 65;
    else if (years >= 10 && years < 15) baseRate = 85;
    else if (years >= 15 && years < 20) baseRate = 105;
    else if (years >= 20 && years < 25) baseRate = 125;
    else if (years >= 25) baseRate = 140;

    // Industry adjustment
    const industryMultipliers: Record<string, number> = {
      operations: 1.0,
      finance: 1.15,
      technology: 1.2,
      healthcare: 1.1,
      manufacturing: 0.95,
      retail: 0.9,
      consulting: 1.25,
    };
    baseRate *= industryMultipliers[industry] || 1.0;

    // Location adjustment
    const locationMultipliers: Record<string, number> = {
      national: 1.0,
      major_metro: 1.15,
      regional: 0.9,
      remote: 0.95,
    };
    baseRate *= locationMultipliers[location] || 1.0;

    // Certifications bonus
    if (certifications === "yes") {
      baseRate *= 1.1;
    }

    const min = Math.round(baseRate * 0.85);
    const max = Math.round(baseRate * 1.15);

    setCalculatedRate({ min, max });
  };

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
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Premium Rate Calculator</h1>
            <p className="text-xl text-muted-foreground">
              Calculate your target hourly rate based on experience and market factors
            </p>
          </div>

          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Calculator className="h-7 w-7 text-primary" />
                Rate Calculation Factors
              </CardTitle>
              <CardDescription className="text-lg">
                Provide your details to get a personalized rate recommendation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-lg">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-lg">Primary Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-lg">Work Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National (Multiple Cities)</SelectItem>
                    <SelectItem value="major_metro">Major Metro (NYC, SF, LA)</SelectItem>
                    <SelectItem value="regional">Regional Markets</SelectItem>
                    <SelectItem value="remote">Remote Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications" className="text-lg">Professional Certifications</Label>
                <Select value={certifications} onValueChange={setCertifications}>
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes (MBA, PMP, CPA, etc.)</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculateRate} 
                className="w-full text-lg h-12"
                size="lg"
              >
                Calculate My Rate
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {calculatedRate && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <TrendingUp className="h-7 w-7 text-primary" />
                  Your Recommended Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold text-primary mb-4">
                    ${calculatedRate.min} - ${calculatedRate.max}
                  </div>
                  <p className="text-xl text-muted-foreground">Per Hour</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-6 border-t">
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-3xl font-bold mb-2">${calculatedRate.min * 40 * 4}</div>
                        <p className="text-muted-foreground">Monthly (Conservative)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-3xl font-bold mb-2">${calculatedRate.max * 40 * 4}</div>
                        <p className="text-muted-foreground">Monthly (Premium)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-xl font-semibold">Rate Positioning Strategy</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">Tip 1</Badge>
                      <p className="text-lg">
                        Start negotiations at ${calculatedRate.max}/hr to establish premium positioning
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">Tip 2</Badge>
                      <p className="text-lg">
                        Your "walk away" rate should be ${calculatedRate.min}/hr minimum
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">Tip 3</Badge>
                      <p className="text-lg">
                        Emphasize ROI: Show how your expertise saves/earns 10x your rate
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">Tip 4</Badge>
                      <p className="text-lg">
                        Position yourself as "interim executive" not "contractor" to justify premium rates
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/agencies')} 
                  className="w-full text-lg h-12 mt-6"
                  size="lg"
                >
                  Find Opportunities at This Rate
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Market Context */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-2xl">Market Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl font-bold mb-2">$50-80</div>
                  <p className="text-muted-foreground">Entry-level interim roles (5-10 years)</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">$80-120</div>
                  <p className="text-muted-foreground">Mid-level executives (10-20 years)</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">$120-200+</div>
                  <p className="text-muted-foreground">Senior executives (20+ years)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const RateCalculator = () => {
  return (
    <ProtectedRoute>
      <RateCalculatorContent />
    </ProtectedRoute>
  );
};

export default RateCalculator;
