import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface JobFeedbackDialogProps {
  opportunityId: string;
  jobTitle: string;
}

export function JobFeedbackDialog({ opportunityId, jobTitle }: JobFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error("Please select a feedback type");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('job_feedback')
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId,
          feedback_type: feedbackType,
          feedback_text: feedbackText || null,
        });

      if (error) throw error;

      toast.success("Thank you for your feedback! This helps us improve job quality.");
      setOpen(false);
      setFeedbackType("");
      setFeedbackText("");
    } catch (error: any) {
      logger.error('Error submitting feedback', error);
      if (error.message?.includes('duplicate')) {
        toast.error("You've already submitted this type of feedback for this job");
      } else {
        toast.error("Failed to submit feedback");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Job Issue</DialogTitle>
          <DialogDescription>
            Help us improve job quality by reporting issues with "{jobTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback-type">Issue Type</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incorrect_contract">Not a Contract Position</SelectItem>
                <SelectItem value="incorrect_rate">Incorrect Rate Information</SelectItem>
                <SelectItem value="incorrect_duration">Incorrect Contract Duration</SelectItem>
                <SelectItem value="spam">Spam or Fake Job</SelectItem>
                <SelectItem value="expired">Job Posting Expired</SelectItem>
                <SelectItem value="other">Other Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feedback-text">Additional Details (Optional)</Label>
            <Textarea
              id="feedback-text"
              placeholder="Provide any additional context that would help us understand the issue..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}