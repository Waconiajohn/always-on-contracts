import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import CareerVaultOnboarding from './CareerVaultOnboarding';
import CareerVaultDashboardV2 from './CareerVaultDashboardV2';

export default function UnifiedCareerVault() {
  const [vaultState, setVaultState] = useState<'loading' | 'onboarding' | 'dashboard'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    checkVaultState();
  }, []);

  const checkVaultState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: vault } = await supabase
        .from('career_vault')
        .select('id, onboarding_step, resume_raw_text, review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      // No vault OR onboarding not started/incomplete → Show onboarding
      if (!vault || !vault.resume_raw_text || vault.onboarding_step === 'not_started') {
        setVaultState('onboarding');
        return;
      }

      // Vault exists and has resume → Show dashboard
      setVaultState('dashboard');
    } catch (error) {
      console.error('Error checking vault state:', error);
      setVaultState('onboarding'); // Default to onboarding on error
    }
  };

  if (vaultState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (vaultState === 'onboarding') {
    return <CareerVaultOnboarding />;
  }

  return <CareerVaultDashboardV2 />;
}
