import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultContentsTable } from '../VaultContentsTable';
import { VaultActivityFeed } from '../VaultActivityFeed';
import { FreshnessManager } from '../FreshnessManager';
import { AutoDuplicateCleanup } from '../AutoDuplicateCleanup';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { MilestoneManager } from '../MilestoneManager';
import { Card } from '@/components/ui/card';

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
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="items">
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
      </TabsContent>

      <TabsContent value="activity">
        <VaultActivityFeed vaultId={vaultId} />
      </TabsContent>

      <TabsContent value="settings">
        <div className="space-y-6">
          <MilestoneManager vaultId={vaultId} />
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Tools</h3>
            <div className="space-y-4">
              <FreshnessManager vaultId={vaultId} />
              <AutoDuplicateCleanup vaultId={vaultId} onCleanupComplete={onRefresh} />
              <VaultNuclearReset
                vaultId={vaultId}
                resumeText={vault?.resume_raw_text || ''}
                targetRoles={vault?.target_roles || []}
                targetIndustries={vault?.target_industries || []}
                onResetComplete={onRefresh}
              />
            </div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};
