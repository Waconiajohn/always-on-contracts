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
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VaultSectionBuilder } from '../dashboard/VaultSectionBuilder';

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
  const [isAdding, setIsAdding] = useState(false);

  // Sort items by quality tier (gold > silver > bronze > assumed), then by confidence
  const sortedItems = [...items].sort((a, b) => {
    const tierPriority: Record<string, number> = { gold: 4, silver: 3, bronze: 2, assumed: 1 };
    const tierA = tierPriority[a.quality_tier || 'assumed'] || 0;
    const tierB = tierPriority[b.quality_tier || 'assumed'] || 0;
    
    if (tierB !== tierA) return tierB - tierA;
    
    const scoreA = a.confidence_score || a.ai_confidence || 0;
    const scoreB = b.confidence_score || b.ai_confidence || 0;
    return scoreB - scoreA;
  });

  // Filter items by quality tier
  const filterByQuality = (quality: string) => {
    if (quality === 'all') return sortedItems;
    return sortedItems.filter(item => item.quality_tier === quality);
  };

  // Apply search filter
  const filteredItems = filterByQuality(activeTab).filter(item => {
    const content = getItemContent(item).toLowerCase();
    return content.includes(searchTerm.toLowerCase());
  });

  // Get quality distribution
  const qualityStats = {
    gold: sortedItems.filter(i => i.quality_tier === 'gold').length,
    silver: sortedItems.filter(i => i.quality_tier === 'silver').length,
    bronze: sortedItems.filter(i => i.quality_tier === 'bronze').length,
    assumed: sortedItems.filter(i => i.quality_tier === 'assumed').length,
    needsReview: sortedItems.filter(i => !i.quality_tier || i.confidence_score && i.confidence_score < 0.7).length
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

  // Handle item updates and ensure visibility
  const handleItemUpdate = () => {
    setActiveTab('all'); // Switch to "All" tab to show updated items
    onItemUpdate();
    setIsAdding(false);
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
    <div className="space-y-6 min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 pt-2">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                {sectionTitle}
                {activeRoadmapItem && (
                    <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20">
                    Focus Mode: {activeRoadmapItem.title}
                    </Badge>
                )}
                </h2>
            </div>
            </div>
            {!activeRoadmapItem && (
             <Button size="lg" className="gap-2 shadow-md" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" />
                Add {sectionTitle.split(' ')[0]} Item
            </Button>
            )}
        </div>

        {/* Top: Benchmark Status (Always Visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2">
                <BenchmarkComparisonPanel
                    sectionTitle={sectionTitle}
                    current={benchmarkData.current}
                    target={benchmarkData.target}
                    percentage={benchmarkData.percentage}
                />
             </div>
             <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-dashed">
                 <div className="text-center">
                     <p className="text-sm font-medium text-muted-foreground mb-1">Gap Analysis</p>
                     <p className="text-2xl font-bold text-primary">{Math.max(0, benchmarkData.target - benchmarkData.current)} Items Needed</p>
                     <p className="text-xs text-muted-foreground">to reach benchmark</p>
                 </div>
             </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Add Item Form */}
            {isAdding && (
                <Card className="border-primary/50 shadow-lg animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Add New Item</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                    </CardHeader>
                    <CardContent>
                        <VaultSectionBuilder
                            vaultId={vaultId}
                            sectionKey={sectionKey as any}
                            sectionTitle={sectionTitle}
                            sectionDescription={`Add a new item to your ${sectionTitle}`}
                            current={0} // Not needed for add form
                            target={0}  // Not needed for add form
                            percentage={0} // Not needed for add form
                            benchmarkData={{ rationale: "Add custom item" }}
                            onVaultUpdated={handleItemUpdate}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Filters & Search */}
            <div className="flex items-center justify-between gap-4">
                <VaultSearchFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    qualityStats={qualityStats}
                />
            </div>

            {selectedItems.length > 0 && (
                <BulkActionsToolbar
                selectedCount={selectedItems.length}
                vaultId={vaultId}
                selectedItems={selectedItems}
                onClearSelection={() => setSelectedItems([])}
                onComplete={handleItemUpdate}
                />
            )}
            
            {/* Tabs & List */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 mb-4">
                  <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">All ({sortedItems.length})</TabsTrigger>
                  <TabsTrigger value="gold" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent px-0 py-2">Gold ({qualityStats.gold})</TabsTrigger>
                  <TabsTrigger value="silver" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-400 data-[state=active]:bg-transparent px-0 py-2">Silver ({qualityStats.silver})</TabsTrigger>
                  <TabsTrigger value="bronze" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent px-0 py-2">Bronze ({qualityStats.bronze})</TabsTrigger>
                </TabsList>

                {/* Empty State with Call to Action */}
                {displayItems.length === 0 && !activeRoadmapItem && (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-12 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">This section is empty</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Start building your {sectionTitle} by adding your first item. Our AI will help you refine it.
                                </p>
                            </div>
                            <Button onClick={() => setIsAdding(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Item
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Items List */}
                <div className="space-y-4">
                    {displayItems.map((item) => (
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
                          onUpdate={handleItemUpdate}
                        />
                      ))}
                </div>
            </Tabs>
        </div>

        {/* Right Column: Roadmap & Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
            {/* Roadmap Widget */}
            <div className="sticky top-32">
                 {!activeRoadmapItem ? (
                    <GapRoadmapWidget
                        sectionKey={sectionKey}
                        vaultId={vaultId}
                        benchmarkData={benchmarkData}
                        currentItems={items}
                        onItemsAdded={handleItemUpdate}
                        onStartWork={handleStartWork}
                    />
                 ) : (
                    <RoadmapWorkspace
                        roadmapItem={activeRoadmapItem}
                        sectionKey={sectionKey}
                        vaultId={vaultId}
                        currentItems={items}
                        onExit={handleExitFocus}
                        onItemAdded={handleItemUpdate}
                    />
                 )}
            </div>
        </div>

      </div>

      {/* Add Item Dialog/Panel could go here if we want a modal approach */}
      {/* Currently we leverage RoadmapWorkspace for adding or a separate form */}
      {/* Ideally, we should open the RoadmapWorkspace in "Manual Mode" or similar if isAdding is true */}
    </div>
  );
}
