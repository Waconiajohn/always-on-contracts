import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function RedeemCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateDeviceFingerprint = () => {
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return btoa(JSON.stringify(data));
  };

  const handleRedeem = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to redeem your code");
        navigate("/auth");
        return;
      }

      const deviceFingerprint = generateDeviceFingerprint();

      const { data, error } = await supabase.functions.invoke('redeem-retirement-code', {
        body: { code, deviceFingerprint }
      });

      if (error) throw error;

      setSuccess(true);
      toast.success(data.message || "Access code redeemed successfully!");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast.error(error.message || "Failed to redeem code");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Welcome to CareerIQ!</CardTitle>
            <CardDescription>
              Your retirement client access has been activated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You now have lifetime access to all Concierge Elite features.
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary" />
            <CardTitle>Retirement Client Access</CardTitle>
          </div>
          <CardDescription>
            Enter your unique access code to unlock lifetime Concierge Elite features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg"
              maxLength={20}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">What you'll get:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Lifetime access to all Concierge Elite features</li>
              <li>• Automatic refund of any active subscription</li>
              <li>• Priority support from your career team</li>
              <li>• Seamless retirement planning integration</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleRedeem} 
            disabled={loading || !code}
            className="w-full"
          >
            {loading ? "Redeeming..." : "Redeem Access Code"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/pricing")}
            className="w-full"
          >
            Back to Pricing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}