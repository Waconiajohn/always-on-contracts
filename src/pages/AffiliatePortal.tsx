import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, DollarSign, Users, TrendingUp, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AffiliatePortal() {
  const [loading, setLoading] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [affiliate, setAffiliate] = useState<any>(null);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    monthlyRecurring: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load affiliate account
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData);
        setPayoutEmail(affiliateData.payout_email ?? session.user.email ?? '');
        loadStats(affiliateData.id);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    }
  };

  const loadStats = async (affiliateId: string) => {
    try {
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('*, subscription:subscriptions(*)')
        .eq('affiliate_id', affiliateId);

      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount_cents, status')
        .eq('affiliate_id', affiliateId);

      const totalEarnings = commissions?.reduce((sum, c) => sum + (c.amount_cents || 0), 0) || 0;
      const paidCommissions = commissions?.filter(c => c.status === 'paid') || [];
      const monthlyRecurring = paidCommissions.reduce((sum, c) => sum + (c.amount_cents || 0), 0);

      const converted = referrals?.filter(r => r.converted_at).length || 0;
      const conversionRate = referrals?.length ? (converted / referrals.length) * 100 : 0;

      setStats({
        totalReferrals: referrals?.length || 0,
        totalEarnings: totalEarnings / 100,
        monthlyRecurring: monthlyRecurring / 100,
        conversionRate: Math.round(conversionRate)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-affiliate-code', {
        body: { payoutEmail }
      });

      if (error) throw error;

      setAffiliate(data.affiliate);
      toast.success("Affiliate account created!");
      loadAffiliateData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate account");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/pricing?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(affiliate.referral_code);
    toast.success("Referral code copied!");
  };

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Our Affiliate Program</CardTitle>
            <CardDescription>
              Earn 30% recurring commission on every referral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-email">Payout Email</Label>
              <Input
                id="payout-email"
                type="email"
                placeholder="your@email.com"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateAccount} 
              disabled={loading || !payoutEmail}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Affiliate Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
            <p className="text-muted-foreground">Track your referrals and earnings</p>
          </div>
          <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
            {affiliate.status}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Recurring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRecurring.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Tools</CardTitle>
            <CardDescription>
              Share your unique code or link to start earning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={affiliate.referral_code} 
                  readOnly 
                  className="font-mono"
                />
                <Button onClick={copyReferralCode} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Referral Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={`${window.location.origin}/pricing?ref=${affiliate.referral_code}`}
                  readOnly 
                  className="text-sm"
                />
                <Button onClick={copyReferralLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Commission Rate:</strong> {affiliate.commission_rate}% recurring
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You earn {affiliate.commission_rate}% of every subscription payment from your referrals, for as long as they remain subscribed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}