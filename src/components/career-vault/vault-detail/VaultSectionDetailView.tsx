import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultItemCard } from './VaultItemCard';
import { BenchmarkComparisonPanel } from './BenchmarkComparisonPanel';
import { VaultSearchFilter } from './VaultSearchFilter';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Sparkles } from 'lucide-react';
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

  // Apply search filter based on active tab
  const filteredItems = (() => {
    let items = sortedItems;
    
    // Filter by tab
    if (activeTab === 'highQuality') {
      items = items.filter(item => item.quality_tier === 'gold' || item.quality_tier === 'silver');
    } else if (activeTab === 'needsReview') {
      items = items.filter(item => item.quality_tier === 'bronze' || !item.quality_tier || (item.confidence_score && item.confidence_score < 0.7));
    }
    
    // Apply search
    if (searchTerm) {
      items = items.filter(item => {
        const content = getItemContent(item).toLowerCase();
        return content.includes(searchTerm.toLowerCase());
      });
    }
    
    return items;
  })();

  // Get quality distribution
  const qualityStats = {
    all: sortedItems.length,
    highQuality: sortedItems.filter(i => i.quality_tier === 'gold' || i.quality_tier === 'silver').length,
    needsReview: sortedItems.filter(i => i.quality_tier === 'bronze' || !i.quality_tier || (i.confidence_score && i.confidence_score < 0.7)).length
  };

  function getItemContent(item: any): string {
    return item.power_phrase || item.phrase || item.stated_skill || item.skill || item.competency_area || item.inferred_capability || '';
  }

  function getItemType(item: any): 'power_phrase' | 'transferable_skill' | 'hidden_competency' {
    if ('power_phrase' in item || 'phrase' in item) return 'power_phrase';
    if ('stated_skill' in item || 'skill' in item) return 'transferable_skill';
    return 'hidden_competency';
  }

  // Handle item updates and ensure visibility
  const handleItemUpdate = () => {
    setActiveTab('all'); // Switch to "All" tab to show updated items
    onItemUpdate();
    setIsAdding(false);
  };

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
                <h2 className="text-2xl font-bold">{sectionTitle}</h2>
            </div>
            </div>
            <Button size="lg" className="gap-2 shadow-md" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" />
                Add Item
            </Button>
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

      {/* Main Content */}
      <div className="space-y-6">
            
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
            <VaultSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

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
                  <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">All ({qualityStats.all})</TabsTrigger>
                  <TabsTrigger value="highQuality" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">High Quality ({qualityStats.highQuality})</TabsTrigger>
                  <TabsTrigger value="needsReview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Needs Review ({qualityStats.needsReview})</TabsTrigger>
                </TabsList>

                {/* Empty State with Call to Action */}
                {filteredItems.length === 0 && (
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
                    {filteredItems.map((item) => (
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
    </div>
  );
}
