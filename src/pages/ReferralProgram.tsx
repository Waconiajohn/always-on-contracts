import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Mail, Linkedin, Twitter, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const ReferralProgram = () => {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    signups: 0,
    earnings: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('referral_code, total_referrals, total_earnings_cents')
        .eq('user_id', user.id)
        .single();

      if (affiliate) {
        setReferralCode(affiliate.referral_code);
        setStats({
          totalReferrals: affiliate.total_referrals || 0,
          signups: affiliate.total_referrals || 0,
          earnings: (affiliate.total_earnings_cents || 0) / 100
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

  const referralUrl = referralCode 
    ? `${window.location.origin}/?ref=${referralCode}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard'
    });
  };

  const shareLinks = {
    email: `mailto:?subject=Check out CareerIQ&body=Join me on CareerIQ: ${referralUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=Join me on CareerIQ`
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Share CareerIQ with your network and earn rewards
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sign-Ups</p>
                <p className="text-2xl font-bold">{stats.signups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Earnings</p>
                <p className="text-2xl font-bold">${stats.earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to earn 30% commission on all referrals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode ? (
            <>
              <div className="flex gap-2">
                <Input value={referralUrl} readOnly />
                <Button onClick={handleCopy} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <a href={shareLinks.email}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Generate your referral code to start earning
              </p>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Generate Referral Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Badge variant="secondary" className="h-fit">1</Badge>
            <p className="text-sm">Share your unique referral link with friends and colleagues</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary" className="h-fit">2</Badge>
            <p className="text-sm">They sign up and subscribe to CareerIQ</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary" className="h-fit">3</Badge>
            <p className="text-sm">You earn 30% commission on their subscription every month</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralProgram;
