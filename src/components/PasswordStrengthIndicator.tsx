import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) score += 20;
    
    // Determine label and color
    if (score < 40) return { score, label: "Weak", color: "bg-destructive" };
    if (score < 60) return { score, label: "Fair", color: "bg-orange-500" };
    if (score < 80) return { score, label: "Good", color: "bg-yellow-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${
          strength.label === "Weak" ? "text-destructive" :
          strength.label === "Fair" ? "text-orange-500" :
          strength.label === "Good" ? "text-yellow-500" :
          "text-green-500"
        }`}>
          {strength.label}
        </span>
      </div>
      <Progress value={strength.score} className={strength.color} />
      {password.length < 8 && (
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters
        </p>
      )}
    </div>
  );
};
