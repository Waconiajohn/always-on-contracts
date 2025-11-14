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

    // Subscribe to real-time progress updates
    const channel = supabase
      .channel(`extraction-progress-${vaultId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extraction_progress',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: RealtimePostgresChangesPayload<ProgressUpdate>) => {
          if (payload.new) {
            const update = payload.new as ProgressUpdate;
            setProgress(update.percentage);
            setCurrentMessage(update.message);
            
            if (update.percentage >= 100) {
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
