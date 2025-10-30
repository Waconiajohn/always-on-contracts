// =====================================================
// VAULT CONTENTS TABLE ENHANCED - Career Vault 2.0
// =====================================================
// UNIFIED TABLE WITH MULTI-SELECT FOR BULK OPERATIONS
//
// Enhanced version with checkboxes for bulk selection
// and integration with advanced search and export.
// =====================================================

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Eye, Trophy, Star, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

interface VaultItem {
  id: string;
  category: string;
  tableName: string;
  content: any;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at?: string;
}

interface VaultContentsTableEnhancedProps {
  powerPhrases: any[];
  transferableSkills: any[];
  hiddenCompetencies: any[];
  softSkills: any[];
  leadershipPhilosophy: any[];
  executivePresence: any[];
  personalityTraits: any[];
  workStyle: any[];
  values: any[];
  behavioralIndicators: any[];
  onEdit: (item: VaultItem) => void;
  onView: (item: VaultItem) => void;
  onSelectionChange?: (selectedItems: VaultItem[]) => void;
}

// Note: CATEGORY_TO_TABLE mapping reserved for future use

export default function VaultContentsTableEnhanced({
  powerPhrases,
  transferableSkills,
  hiddenCompetencies,
  softSkills,
  leadershipPhilosophy,
  executivePresence,
  personalityTraits,
  workStyle,
  values,
  behavioralIndicators,
  onEdit,
  onView,
  onSelectionChange,
}: VaultContentsTableEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Combine all items into unified structure
  const allItems: VaultItem[] = useMemo(() => {
    const items: VaultItem[] = [];

    powerPhrases.forEach(item => items.push({
      id: item.id,
      category: 'Power Phrase',
      tableName: 'vault_power_phrases',
      content: { text: item.power_phrase || item.phrase, keywords: item.keywords },
      quality_tier: item.quality_tier,
      source: item.source || 'Resume',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    transferableSkills.forEach(item => items.push({
      id: item.id,
      category: 'Skill',
      tableName: 'vault_transferable_skills',
      content: { text: item.stated_skill || item.skill, evidence: item.evidence },
      quality_tier: item.quality_tier,
      source: item.source || 'Resume',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    hiddenCompetencies.forEach(item => items.push({
      id: item.id,
      category: 'Competency',
      tableName: 'vault_hidden_competencies',
      content: { text: item.competency_area || item.inferred_capability, evidence: item.supporting_evidence },
      quality_tier: item.quality_tier,
      source: item.source || 'AI Inference',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    softSkills.forEach(item => items.push({
      id: item.id,
      category: 'Soft Skill',
      tableName: 'vault_soft_skills',
      content: { text: item.skill_name, examples: item.examples },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    leadershipPhilosophy.forEach(item => items.push({
      id: item.id,
      category: 'Leadership',
      tableName: 'vault_leadership_philosophy',
      content: { text: item.philosophy_statement, style: item.leadership_style },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    executivePresence.forEach(item => items.push({
      id: item.id,
      category: 'Executive Presence',
      tableName: 'vault_executive_presence',
      content: { text: item.presence_indicator, example: item.situational_example },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    personalityTraits.forEach(item => items.push({
      id: item.id,
      category: 'Personality',
      tableName: 'vault_personality_traits',
      content: { text: item.trait_name, evidence: item.behavioral_evidence },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'AI Inference',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    workStyle.forEach(item => items.push({
      id: item.id,
      category: 'Work Style',
      tableName: 'vault_work_style',
      content: { text: item.preference_area, description: item.preference_description },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    values.forEach(item => items.push({
      id: item.id,
      category: 'Value',
      tableName: 'vault_values_motivations',
      content: { text: item.value_name, manifestation: item.manifestation },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    behavioralIndicators.forEach(item => items.push({
      id: item.id,
      category: 'Behavior',
      tableName: 'vault_behavioral_indicators',
      content: { text: item.indicator_type, behavior: item.specific_behavior },
      quality_tier: item.quality_tier,
      source: item.context || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    return items;
  }, [powerPhrases, transferableSkills, hiddenCompetencies, softSkills, leadershipPhilosophy, executivePresence, personalityTraits, workStyle, values, behavioralIndicators]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.content.text?.toLowerCase().includes(query) ||
        item.content.evidence?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Quality filter
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(item =>
        (item.quality_tier || 'assumed') === qualityFilter
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.last_updated_at || a.created_at || 0);
        const dateB = new Date(b.last_updated_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'quality') {
      const qualityOrder = { gold: 4, silver: 3, bronze: 2, assumed: 1 };
      filtered.sort((a, b) => {
        const qualA = qualityOrder[(a.quality_tier || 'assumed') as keyof typeof qualityOrder];
        const qualB = qualityOrder[(b.quality_tier || 'assumed') as keyof typeof qualityOrder];
        return qualB - qualA;
      });
    } else if (sortBy === 'usage') {
      filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    }

    return filtered;
  }, [allItems, searchQuery, qualityFilter, categoryFilter, sortBy]);

  // Get selected items
  const selectedItems = useMemo(() => {
    return allItems.filter(item => selectedIds.has(item.id));
  }, [allItems, selectedIds]);

  // Notify parent of selection changes
  useMemo(() => {
    onSelectionChange?.(selectedItems);
  }, [selectedItems, onSelectionChange]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleSelect = (itemId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const getQualityBadge = (tier: string | null | undefined) => {
    const t = tier || 'assumed';
    const configs = {
      gold: { icon: Trophy, className: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Gold' },
      silver: { icon: Star, className: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Silver' },
      bronze: { icon: Star, className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Bronze' },
      assumed: { icon: AlertTriangle, className: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Assumed' }
    };

    const config = configs[t as keyof typeof configs] || configs.assumed;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vault items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quality</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="assumed">Assumed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Power Phrase">Power Phrases</SelectItem>
              <SelectItem value="Skill">Skills</SelectItem>
              <SelectItem value="Competency">Competencies</SelectItem>
              <SelectItem value="Soft Skill">Soft Skills</SelectItem>
              <SelectItem value="Leadership">Leadership</SelectItem>
              <SelectItem value="Executive Presence">Executive Presence</SelectItem>
              <SelectItem value="Personality">Personality</SelectItem>
              <SelectItem value="Work Style">Work Style</SelectItem>
              <SelectItem value="Value">Values</SelectItem>
              <SelectItem value="Behavior">Behaviors</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="usage">Most Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count & Selection controls */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing {filteredItems.length} of {allItems.length} items
            {selectedIds.size > 0 && (
              <span className="ml-2 font-semibold text-purple-600">
                • {selectedIds.size} selected
              </span>
            )}
          </div>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="w-4 h-4 mr-1" />
              Clear selection
            </Button>
          )}
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          {/* Header with select all */}
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Checkbox
                checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-slate-700">Select All</span>
            </div>
          )}

          {/* Items */}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                selectedIds.has(item.id)
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                className="mt-1"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {item.content.text}
                    </p>
                    {item.content.evidence && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        Evidence: {Array.isArray(item.content.evidence) ? item.content.evidence.join(', ') : item.content.evidence}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  {getQualityBadge(item.quality_tier)}
                  {item.usage_count && item.usage_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Used {item.usage_count}×
                    </Badge>
                  )}
                  {item.last_updated_at && (
                    <span className="text-xs text-slate-500">
                      {format(new Date(item.last_updated_at), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No items found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
