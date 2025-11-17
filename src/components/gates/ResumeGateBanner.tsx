import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Upload, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumeGateBannerProps {
  vaultCompletion?: number;
  onDismiss?: () => void;
}

export const ResumeGateBanner = ({ vaultCompletion = 0, onDismiss }: ResumeGateBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Upload className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center justify-between">
        <span>Upload Your Resume to Get Started</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">
          Upload your resume to unlock full functionality across all features. This allows our AI to personalize job matches, optimize your applications, and provide intelligent recommendations.
        </p>
        {vaultCompletion > 0 && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>
              Pro tip: The more complete your Career Vault ({vaultCompletion}% complete), the better results you'll get across all features.
            </span>
          </div>
        )}
        <Button onClick={() => navigate('/career-vault')} size="sm" className="mt-2">
          <Upload className="mr-2 h-4 w-4" />
          Go to Career Vault
        </Button>
      </AlertDescription>
    </Alert>
  );
};
