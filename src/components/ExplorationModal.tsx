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
  warChestCompletion: number;
}

export const ExplorationModal = ({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  warChestCompletion
}: ExplorationModalProps) => {
  const navigate = useNavigate();

  const handleContinueSetup = () => {
    onClose();
    navigate('/war-chest/onboarding');
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
              <span className="font-medium">War Chest Progress</span>
              <span className="text-muted-foreground">{warChestCompletion}%</span>
            </div>
            <Progress value={warChestCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Complete your War Chest to unlock all features
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Why complete your War Chest?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• AI-powered career intelligence</li>
              <li>• Personalized job recommendations</li>
              <li>• Optimized resume generation</li>
              <li>• Strategic interview preparation</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleContinueSetup} className="w-full">
            Continue War Chest Setup
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
