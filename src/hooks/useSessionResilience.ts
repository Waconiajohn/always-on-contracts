import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface SessionResilienceOptions {
  maxRetries?: number;
  baseDelay?: number;
  onSessionLost?: () => void;
}

export function useSessionResilience(options: SessionResilienceOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    onSessionLost
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const retryCountRef = useRef(0);

  /**
   * Refresh session with exponential backoff retry logic
   */
  const refreshSessionWithRetry = useCallback(async (): Promise<boolean> => {
    setIsRefreshing(true);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;
        
        if (session) {
          retryCountRef.current = 0;
          setIsRefreshing(false);
          
          if (attempt > 0) {
            toast.success('Session restored successfully');
          }
          
          return true;
        }
      } catch (error: any) {
        logger.error(`Session refresh attempt ${attempt + 1} failed`, error);
        
        // If this is the last attempt, fail
        if (attempt === maxRetries - 1) {
          setIsRefreshing(false);
          toast.error('Session expired. Please sign in again.', {
            duration: 5000
          });
          
          // Give user 3 seconds to see the message before redirect
          setTimeout(() => {
            onSessionLost?.();
          }, 3000);
          
          return false;
        }
        
        // Exponential backoff: wait before retrying
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Show warning after first failure
        if (attempt === 0) {
          toast.warning('Connection issue detected. Retrying...', {
            duration: delay
          });
        }
      }
    }
    
    setIsRefreshing(false);
    return false;
  }, [maxRetries, baseDelay, onSessionLost]);

  /**
   * Pre-validate session before critical operations
   * Proactively refreshes if session is expiring soon
   */
  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    try {
      // Use getUser() to validate token server-side instead of just reading localStorage
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Token is invalid or expired - try to refresh
        return await refreshSessionWithRetry();
      }
      
      // Also check session expiry for proactive refresh
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.expires_at) {
        const expiresInMs = (session.expires_at * 1000) - Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        if (expiresInMs < fiveMinutesInMs) {
          logger.debug('Session expiring soon, refreshing proactively');
          return await refreshSessionWithRetry();
        }
      }

      return true;
    } catch (error) {
      logger.error('Error checking session', error);
      return await refreshSessionWithRetry();
    }
  }, [refreshSessionWithRetry]);

  /**
   * Wrap a database operation with session validation and retry logic
   */
  const withSessionValidation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T | null> => {
    // Ensure session is valid before operation
    const isValid = await ensureValidSession();
    
    if (!isValid) {
      throw new Error('Session validation failed');
    }

    try {
      return await operation();
    } catch (error: any) {
      // Check if it's an auth error
      const isAuthError = 
        error?.message?.includes('JWT') ||
        error?.message?.includes('auth') ||
        error?.message?.includes('session') ||
        error?.code === 'PGRST301';

      if (isAuthError) {
        logger.debug(`Auth error during ${operationName}, attempting to refresh session`);

        // Try to refresh session
        const refreshed = await refreshSessionWithRetry();

        if (refreshed) {
          // Retry the operation once after successful refresh
          try {
            return await operation();
          } catch (retryError) {
            logger.error(`${operationName} failed after session refresh`, retryError);
            throw retryError;
          }
        }
      }
      
      // Re-throw if not an auth error or refresh failed
      throw error;
    }
  }, [ensureValidSession, refreshSessionWithRetry]);

  return {
    isRefreshing,
    refreshSessionWithRetry,
    ensureValidSession,
    withSessionValidation
  };
}
