import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Phase {
  id: string;
  title: string;
  duration: string;
  priority: 'critical' | 'high' | 'medium';
  status: 'pending' | 'in-progress' | 'completed';
  steps: string[];
  successCriteria: string[];
}

const deploymentPhases: Phase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Deploy Database Migrations',
    duration: '10 minutes',
    priority: 'critical',
    status: 'pending',
    steps: [
      'Verify Lovable Cloud connection',
      'Confirm migrations are visible in backend',
      'Apply Migration 1: fix_search_vault_items.sql',
      'Apply Migration 2: enhance_gap_analysis_schema.sql',
      'Apply Migration 3: standardize_quality_tiers.sql',
      'Verify vault_gap_analysis has 8 new columns',
      'Verify search_vault_items function updated',
      'Confirm quality tier CHECK constraints exist',
      'Ensure no "platinum" tier records remain'
    ],
    successCriteria: [
      'All 3 migrations applied without errors',
      'Database schema matches Master Resume 2.0 requirements',
      'GIN indexes created for search optimization'
    ]
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Smoke Test',
    duration: '15 minutes',
    priority: 'critical',
    status: 'pending',
    steps: [
      'Navigate to /master-resume',
      'Upload test resume (PDF or DOCX)',
      'Verify upload succeeds without auth errors',
      'Confirm analysis completes in <10 seconds',
      'Check success toast displays with marketing message',
      'Verify auto-save functionality works',
      'Refresh page and confirm "Welcome Back" toast appears',
      'Test search functionality for "leadership"',
      'Verify search performance <100ms',
      'Confirm no "platinum" tier appears anywhere'
    ],
    successCriteria: [
      'All 3 smoke tests pass',
      'No critical errors in console',
      'Database queries working correctly'
    ]
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Comprehensive QA Testing',
    duration: '4-6 hours',
    priority: 'high',
    status: 'pending',
    steps: [
      'Execute Onboarding Flow tests (7 steps, 2 hours)',
      'Test Resume Upload & Analysis (20 min)',
      'Test Career Direction selection (15 min)',
      'Test Industry Research (15 min)',
      'Test Auto-Population (20 min)',
      'Test Smart Review workflow (30 min)',
      'Test Gap-Filling Questions (15 min)',
      'Test Completion & Benchmarking (15 min)',
      'Execute Search Functionality tests (30 min)',
      'Execute Bulk Operations tests (30 min)',
      'Execute Export Functionality tests (30 min)',
      'Execute Error Handling tests (30 min)',
      'Execute Performance tests (30 min)',
      'Execute Integration tests (30 min)',
      'Document all bugs in Bug Tracker'
    ],
    successCriteria: [
      'All critical paths pass',
      'No P0 (blocker) bugs',
      '<5 P1 (high) bugs documented',
      'All tests have clear reproduction steps'
    ]
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Bug Triage & Fixes',
    duration: '2-8 hours',
    priority: 'high',
    status: 'pending',
    steps: [
      'Categorize bugs: P0, P1, P2, P3',
      'Fix all P0 (blocker) bugs immediately',
      'Fix P1 (high) bugs if time allows',
      'Document P2/P3 bugs for post-launch',
      'Run regression tests after each fix',
      'Verify fix doesn\'t break other functionality',
      'Update bug status in Bug Tracker'
    ],
    successCriteria: [
      'All P0 bugs fixed',
      'P1 bugs fixed or documented with mitigation plan',
      'Regression testing completed for all fixes'
    ]
  },
  {
    id: 'phase-5',
    title: 'Phase 5: Production Deployment Sign-Off',
    duration: '30 minutes',
    priority: 'medium',
    status: 'pending',
    steps: [
      'Complete technical validation checklist',
      'Verify all migrations applied successfully',
      'Confirm build passing with 0 TypeScript errors',
      'Verify all smoke tests passing',
      'Confirm comprehensive QA completed',
      'Verify all P0 bugs fixed',
      'Complete documentation checklist',
      'Obtain QA Team sign-off',
      'Obtain Product Owner approval',
      'Obtain Technical Lead approval',
      'Verify database backup',
      'Document rollback plan',
      'Configure monitoring alerts'
    ],
    successCriteria: [
      'All required checklist items completed',
      'All stakeholders approved',
      'Production deployment authorized'
    ]
  }
];

export function TestingGuide() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Resume 2.0 - Deployment & Testing Guide</CardTitle>
        <CardDescription>
          Follow this comprehensive 5-phase plan to deploy and test Master Resume 2.0
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {deploymentPhases.map((phase) => (
            <AccordionItem key={phase.id} value={phase.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 w-full">
                  {getStatusIcon(phase.status)}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{phase.title}</span>
                      <Badge variant={getPriorityColor(phase.priority)}>
                        {phase.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Duration: {phase.duration}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Steps:</h4>
                    <ol className="space-y-1 pl-5 list-decimal">
                      {phase.steps.map((step, index) => (
                        <li key={index} className="text-sm">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Success Criteria */}
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-semibold text-sm">Success Criteria:</h4>
                    <ul className="space-y-1 pl-5 list-disc">
                      {phase.successCriteria.map((criteria, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold">Total Timeline</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Minimum Duration:</span>
              <span className="ml-2 font-medium">7 hours</span>
            </div>
            <div>
              <span className="text-muted-foreground">Maximum Duration:</span>
              <span className="ml-2 font-medium">15 hours</span>
            </div>
            <div>
              <span className="text-muted-foreground">Critical Phases:</span>
              <span className="ml-2 font-medium">2</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Phases:</span>
              <span className="ml-2 font-medium">5</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
