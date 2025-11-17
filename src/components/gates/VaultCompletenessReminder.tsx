import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface VaultCompletenessReminderProps {
  vaultCompletion: number;
  variant?: 'default' | 'compact' | 'inline';
  context?: 'resume-builder' | 'job-search' | 'interview-prep' | 'linkedin' | 'general';
  className?: string;
}

const getContextMessage = (context: string, completion: number) => {
  if (completion >= 80) return null; // Don't show if vault is well-developed

  const messages: Record<string, string> = {
    'resume-builder': 'A more complete Career Vault gives you more intelligence to work with when building resumes.',
    'job-search': 'Match scores improve with a more complete Career Vault.',
    'interview-prep': 'Better vault intelligence = more personalized interview preparation.',
    'linkedin': 'Your Career Vault powers LinkedIn profile optimization.',
    'general': 'The more complete your Career Vault, the better your results across all features.'
  };

  return messages[context] || messages['general'];
};

export const VaultCompletenessReminder = ({ 
  vaultCompletion, 
  variant = 'default',
  context = 'general',
  className 
}: VaultCompletenessReminderProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  const message = getContextMessage(context, vaultCompletion);
  
  if (isDismissed || !message) return null;

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span>{message}</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => navigate('/career-vault')}
        >
          Improve Vault
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-start gap-2 text-xs bg-muted/50 p-2 rounded border border-border/50", className)}>
        <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-muted-foreground">{message}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs mt-1"
            onClick={() => navigate('/career-vault')}
          >
            Enrich Career Vault →
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Alert className={cn("border-primary/20 bg-primary/5", className)}>
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">Boost Your Results</p>
          <p className="text-sm text-muted-foreground">
            {message} Your vault is currently {vaultCompletion}% complete.
          </p>
          <Button onClick={() => navigate('/career-vault')} size="sm" variant="outline" className="mt-2">
            <TrendingUp className="mr-2 h-4 w-4" />
            Enrich Career Vault
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
