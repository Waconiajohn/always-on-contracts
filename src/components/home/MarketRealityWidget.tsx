import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, TrendingUp, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MarketRealityWidget = () => {
  const navigate = useNavigate();

  const { data: vaultData } = useQuery({
    queryKey: ["career-vault-completion"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("career_vault")
        .select("review_completion_percentage")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const completion = vaultData?.review_completion_percentage || 0;
  const isComplete = completion === 100;

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Market Reality Check</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Evidence-Based
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Market Reality */}
          <div className="space-y-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Market Reality</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-destructive font-bold">90%</span>
                <span className="text-muted-foreground">face age discrimination</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive font-bold">10.8 mo</span>
                <span className="text-muted-foreground">average executive search</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive font-bold">78%</span>
                <span className="text-muted-foreground">eliminated by AI screening</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive font-bold">-54%</span>
                <span className="text-muted-foreground">buy-and-hold loss (2008)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive font-bold">$47K</span>
                <span className="text-muted-foreground">annual tax overpayment</span>
              </div>
            </div>

            <div className="pt-3 border-t border-destructive/20">
              <div className="text-xs font-medium text-muted-foreground mb-2">Traditional Approach:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• 14+ months typical timeline</li>
                <li>• Fragmented advice (42% worse outcomes)</li>
                <li>• No downside protection</li>
              </ul>
            </div>
          </div>

          {/* Right: Your Strategic Position */}
          <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-primary mb-3">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">Your CareerIQ Advantage</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Career Vault:</span>
                <span className="font-semibold text-primary">{completion}% complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Strategic Positioning:</span>
                <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                  {isComplete ? "Active" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Age-Neutral Optimization:</span>
                <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                  {isComplete ? "Configured" : "Setup"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Financial Integration:</span>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="text-xs font-medium">Projected Timeline:</div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your path:</span>
                  <span className="font-semibold text-primary">3-5 months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs Market:</span>
                  <span className="font-semibold text-destructive">10.8 months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acceleration:</span>
                  <span className="font-semibold text-primary">65-75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          {!isComplete ? (
            <>
              <Button 
                onClick={() => navigate("/career-vault")} 
                className="w-full"
                size="lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Complete Career Vault to Activate
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {100 - completion}% remaining • Unlock strategic positioning
              </p>
            </>
          ) : (
            <>
              <Button 
                onClick={() => navigate("/job-search")} 
                className="w-full"
                size="lg"
              >
                Search Jobs
              </Button>
              <Button 
                onClick={() => navigate("/research-hub")} 
                variant="outline"
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Explore Research Hub
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
