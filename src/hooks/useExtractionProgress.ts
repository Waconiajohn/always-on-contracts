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

export const useExtractionProgress = (resumeId: string | undefined) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing extraction...');
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState<string>('initializing');
  const [itemsExtracted, setItemsExtracted] = useState(0);

  useEffect(() => {
    if (!resumeId) return;

    console.log('🔍 [ExtractionProgress] Monitoring resume:', resumeId);

    // Fetch current progress immediately
    const fetchCurrentProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('extraction_progress' as any)
          .select('*')
          .eq('vault_id', resumeId)
          .single();
        
        if (error) {
          console.warn('⚠️ [ExtractionProgress] Error fetching progress:', error);
          return;
        }

        if (data) {
          const progressData = data as any;
          const currentProgress = progressData.percentage || 0;
          
          setProgress(currentProgress);
          setCurrentMessage(progressData.message || 'Processing...');
          setPhase(progressData.phase || 'processing');
          setItemsExtracted(progressData.items_extracted || 0);
          
          console.log('📊 [ExtractionProgress] Current:', {
            progress: currentProgress,
            phase: progressData.phase,
            items: progressData.items_extracted
          });
          
          if (currentProgress >= 100) {
            setIsComplete(true);
            console.log('✅ [ExtractionProgress] Extraction complete!');
          }
        }
      } catch (err) {
        console.error('❌ [ExtractionProgress] Fetch error:', err);
      }
    };

    fetchCurrentProgress();

    // Subscribe to real-time progress updates
    const channel = supabase
      .channel(`extraction-progress-${resumeId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'extraction_progress',
          filter: `vault_id=eq.${resumeId}`
        },
        (payload: RealtimePostgresChangesPayload<ProgressUpdate>) => {
          if (payload.new) {
            const update = payload.new as ProgressUpdate;
            const newProgress = update.percentage || 0;
            
            console.log('🔄 [ExtractionProgress] Real-time update:', {
              progress: newProgress,
              phase: update.phase,
              message: update.message,
              items: update.items_extracted
            });
            
            setProgress(newProgress);
            setCurrentMessage(update.message || 'Processing...');
            setPhase(update.phase || 'processing');
            setItemsExtracted(update.items_extracted || 0);
            
            if (newProgress >= 100) {
              setIsComplete(true);
              console.log('✅ [ExtractionProgress] Extraction complete (real-time)!');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [ExtractionProgress] Subscription status:', status);
      });

    return () => {
      console.log('🔌 [ExtractionProgress] Unsubscribing from:', resumeId);
      supabase.removeChannel(channel);
    };
  }, [resumeId]);

  return {
    progress,
    currentMessage,
    isComplete,
    phase,
    itemsExtracted
  };
};
