import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VaultItemCard } from './VaultItemCard';
import { BenchmarkComparisonPanel } from './BenchmarkComparisonPanel';
import { GapRoadmapWidget } from './GapRoadmapWidget';
import { RoadmapWorkspace } from './RoadmapWorkspace';
import { VaultSearchFilter } from './VaultSearchFilter';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface VaultSectionDetailViewProps {
  sectionKey: string;
  sectionTitle: string;
  items: any[];
  benchmarkData: any;
  vaultId: string;
  onBack: () => void;
  onItemUpdate: () => void;
}

export function VaultSectionDetailView({
  sectionKey,
  sectionTitle,
  items,
  benchmarkData,
  vaultId,
  onBack,
  onItemUpdate
}: VaultSectionDetailViewProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeRoadmapItem, setActiveRoadmapItem] = useState<any>(null);

  // Filter items by quality tier
  const filterByQuality = (quality: string) => {
    if (quality === 'all') return items;
    return items.filter(item => item.quality_tier === quality);
  };

  // Apply search filter
  const filteredItems = filterByQuality(activeTab).filter(item => {
    const content = getItemContent(item).toLowerCase();
    return content.includes(searchTerm.toLowerCase());
  });

  // Get quality distribution
  const qualityStats = {
    gold: items.filter(i => i.quality_tier === 'gold').length,
    silver: items.filter(i => i.quality_tier === 'silver').length,
    bronze: items.filter(i => i.quality_tier === 'bronze').length,
    assumed: items.filter(i => i.quality_tier === 'assumed').length,
    needsReview: items.filter(i => !i.quality_tier || i.confidence_score && i.confidence_score < 0.7).length
  };

  function getItemContent(item: any): string {
    return item.power_phrase || item.phrase || item.stated_skill || item.skill || item.competency_area || item.inferred_capability || '';
  }

  function getItemType(item: any): 'power_phrase' | 'transferable_skill' | 'hidden_competency' {
    if ('power_phrase' in item || 'phrase' in item) return 'power_phrase';
    if ('stated_skill' in item || 'skill' in item) return 'transferable_skill';
    return 'hidden_competency';
  }

  const handleStartWork = (roadmapItem: any) => {
    setActiveRoadmapItem(roadmapItem);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitFocus = () => {
    setActiveRoadmapItem(null);
  };

  // Filter items relevant to active roadmap
  const getRelevantItems = () => {
    if (!activeRoadmapItem) return filteredItems;
    
    // Filter items that contain keywords from roadmap
    const keywords = activeRoadmapItem.suggestedActions || [];
    return filteredItems.filter(item => {
      const content = getItemContent(item).toLowerCase();
      return keywords.some((keyword: string) => 
        content.includes(keyword.toLowerCase())
      );
    });
  };

  const displayItems = activeRoadmapItem ? getRelevantItems() : filteredItems;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {sectionTitle}
              {activeRoadmapItem && (
                <span className="ml-3 text-sm font-normal text-primary">
                  • Focus Mode: {activeRoadmapItem.title}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length} items • {qualityStats.gold} gold, {qualityStats.silver} silver
            </p>
          </div>
        </div>
        {!activeRoadmapItem && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-280px)]">
        {/* Left Panel - Item List */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <div className="space-y-4 pr-4">
          <VaultSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            qualityStats={qualityStats}
          />

          {selectedItems.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedItems.length}
              vaultId={vaultId}
              selectedItems={selectedItems}
              onClearSelection={() => setSelectedItems([])}
              onComplete={onItemUpdate}
            />
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your {sectionTitle}</CardTitle>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    {qualityStats.gold} Gold
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    {qualityStats.silver} Silver
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-600" />
                    {qualityStats.bronze} Bronze
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                  <TabsTrigger value="gold">Gold ({qualityStats.gold})</TabsTrigger>
                  <TabsTrigger value="silver">Silver ({qualityStats.silver})</TabsTrigger>
                  <TabsTrigger value="bronze">Bronze ({qualityStats.bronze})</TabsTrigger>
                  <TabsTrigger value="assumed">Assumed ({qualityStats.assumed})</TabsTrigger>
                  <TabsTrigger value="needs_review">
                    Review ({qualityStats.needsReview})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-420px)] mt-4">
                  <div className="space-y-3">
                    {displayItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        {activeRoadmapItem 
                          ? "No items match this focus area yet. Add some using the workspace on the right!"
                          : "No items found"
                        }
                      </div>
                    ) : (
                      displayItems.map((item) => (
                        <VaultItemCard
                          key={item.id}
                          item={item}
                          itemType={getItemType(item)}
                          vaultId={vaultId}
                          isSelected={selectedItems.includes(item.id)}
                          onSelect={(selected) => {
                            setSelectedItems(prev =>
                              selected
                                ? [...prev, item.id]
                                : prev.filter(id => id !== item.id)
                            );
                          }}
                          onUpdate={onItemUpdate}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Benchmark & Workspace */}
        <ResizablePanel defaultSize={45} minSize={35}>
          <ScrollArea className="h-[calc(100vh-280px)] pl-4">
            <div className="space-y-4">
          {!activeRoadmapItem ? (
            <>
              <BenchmarkComparisonPanel
                sectionTitle={sectionTitle}
                current={benchmarkData.current}
                target={benchmarkData.target}
                percentage={benchmarkData.percentage}
              />

              <GapRoadmapWidget
                sectionKey={sectionKey}
                vaultId={vaultId}
                benchmarkData={benchmarkData}
                currentItems={items}
                onItemsAdded={onItemUpdate}
                onStartWork={handleStartWork}
              />
            </>
          ) : (
            <RoadmapWorkspace
              roadmapItem={activeRoadmapItem}
              sectionKey={sectionKey}
              vaultId={vaultId}
              currentItems={items}
              onExit={handleExitFocus}
              onItemAdded={onItemUpdate}
            />
          )}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
