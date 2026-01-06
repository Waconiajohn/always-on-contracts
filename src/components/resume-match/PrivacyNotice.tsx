import { Shield, Lock } from 'lucide-react';

export function PrivacyNotice() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3 border-t border-border/50 bg-muted/30">
      <Shield className="h-3.5 w-3.5" />
      <span>Your resume and job description data never leave your browser during editing.</span>
      <Lock className="h-3.5 w-3.5" />
      <span>Analysis is performed securely and not stored unless you save.</span>
    </div>
  );
}
