import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BuildingStepProps {
  aiTyping: boolean;
}

export const BuildingStep = ({ aiTyping }: BuildingStepProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-8 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        {aiTyping ? (
          <>
            <div className="animate-pulse mb-4">
              <Target className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Building Your Career Vault...</h2>
            <p className="text-muted-foreground">
              Creating power phrases, mapping transferable skills, and discovering hidden competencies
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-16 h-16 text-success mb-4 animate-scale-in" />
            <h2 className="text-2xl font-semibold mb-2">Your Career Vault is Ready!</h2>
            <p className="text-muted-foreground mb-6">
              You now have a complete career intelligence system. Let's put it to work.
            </p>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => navigate('/agents/resume-builder')}>
                Build Custom Resume
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/career-vault')}>
                View Career Vault
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
