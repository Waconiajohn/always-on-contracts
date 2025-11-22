import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseEnhanceBulletProps {
  originalBullet: string;
  currentBullet: string;
  requirement: string;
  jobContext?: string;
  onSuccess: (enhancedBullet: string) => void;
}

export function useEnhanceBullet({
  originalBullet,
  currentBullet,
  requirement,
  jobContext,
  onSuccess
}: UseEnhanceBulletProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const enhance = async (guidance: string) => {
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('further-enhance-bullet', {
        body: {
          originalBullet,
          currentEnhancedBullet: currentBullet,
          requirement,
          guidance,
          jobContext
        }
      });

      if (error) throw error;
      if (!data?.enhancedBullet) throw new Error('No enhanced bullet returned');

      onSuccess(data.enhancedBullet);
      toast({
        title: "Bullet enhanced",
        description: "Your bullet has been successfully enhanced"
      });
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Failed to enhance bullet",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return { enhance, isEnhancing };
}
