import { ReactNode } from 'react';
import { ResumeGateBanner } from './ResumeGateBanner';
import { VaultCompletenessReminder } from './VaultCompletenessReminder';
import { useResumeGate } from '@/hooks/useResumeGate';

interface FeaturePageWrapperProps {
  children: ReactNode;
  showVaultReminder?: boolean;
  vaultReminderContext?: 'resume-builder' | 'job-search' | 'interview-prep' | 'linkedin' | 'general';
  vaultReminderVariant?: 'default' | 'compact' | 'inline';
}

export const FeaturePageWrapper = ({ 
  children, 
  showVaultReminder = true,
  vaultReminderContext = 'general',
  vaultReminderVariant = 'compact'
}: FeaturePageWrapperProps) => {
  const { hasResume, vaultCompletion, isLoading } = useResumeGate();

  if (isLoading) {
    return <div className="container mx-auto p-6">{children}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {!hasResume && (
        <ResumeGateBanner vaultCompletion={vaultCompletion} />
      )}
      
      {hasResume && showVaultReminder && (
        <VaultCompletenessReminder 
          vaultCompletion={vaultCompletion}
          variant={vaultReminderVariant}
          context={vaultReminderContext}
          className="mb-6"
        />
      )}
      
      {children}
    </div>
  );
};
