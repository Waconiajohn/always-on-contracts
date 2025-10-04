import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  tier?: string;
  subscription_end?: string;
  is_retirement_client?: boolean;
  cancel_at_period_end?: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription({ subscribed: false });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;

      setSubscription(data);
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open customer portal');
    }
  };

  useEffect(() => {
    checkSubscription();

    // Re-check subscription status every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    // Re-check on auth state change
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      authSubscription.unsubscribe();
    };
  }, []);

  return { subscription, loading, checkSubscription, manageSubscription };
}