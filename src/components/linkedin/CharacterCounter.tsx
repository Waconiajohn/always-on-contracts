import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  
  const getColorClass = () => {
    if (current > max) return "text-destructive";
    if (percentage >= 90) return "text-yellow-600 dark:text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <span className={cn("text-xs font-medium tabular-nums", getColorClass(), className)}>
      {current}/{max}
    </span>
  );
}
