import { ReactNode } from 'react';
import { ResumeGateBanner } from './ResumeGateBanner';
import { useResumeGate } from '@/hooks/useResumeGate';

interface FeaturePageWrapperProps {
  children: ReactNode;
  showResumeReminder?: boolean;
  resumeReminderContext?: 'resume-builder' | 'job-search' | 'interview-prep' | 'linkedin' | 'general';
  resumeReminderVariant?: 'default' | 'compact' | 'inline';
}

export const FeaturePageWrapper = ({ 
  children, 
}: FeaturePageWrapperProps) => {
  const { hasResume, resumeCompletion, isLoading } = useResumeGate();

  if (isLoading) {
    return <div className="container mx-auto p-6">{children}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {!hasResume && (
        <ResumeGateBanner resumeCompletion={resumeCompletion} />
      )}
      
      {children}
    </div>
  );
};
