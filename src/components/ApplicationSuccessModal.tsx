import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, X, Linkedin, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  appliedDate: Date;
}

export const ApplicationSuccessModal = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  appliedDate
}: ApplicationSuccessModalProps) => {
  const navigate = useNavigate();
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const handleGeneratePost = () => {
    onClose();
    navigate('/agents/linkedin-blogging', {
      state: { context: `Just applied for ${jobTitle} at ${companyName}` }
    });
  };

  const handleNetworking = () => {
    onClose();
    navigate('/agents/networking', {
      state: { targetCompany: companyName }
    });
  };

  const handleSetReminder = () => {
    setShowReminderPicker(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl">Application Submitted!</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">{jobTitle}</h3>
            <p className="text-sm text-muted-foreground">{companyName}</p>
            <p className="text-xs text-muted-foreground">
              Applied on {appliedDate.toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Next Steps (Optional)</h4>

            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={handleGeneratePost}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Linkedin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium mb-1">Share Your Journey on LinkedIn</h5>
                  <p className="text-sm text-muted-foreground">
                    Announce your application and attract recruiter attention
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={handleNetworking}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium mb-1">Network with {companyName} Employees</h5>
                  <p className="text-sm text-muted-foreground">
                    Increase your visibility and get insider insights
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium mb-1">Set Follow-Up Reminder</h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get reminded to follow up if you don't hear back
                  </p>
                  {!showReminderPicker ? (
                    <Button size="sm" variant="outline" onClick={handleSetReminder}>
                      Add Reminder
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Button size="sm">Save</Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            I'll Do This Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
