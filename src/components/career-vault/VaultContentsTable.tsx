import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Eye, Trophy, Star, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface VaultItem {
  id: string;
  category: string;
  content: any;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at?: string;
}

import type {
  PowerPhrase,
  TransferableSkill,
  HiddenCompetency,
  SoftSkill,
  LeadershipPhilosophy,
  ExecutivePresence,
  PersonalityTrait,
  WorkStyle,
  CoreValue,
  BehavioralIndicator
} from '@/types/vault';

interface VaultContentsTableProps {
  powerPhrases: PowerPhrase[];
  transferableSkills: TransferableSkill[];
  hiddenCompetencies: HiddenCompetency[];
  softSkills: SoftSkill[];
  leadershipPhilosophy: LeadershipPhilosophy[];
  executivePresence: ExecutivePresence[];
  personalityTraits: PersonalityTrait[];
  workStyle: WorkStyle[];
  values: CoreValue[];
  behavioralIndicators: BehavioralIndicator[];
  onEdit: (item: VaultItem) => void;
  onView: (item: VaultItem) => void;
}

export const VaultContentsTable = ({
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
  onView
}: VaultContentsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Combine all items into unified structure
  const allItems: VaultItem[] = useMemo(() => {
    const items: VaultItem[] = [];

    powerPhrases.forEach(item => items.push({
      id: item.id,
      category: 'Career Achievement',
      content: { text: item.power_phrase || item.phrase, keywords: item.keywords },
      quality_tier: item.quality_tier,
      source: item.source || 'Resume',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    transferableSkills.forEach(item => items.push({
      id: item.id,
      category: 'Skill & Expertise',
      content: { text: item.stated_skill || item.skill, evidence: item.evidence },
      quality_tier: item.quality_tier,
      source: item.source || 'Resume',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    hiddenCompetencies.forEach(item => items.push({
      id: item.id,
      category: 'Strategic Capability',
      content: { text: item.competency_area || item.inferred_capability, evidence: item.supporting_evidence },
      quality_tier: item.quality_tier,
      source: item.source || 'AI Analysis',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at
    }));

    softSkills.forEach(item => items.push({
      id: item.id,
      category: 'Professional Strength',
      content: { text: item.skill_name, examples: item.examples },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Analysis',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    leadershipPhilosophy.forEach(item => items.push({
      id: item.id,
      category: 'Leadership',
      content: { text: item.philosophy_statement, style: item.leadership_style },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    executivePresence.forEach(item => items.push({
      id: item.id,
      category: 'Executive Presence',
      content: { text: item.presence_indicator, example: item.situational_example },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    personalityTraits.forEach(item => items.push({
      id: item.id,
      category: 'Personality',
      content: { text: item.trait_name, evidence: item.behavioral_evidence },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'AI Inference',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    workStyle.forEach(item => items.push({
      id: item.id,
      category: 'Work Style',
      content: { text: item.preference_area, description: item.preference_description },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    values.forEach(item => items.push({
      id: item.id,
      category: 'Value',
      content: { text: item.value_name, manifestation: item.manifestation },
      quality_tier: item.quality_tier,
      source: item.inferred_from || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
    }));

    behavioralIndicators.forEach(item => items.push({
      id: item.id,
      category: 'Behavior',
      content: { text: item.indicator_type, behavior: item.specific_behavior },
      quality_tier: item.quality_tier,
      source: item.context || 'Interview',
      usage_count: item.usage_count || 0,
      last_updated_at: item.last_updated_at,
      created_at: item.created_at || ''
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

  const getQualityBadge = (tier: string | null | undefined) => {
    const t = tier || 'assumed';
    const configs = {
      gold: { icon: Trophy, className: 'bg-tier-gold-bg text-tier-gold border-tier-gold', label: 'Verified' },
      silver: { icon: Star, className: 'bg-tier-silver-bg text-tier-silver border-tier-silver', label: 'Verified' },
      bronze: { icon: Star, className: 'bg-tier-bronze-bg text-tier-bronze border-tier-bronze', label: 'Verified' },
      assumed: { icon: AlertTriangle, className: 'bg-tier-assumed-bg text-tier-assumed border-tier-assumed', label: 'Needs Review' }
    };

    const config = configs[t as keyof typeof configs] || configs.assumed;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="space-y-4">
        {/* Simplified Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your career vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={`${qualityFilter}|${categoryFilter}|${sortBy}`} 
            onValueChange={(value) => {
              const [q, c, s] = value.split('|');
              setQualityFilter(q);
              setCategoryFilter(c);
              setSortBy(s);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter & Sort" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quality</div>
              <SelectItem value="all|all|recent">All Items</SelectItem>
              <SelectItem value="gold|all|recent">✓ Verified</SelectItem>
              <SelectItem value="assumed|all|recent">📝 Needs Review</SelectItem>
              <SelectItem value="all|all|quality">By Quality</SelectItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Type</div>
              <SelectItem value="all|Career Achievement|recent">Career Achievements</SelectItem>
              <SelectItem value="all|Skill|recent">Skills & Expertise</SelectItem>
              <SelectItem value="all|Competency|recent">Strategic Capabilities</SelectItem>
              <SelectItem value="all|Soft Skill|recent">Professional Strengths</SelectItem>
              <SelectItem value="all|Leadership|recent">Leadership</SelectItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Sort</div>
              <SelectItem value="all|all|recent">Most Recent</SelectItem>
              <SelectItem value="all|all|usage">Most Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {allItems.length} items
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    {getQualityBadge(item.quality_tier)}
                    {(item.usage_count || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Used in {item.usage_count} resume{item.usage_count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="font-medium text-sm">{item.content.text}</p>
                  
                  {item.content.evidence && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Evidence: {item.content.evidence}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Source: {item.source}</span>
                    {item.last_updated_at && (
                      <span>
                        Updated: {format(new Date(item.last_updated_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onView(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items match your filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};