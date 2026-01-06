import { useEffect, useRef, useState } from 'react';
import { useOptimizerStore } from '@/stores/optimizerStore';

interface UseAutoSaveOptions {
  enabled?: boolean;
}

export function useOptimizerAutoSave(options: UseAutoSaveOptions = {}) {
  const { enabled = true } = options;
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { lastSaved, resumeText, jobDescription } = useOptimizerStore();
  const previousStateRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;
    
    const currentState = JSON.stringify({ resumeText, jobDescription, lastSaved });
    
    // Check if state has actually changed
    if (currentState !== previousStateRef.current && resumeText && jobDescription) {
      setIsSaving(true);
      
      // Simulate save (Zustand persist handles actual persistence)
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSaveTime(new Date());
        previousStateRef.current = currentState;
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [resumeText, jobDescription, lastSaved, enabled]);

  // Update last save time from store
  useEffect(() => {
    if (lastSaved) {
      setLastSaveTime(new Date(lastSaved));
    }
  }, [lastSaved]);

  const formatLastSave = () => {
    if (!lastSaveTime) return null;
    
    const now = new Date();
    const diff = now.getTime() - lastSaveTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    
    return lastSaveTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return {
    isSaving,
    lastSaveTime,
    formatLastSave,
  };
}
