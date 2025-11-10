import { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './progress';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'ai-insight';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  substatus?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  position?: 'top-right' | 'bottom-right' | 'top-center';
}

const notificationIcons = {
  'success': CheckCircle2,
  'info': Info,
  'warning': AlertTriangle,
  'error': XCircle,
  'ai-insight': Sparkles,
};

const notificationStyles = {
  'success': 'bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-ai-subtle',
  'info': 'bg-gradient-to-br from-info/10 to-info/5 border-info/30 shadow-ai-subtle',
  'warning': 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30',
  'error': 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30',
  'ai-insight': 'bg-gradient-to-br from-ai-primary/10 to-ai-secondary/5 border-ai-primary/30 shadow-glow',
};

const iconStyles = {
  'success': 'text-success',
  'info': 'text-info',
  'warning': 'text-warning',
  'error': 'text-destructive',
  'ai-insight': 'text-ai-primary',
};

export const NotificationCenter = ({
  notifications,
  onDismiss,
  maxVisible = 3,
  position = 'top-right'
}: NotificationCenterProps) => {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2'
  };

  // Only show the most recent notifications
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={cn('fixed z-[100] flex flex-col gap-3 w-full max-w-md', positionStyles[position])}>
      {visibleNotifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          stackPosition={index}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  stackPosition: number;
}

const NotificationItem = ({ notification, onDismiss, stackPosition }: NotificationItemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const Icon = notificationIcons[notification.type];
  const duration = notification.duration || 6000;

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 50);

    // Start progress countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-4 shadow-xl backdrop-blur-sm transition-all duration-300',
        notificationStyles[notification.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        stackPosition > 0 && 'mt-2'
      )}
      style={{
        transform: `translateY(${stackPosition * 4}px) scale(${1 - stackPosition * 0.02})`,
      }}
    >
      {/* Content */}
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', notification.progress !== undefined && 'animate-pulse')}>
          <Icon className={cn('h-5 w-5', iconStyles[notification.type])} />
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-sm leading-none">{notification.title}</p>
          
          {notification.description && (
            <p className="text-sm text-muted-foreground leading-snug">
              {notification.description}
            </p>
          )}

          {/* Progress indicator for AI operations */}
          {notification.progress !== undefined && (
            <div className="space-y-1 mt-2">
              <Progress value={notification.progress} className="h-1.5" />
              {notification.substatus && (
                <p className="text-xs text-ai-primary font-medium animate-pulse">
                  {notification.substatus}
                </p>
              )}
            </div>
          )}

          {/* Action button */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              {notification.action.label} →
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20 rounded-b-xl overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-100 ease-linear',
            notification.type === 'ai-insight' ? 'bg-ai-primary' : 
            notification.type === 'success' ? 'bg-success' :
            notification.type === 'warning' ? 'bg-warning' :
            notification.type === 'error' ? 'bg-destructive' :
            'bg-info'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ ...notification, id }, ...prev]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showNotification,
    dismissNotification,
    dismissAll,
  };
};
