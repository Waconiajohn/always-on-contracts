import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ProgressUpdate {
  phase: string;
  percentage: number;
  message: string;
  items_extracted?: number;
  duration_ms?: number;
}

export const useExtractionProgress = (vaultId: string | undefined) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing extraction...');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!vaultId) return;

    // Fetch current progress immediately
    const fetchCurrentProgress = async () => {
      const { data } = await supabase
        .from('extraction_progress' as any)
        .select('*')
        .eq('vault_id', vaultId)
        .single();
      
      if (data) {
        const progressData = data as any;
        setProgress(progressData.percentage || 0);
        setCurrentMessage(progressData.message || 'Processing...');
        if ((progressData.percentage || 0) >= 100) {
          setIsComplete(true);
        }
      }
    };

    fetchCurrentProgress();

    // Subscribe to real-time progress updates
    const channel = supabase
      .channel(`extraction-progress-${vaultId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'extraction_progress',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: RealtimePostgresChangesPayload<ProgressUpdate>) => {
          if (payload.new) {
            const update = payload.new as ProgressUpdate;
            setProgress(update.percentage || 0);
            setCurrentMessage(update.message || 'Processing...');
            
            if ((update.percentage || 0) >= 100) {
              setIsComplete(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vaultId]);

  return {
    progress,
    currentMessage,
    isComplete
  };
};
