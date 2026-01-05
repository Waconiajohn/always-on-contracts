import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultContentsTable } from '../VaultContentsTable';
import { FreshnessManager } from '../FreshnessManager';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { VaultMigrationTool } from '../VaultMigrationTool';
import { MilestoneManager } from '../MilestoneManager';
import { CategoryRegenerateButton } from '../CategoryRegenerateButton';
import { EnhancementQueue } from '@/components/EnhancementQueue';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import {
  VaultItemsTableSkeleton,
  VaultSettingsSkeleton
} from './VaultTabsSkeleton';

interface VaultTabsProps {
  vaultId: string;
  vault: any;
  vaultData: any;
  highlightedGap?: string | null;
  defaultTab?: string;
  onRefresh: () => void;
  onEdit: (item: any) => void;
  onView: (item: any) => void;
}

/**
 * Simplified 3-tab structure:
 * - Items: All vault items with filters
 * - Enhance: AI enhancement queue for responses needing improvement
 * - Settings: Resume management, milestones, advanced tools
 */
export const VaultTabs = ({ vaultId, vault, vaultData, highlightedGap, defaultTab = 'items', onRefresh, onEdit, onView }: VaultTabsProps) => {
  return (
    <Tabs defaultValue={defaultTab} className="vault-tabs w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="enhance" className="flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Enhance
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="items">
        <Suspense fallback={<VaultItemsTableSkeleton />}>
          {highlightedGap && (
            <div className="mb-4 p-4 bg-accent/10 border border-accent/20 rounded-lg animate-pulse-border">
              <p className="text-sm text-foreground">
                <strong>💡 Filling Gap:</strong> {highlightedGap.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Look for relevant sections below and click "+ Add" to add new items.
              </p>
            </div>
          )}
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

      <TabsContent value="enhance">
        <EnhancementQueue 
          vaultId={vaultId} 
          onEnhancementComplete={onRefresh}
        />
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
                />
                <VaultMigrationTool
                  vaultId={vaultId}
                  resumeText={vault?.resume_raw_text || ''}
                  onComplete={onRefresh}
                  onDataChange={onRefresh}
                />
                <FreshnessManager vaultId={vaultId} />
                
              </div>
            </Card>
          </div>
        </Suspense>
      </TabsContent>
    </Tabs>
  );
};
