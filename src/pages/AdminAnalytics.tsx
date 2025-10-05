import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DollarSign, Users, TrendingUp, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  totalRevenue: number;
  totalAffiliates: number;
  totalReferrals: number;
  pendingCommissions: number;
  activeSubscribers: number;
  retirementClients: number;
}

const AdminAnalyticsContent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalAffiliates: 0,
    totalReferrals: 0,
    pendingCommissions: 0,
    activeSubscribers: 0,
    retirementClients: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roles?.some(r => r.role === 'admin')) {
        navigate('/home');
        return;
      }

      // Fetch affiliates count
      const { count: affiliatesCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true });

      // Fetch referrals count
      const { count: referralsCount } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true });

      // Fetch pending commissions
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount_cents')
        .eq('status', 'pending');

      const pendingTotal = commissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0;

      // Fetch active subscriptions count (would need stripe integration)
      const { count: subscribersCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch retirement clients count
      const { count: retirementCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'retirement_client');

      setAnalytics({
        totalRevenue: 0, // Would calculate from Stripe
        totalAffiliates: affiliatesCount || 0,
        totalReferrals: referralsCount || 0,
        pendingCommissions: pendingTotal / 100,
        activeSubscribers: subscribersCount || 0,
        retirementClients: retirementCount || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Admin Portal
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              Business metrics and performance insights
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From all subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalAffiliates}</div>
                <p className="text-xs text-muted-foreground">
                  Driving referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  All time referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.pendingCommissions.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeSubscribers}</div>
                <p className="text-xs text-muted-foreground">
                  Paying customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retirement Clients</CardTitle>
                <Badge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.retirementClients}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime access holders
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest business events and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity feed coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const AdminAnalytics = () => {
  return (
    <ProtectedRoute>
      <AdminAnalyticsContent />
    </ProtectedRoute>
  );
};

export default AdminAnalytics;