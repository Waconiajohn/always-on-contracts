import { ReactNode, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScoreIndicator } from './ScoreIndicator';
import { AutoSaveIndicator, type SaveStatus } from './AutoSaveIndicator';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Check
} from 'lucide-react';

interface StudioLayoutProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  bottomControls?: ReactNode;
  score?: number | null;
  previousScore?: number | null;
  isScoreUpdating?: boolean;
  saveStatus?: SaveStatus;
  lastSaved?: Date | null;
}

const studioSteps = [
  { id: 'summary', label: 'Summary', icon: FileText, path: 'summary' },
  { id: 'skills', label: 'Skills', icon: Lightbulb, path: 'skills' },
  { id: 'experience', label: 'Experience', icon: Briefcase, path: 'experience' },
  { id: 'education', label: 'Education', icon: GraduationCap, path: 'education' },
];

export function StudioLayout({
  children,
  leftPanel,
  bottomControls,
  score,
  previousScore,
  isScoreUpdating,
  saveStatus = 'idle',
  lastSaved,
}: StudioLayoutProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Determine current step from URL
  const currentPath = location.pathname.split('/').pop() || 'summary';
  const currentStepIndex = studioSteps.findIndex(s => 
    currentPath === s.path || currentPath.startsWith(s.path)
  );

  const handleStepClick = (stepPath: string) => {
    navigate(`/resume-builder/${projectId}/studio/${stepPath}`);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      handleStepClick(studioSteps[currentStepIndex - 1].path);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < studioSteps.length - 1) {
      handleStepClick(studioSteps[currentStepIndex + 1].path);
    } else {
      // Go to review
      navigate(`/resume-builder/${projectId}/review`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Top Stepper with Score */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-32" /> {/* Spacer for centering */}
          <nav className="flex items-center justify-center gap-2">
          {studioSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.path)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isCompleted && 'bg-primary/10 text-primary hover:bg-primary/20',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                </button>
                {index < studioSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </nav>
          {/* Score and Save Indicator */}
          <div className="w-48 flex items-center justify-end gap-4">
            <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
            {score !== undefined && (
              <ScoreIndicator
                currentScore={score}
                previousScore={previousScore}
                isUpdating={isScoreUpdating}
                size="sm"
                showTrend={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel (Original Content) */}
        {leftPanel && (
          <div
            className={cn(
              'flex-shrink-0 transition-all duration-200 overflow-hidden',
              isLeftPanelCollapsed ? 'w-10' : 'w-[400px]'
            )}
          >
            <div className="h-full flex flex-col bg-muted/30 rounded-lg border border-border/60">
              {/* Collapse Toggle */}
              <div className="flex-shrink-0 p-2 border-b border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                  className="w-full justify-start"
                >
                  {isLeftPanelCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      <span className="text-xs text-muted-foreground">Original</span>
                    </>
                  )}
                </Button>
              </div>
              
              {/* Left Panel Content */}
              {!isLeftPanelCollapsed && (
                <div className="flex-1 overflow-y-auto p-4">
                  {leftPanel}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel (Editable Content) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto bg-card rounded-lg border border-border/60 p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 mt-6 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          {/* Custom Controls */}
          <div className="flex-1">
            {bottomControls}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStepIndex === studioSteps.length - 1 ? 'Review' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudioLayout;
