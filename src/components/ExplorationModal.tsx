import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExplorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
  resumeCompletion: number;
}

export const ExplorationModal = ({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  resumeCompletion
}: ExplorationModalProps) => {
  const navigate = useNavigate();

  const handleContinueSetup = () => {
    onClose();
    navigate('/master-resume');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{featureName}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {featureDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Career Vault Progress</span>
              <span className="text-muted-foreground">{vaultCompletion}%</span>
            </div>
            <Progress value={vaultCompletion} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Complete your Career Vault to unlock all features
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Why complete your Career Vault?</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Unlock AI-powered job matching</li>
              <li>Get personalized resume optimization</li>
              <li>Access interview preparation tools</li>
              <li>Build your professional narrative</li>
            </ul>
          </div>

          <Button onClick={handleContinueSetup} className="w-full">
            Continue Career Vault Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Explore Other Features
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
