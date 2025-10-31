import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
  required: boolean;
}

const initialChecklist: ChecklistItem[] = [
  // Technical Validation
  { id: 'migrations', label: 'All 3 database migrations applied successfully', category: 'technical', checked: false, required: true },
  { id: 'build', label: 'Build passing with 0 TypeScript errors', category: 'technical', checked: false, required: true },
  { id: 'smoke-tests', label: 'All smoke tests passing', category: 'technical', checked: false, required: true },
  { id: 'qa-complete', label: 'Comprehensive QA completed', category: 'technical', checked: false, required: true },
  { id: 'p0-bugs', label: 'All P0 bugs fixed', category: 'technical', checked: false, required: true },
  { id: 'p1-bugs', label: 'P1 bugs fixed or documented with mitigation', category: 'technical', checked: false, required: false },
  
  // Documentation
  { id: 'deployment-notes', label: 'Deployment notes updated', category: 'documentation', checked: false, required: true },
  { id: 'known-issues', label: 'Known issues documented', category: 'documentation', checked: false, required: false },
  { id: 'user-comm', label: 'User communication prepared', category: 'documentation', checked: false, required: false },
  { id: 'support-brief', label: 'Support team briefed', category: 'documentation', checked: false, required: false },
  
  // Pre-Launch
  { id: 'db-backup', label: 'Database backup verified', category: 'pre-launch', checked: false, required: true },
  { id: 'rollback-plan', label: 'Rollback plan documented', category: 'pre-launch', checked: false, required: true },
  { id: 'monitoring', label: 'Monitoring alerts configured', category: 'pre-launch', checked: false, required: false },
  
  // Approvals
  { id: 'qa-signoff', label: 'QA Team sign-off', category: 'approvals', checked: false, required: true },
  { id: 'product-approval', label: 'Product Owner approval', category: 'approvals', checked: false, required: true },
  { id: 'tech-approval', label: 'Technical Lead approval', category: 'approvals', checked: false, required: true },
];

export function DeploymentSignoff() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [signedOff, setSignedOff] = useState(false);

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const requiredItems = checklist.filter(item => item.required);
  const requiredCompleted = requiredItems.filter(item => item.checked).length;
  const allRequiredComplete = requiredItems.every(item => item.checked);
  const completionPercentage = (requiredCompleted / requiredItems.length) * 100;

  const getCategoryItems = (category: string) => {
    return checklist.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const items = getCategoryItems(category);
    const completed = items.filter(item => item.checked).length;
    return { completed, total: items.length };
  };

  const handleSignOff = () => {
    if (!allRequiredComplete) {
      toast.error('All required items must be completed before sign-off');
      return;
    }
    setSignedOff(true);
    toast.success('🚀 Deployment Approved! Ready for production launch.');
  };

  const categories = [
    { key: 'technical', label: 'Technical Validation', icon: CheckCircle2 },
    { key: 'documentation', label: 'Documentation', icon: AlertTriangle },
    { key: 'pre-launch', label: 'Pre-Launch Actions', icon: Rocket },
    { key: 'approvals', label: 'Stakeholder Approvals', icon: CheckCircle2 },
  ];

  return (
    <Card className={signedOff ? 'border-green-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {signedOff ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Deployment Sign-Off Checklist
            </CardTitle>
            <CardDescription>
              Complete all required items before production deployment
            </CardDescription>
          </div>
          {signedOff && (
            <Badge className="bg-green-600">Approved</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Required Items Completed</span>
            <span className="text-muted-foreground">
              {requiredCompleted} / {requiredItems.length}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                allRequiredComplete ? 'bg-green-600' : 'bg-primary'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Sections */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {categories.map(({ key, label, icon: Icon }) => {
              const progress = getCategoryProgress(key);
              const items = getCategoryItems(key);
              const allCategoryComplete = items.every(item => !item.required || item.checked);

              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${allCategoryComplete ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <h4 className="font-semibold">{label}</h4>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {progress.completed} / {progress.total}
                    </span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                          disabled={signedOff}
                        />
                        <label
                          htmlFor={item.id}
                          className="text-sm flex-1 cursor-pointer select-none leading-relaxed"
                        >
                          {item.label}
                          {item.required && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </label>
                        {item.checked && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Sign-Off Button */}
        <div className="space-y-3 pt-4 border-t">
          {!allRequiredComplete && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-600">
                Complete all required items to enable deployment sign-off
              </p>
            </div>
          )}
          
          <Button
            onClick={handleSignOff}
            disabled={!allRequiredComplete || signedOff}
            className="w-full"
            size="lg"
          >
            {signedOff ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Deployment Approved
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Sign Off for Production Deployment
              </>
            )}
          </Button>

          {signedOff && (
            <p className="text-sm text-center text-muted-foreground">
              Signed off at {new Date().toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
