import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultContentsTable } from '../VaultContentsTable';
import { VaultActivityFeed } from '../VaultActivityFeed';
import { FreshnessManager } from '../FreshnessManager';
import { AutoDuplicateCleanup } from '../AutoDuplicateCleanup';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { VaultMigrationTool } from '../VaultMigrationTool';
import { MilestoneManager } from '../MilestoneManager';
import { CategoryRegenerateButton } from '../CategoryRegenerateButton';
import { Card } from '@/components/ui/card';
import {
  VaultItemsTableSkeleton,
  VaultActivityFeedSkeleton,
  VaultSettingsSkeleton
} from './VaultTabsSkeleton';

interface VaultTabsProps {
  vaultId: string;
  vault: any;
  vaultData: any;
  onRefresh: () => void;
  onEdit: (item: any) => void;
  onView: (item: any) => void;
}

/**
 * Simplified 3-tab structure:
 * - Dashboard: Strategic Command Center, missions, quick wins (shown above)
 * - Items: All vault items with filters
 * - Settings: Resume management, milestones, advanced tools
 */
export const VaultTabs = ({ vaultId, vault, vaultData, onRefresh, onEdit, onView }: VaultTabsProps) => {
  return (
    <Tabs defaultValue="items" className="vault-tabs w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="items">
        <Suspense fallback={<VaultItemsTableSkeleton />}>
          <VaultContentsTable
            powerPhrases={vaultData.powerPhrases || []}
            transferableSkills={vaultData.transferableSkills || []}
            hiddenCompetencies={vaultData.hiddenCompetencies || []}
            softSkills={vaultData.softSkills || []}
            leadershipPhilosophy={vaultData.leadershipPhilosophy || []}
            executivePresence={vaultData.executivePresence || []}
            personalityTraits={vaultData.personalityTraits || []}
            workStyle={vaultData.workStyle || []}
            values={vaultData.values || []}
            behavioralIndicators={vaultData.behavioralIndicators || []}
            onEdit={onEdit}
            onView={onView}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="activity">
        <Suspense fallback={<VaultActivityFeedSkeleton />}>
          <VaultActivityFeed vaultId={vaultId} />
        </Suspense>
      </TabsContent>

      <TabsContent value="settings">
        <Suspense fallback={<VaultSettingsSkeleton />}>
          <div className="space-y-6 animate-fade-in">
            <MilestoneManager vaultId={vaultId} />
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">AI Regeneration Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Regenerate specific categories with improved AI prompts for better quality extractions
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Leadership Philosophy</h4>
                    <p className="text-sm text-muted-foreground">
                      {vaultData?.leadershipPhilosophy?.length || 0} items
                    </p>
                  </div>
                  <CategoryRegenerateButton
                    category="leadership"
                    vaultId={vaultId}
                    resumeText={vault?.resume_raw_text || ''}
                    onComplete={onRefresh}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Soft Skills</h4>
                    <p className="text-sm text-muted-foreground">
                      {vaultData?.softSkills?.length || 0} items
                    </p>
                  </div>
                  <CategoryRegenerateButton
                    category="soft_skills"
                    vaultId={vaultId}
                    resumeText={vault?.resume_raw_text || ''}
                    onComplete={onRefresh}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Executive Presence</h4>
                    <p className="text-sm text-muted-foreground">
                      {vaultData?.executivePresence?.length || 0} items
                    </p>
                  </div>
                  <CategoryRegenerateButton
                    category="executive_presence"
                    vaultId={vaultId}
                    resumeText={vault?.resume_raw_text || ''}
                    onComplete={onRefresh}
                  />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Advanced Tools</h3>
              <div className="space-y-4">
                <VaultNuclearReset
                  vaultId={vaultId}
                  onResetComplete={onRefresh}
                />
                <VaultMigrationTool
                  vaultId={vaultId}
                  resumeText={vault?.resume_raw_text || ''}
                  onComplete={onRefresh}
                  onDataChange={onRefresh}
                />
                <FreshnessManager vaultId={vaultId} />
                <AutoDuplicateCleanup vaultId={vaultId} onCleanupComplete={onRefresh} />
              </div>
            </Card>
          </div>
        </Suspense>
      </TabsContent>
    </Tabs>
  );
};
