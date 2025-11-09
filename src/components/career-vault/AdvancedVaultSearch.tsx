// =====================================================
// ADVANCED VAULT SEARCH - Career Vault 2.0
// =====================================================
// FULL-TEXT SEARCH WITH INSTANT RESULTS
//
// This component provides advanced search across all
// vault categories using PostgreSQL full-text indexes
// for instant, context-aware results.
//
// MARKETING MESSAGE:
// "Unlike basic keyword search, our AI-powered vault
// search understands context—finding related items you
// might have missed with simple text matching."
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateInput, invokeEdgeFunction, SearchVaultAdvancedSchema } from '@/lib/edgeFunction';
import {
  Search,
  Loader2,
  Sparkles,
  Filter,
  X,
  TrendingUp,
  Award,
  Target,
  Brain,
  Users,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  item_id: string;
  item_type: string;
  content: string;
  quality_tier: string;
  confidence_score: number;
  effectiveness_score: number;
  match_rank: number;
}

interface AdvancedVaultSearchProps {
  vaultId: string;
  onViewItem?: (itemId: string, itemType: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'power_phrases': Award,
  'transferable_skills': Target,
  'hidden_competencies': Brain,
  'soft_skills': Users,
  'leadership_philosophy': Star,
  'executive_presence': Sparkles,
  'personality_traits': Zap,
  'work_style': TrendingUp,
  'values_motivations': Star,
  'behavioral_indicators': Eye,
};

export default function AdvancedVaultSearch({ vaultId, onViewItem }: AdvancedVaultSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsByCategory, setResultsByCategory] = useState<Record<string, SearchResult[]>>({});
  const [insights, setInsights] = useState<any>(null);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter search query',
        description: 'Please enter a search term',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    try {
      const validatedInput = validateInput(SearchVaultAdvancedSchema, {
        vaultId,
        query: searchQuery,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        qualityTier: qualityFilter !== 'all' ? qualityFilter as any : undefined,
        limit: 100
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'search-vault-advanced',
        validatedInput
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResults(data.data.results || []);
      setResultsByCategory(data.data.resultsByCategory || {});
      setInsights(data.data.insights || null);
      setSearchMeta(data.meta || null);

      toast({
        title: '🔍 Search Complete',
        description: data.meta?.message || `Found ${data.data.results?.length || 0} results`,
      });
    } catch (err: any) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setResultsByCategory({});
    setInsights(null);
    setSearchMeta(null);
    setCategoryFilter('all');
    setQualityFilter('all');
  };

  const getQualityColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getMatchRankColor = (rank: number) => {
    if (rank >= 0.7) return 'text-green-600';
    if (rank >= 0.4) return 'text-blue-600';
    return 'text-slate-600';
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              Advanced Vault Search
            </CardTitle>
            <CardDescription>
              AI-powered search across all {Object.keys(CATEGORY_ICONS).length} intelligence categories
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search your vault... (e.g., 'leadership', 'cost reduction', 'team building')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
          {results.length > 0 && (
            <Button variant="outline" onClick={clearSearch}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid md:grid-cols-2 gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="power_phrases">Power Phrases</SelectItem>
                  <SelectItem value="transferable_skills">Skills</SelectItem>
                  <SelectItem value="hidden_competencies">Competencies</SelectItem>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="leadership_philosophy">Leadership</SelectItem>
                  <SelectItem value="executive_presence">Executive Presence</SelectItem>
                  <SelectItem value="personality_traits">Personality</SelectItem>
                  <SelectItem value="work_style">Work Style</SelectItem>
                  <SelectItem value="values_motivations">Values</SelectItem>
                  <SelectItem value="behavioral_indicators">Behaviors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Quality Tier</label>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality Tiers</SelectItem>
                  <SelectItem value="gold">Gold (User-Verified)</SelectItem>
                  <SelectItem value="silver">Silver (Confirmed)</SelectItem>
                  <SelectItem value="bronze">Bronze (Medium Confidence)</SelectItem>
                  <SelectItem value="assumed">Assumed (Low Confidence)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Insights */}
        {insights && (
          <Alert className="bg-purple-50 border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <p className="font-medium text-purple-900">{searchMeta?.message}</p>
                <p className="text-purple-700">{searchMeta?.uniqueValue}</p>
                {searchMeta?.searchTip && (
                  <p className="text-purple-600 italic">{searchMeta.searchTip}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Stats */}
        {insights && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">{insights.totalResults}</div>
              <div className="text-xs text-blue-700">Total Results</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-900">{insights.categoriesFound?.length || 0}</div>
              <div className="text-xs text-green-700">Categories</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="text-2xl font-bold text-amber-900">{insights.qualityBreakdown?.gold || 0}</div>
              <div className="text-xs text-amber-700">Gold Items</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">
                {(insights.avgMatchRank * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-purple-700">Avg Match</div>
            </div>
          </div>
        )}

        {/* Results by Category */}
        {Object.keys(resultsByCategory).length > 0 && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {Object.entries(resultsByCategory).map(([category, items]) => {
              const Icon = CATEGORY_ICONS[category] || Search;
              return (
                <div key={category} className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Icon className="w-4 h-4 text-purple-600" />
                    {category.replace(/_/g, ' ').toUpperCase()} ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((result) => (
                      <Card
                        key={result.item_id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onViewItem?.(result.item_id, result.item_type)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground line-clamp-2 mb-2">
                              {result.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getQualityColor(result.quality_tier)}
                              >
                                {result.quality_tier}
                              </Badge>
                              {result.confidence_score > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {(result.confidence_score * 100).toFixed(0)}% confidence
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`text-sm font-semibold ${getMatchRankColor(result.match_rank)}`}>
                              {(result.match_rank * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-500">match</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && !isSearching && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No results found for "{searchQuery}"</p>
            <p className="text-sm text-slate-500">
              Try different search terms or remove filters
            </p>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !searchQuery && (
          <div className="text-center py-8 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="text-sm">
              Enter a search term to find items across your entire vault
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
