import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Phone, Mail, ExternalLink } from "lucide-react";
import logo from "@/assets/logo.png";

interface SchedulingCTAProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export const SchedulingCTA = ({ variant = "default", className = "" }: SchedulingCTAProps) => {
  const SCHEDULING_LINK = "https://calendly.com/firstsourceteam"; // TODO: Replace with actual scheduling link
  const CONTACT_EMAIL = "contact@firstsourceteam.com";
  const CONTACT_PHONE = "(555) 123-4567";

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Button asChild size="lg">
          <a href={SCHEDULING_LINK} target="_blank" rel="noopener noreferrer">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Discovery Call
            <ExternalLink className="h-3 w-3 ml-2" />
          </a>
        </Button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className={`border-2 border-primary/20 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={logo} alt="CareerIQ FirstSource" className="h-10 w-10" />
            <div>
              <h3 className="font-semibold">Ready to Take Control?</h3>
              <p className="text-sm text-muted-foreground">Schedule your complimentary discovery call</p>
            </div>
          </div>
          <Button asChild className="w-full" size="lg">
            <a href={SCHEDULING_LINK} target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Discovery Call
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-primary/20 shadow-lg ${className}`}>
      <CardContent className="pt-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="CareerIQ FirstSource" className="h-16 w-16" />
          </div>
          <h3 className="text-2xl font-bold">Ready to Take Control of Your Future?</h3>
          <p className="text-muted-foreground">
            Schedule your complimentary discovery call today—no obligation, just insights
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <a href={SCHEDULING_LINK} target="_blank" rel="noopener noreferrer">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Discovery Call
            </a>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" asChild>
              <a href={`tel:${CONTACT_PHONE}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="h-4 w-4 mr-2" />
                Email Us
              </a>
            </Button>
          </div>
        </div>

        <div className="text-center space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">What to Expect:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Comprehensive review of your situation</li>
            <li>✓ Identify specific vulnerability areas</li>
            <li>✓ Actionable recommendations</li>
            <li>✓ No pressure—earn your trust through value</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
