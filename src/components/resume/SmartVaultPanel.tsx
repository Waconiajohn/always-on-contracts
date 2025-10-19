import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Star, Search, Sparkles, Brain, Award } from 'lucide-react';
import { useIntelligentVaultFiltering } from '@/hooks/useIntelligentVaultFiltering';

interface SmartVaultPanelProps {
  vaultData: any;
  jobDescription: string;
  selectedPhrases: string[];
  selectedSkills: string[];
  onTogglePhrase: (id: string) => void;
  onToggleSkill: (id: string) => void;
}

export const SmartVaultPanel = ({
  vaultData,
  jobDescription,
  selectedPhrases,
  selectedSkills,
  onTogglePhrase,
  onToggleSkill
}: SmartVaultPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    rankedPhrases,
    rankedSkills,
    rankedCompetencies,
    totalMatches
  } = useIntelligentVaultFiltering(vaultData, jobDescription);

  const filterBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.text.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.matchedKeywords?.some((k: string) => k.includes(query))
    );
  };

  const filteredPhrases = filterBySearch(rankedPhrases);
  const filteredSkills = filterBySearch(rankedSkills);
  const filteredCompetencies = filterBySearch(rankedCompetencies);

  const hasJobDescription = jobDescription.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          {hasJobDescription ? (
            <>
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Vault (Relevance-Ranked)
            </>
          ) : (
            <>
              <Brain className="h-5 w-5 text-muted-foreground" />
              Your Career Vault
            </>
          )}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {hasJobDescription 
            ? `${totalMatches} relevant items found`
            : 'Enter a job description to see relevance scores'
          }
        </p>
      </div>

      {hasJobDescription && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {/* Power Phrases */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Power Phrases
              <Badge variant="secondary" className="ml-auto">
                {filteredPhrases.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {filteredPhrases.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {searchQuery ? 'No matches found' : 'No relevant phrases found'}
                </p>
              ) : (
                filteredPhrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedPhrases.includes(phrase.id)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    onClick={() => onTogglePhrase(phrase.id)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {phrase.category}
                      </Badge>
                      {phrase.isRequired && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      )}
                      {hasJobDescription && phrase.relevanceScore > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto text-xs"
                        >
                          {phrase.relevanceScore}/10
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{phrase.text}</p>
                    {phrase.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phrase.matchedKeywords.slice(0, 3).map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Transferable Skills
              <Badge variant="secondary" className="ml-auto">
                {filteredSkills.length}
              </Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {filteredSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {searchQuery ? 'No matches found' : 'No relevant skills found'}
                </p>
              ) : (
                filteredSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={selectedSkills.includes(skill.id) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs px-3 py-1 flex items-center gap-1"
                    onClick={() => onToggleSkill(skill.id)}
                  >
                    {skill.isRequired && <Star className="h-3 w-3" />}
                    {skill.text}
                    {hasJobDescription && skill.relevanceScore > 0 && (
                      <span className="ml-1 opacity-70">
                        ({skill.relevanceScore})
                      </span>
                    )}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Hidden Competencies */}
          {filteredCompetencies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Hidden Competencies
                <Badge variant="secondary" className="ml-auto">
                  {filteredCompetencies.length}
                </Badge>
              </h3>
              <div className="space-y-2">
                {filteredCompetencies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-2 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {comp.text}
                      </Badge>
                      {comp.isRequired && (
                        <Star className="h-3 w-3 text-primary" />
                      )}
                      {hasJobDescription && comp.relevanceScore > 0 && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {comp.relevanceScore}/10
                        </Badge>
                      )}
                    </div>
                    {comp.category && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {comp.category}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {hasJobDescription && totalMatches > 0 && (
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Select all high-relevance items (score >= 5)
              const highRelevancePhrases = rankedPhrases
                .filter(p => p.relevanceScore >= 5)
                .map(p => p.id);
              const highRelevanceSkills = rankedSkills
                .filter(s => s.relevanceScore >= 5)
                .map(s => s.id);
              
              highRelevancePhrases.forEach(id => {
                if (!selectedPhrases.includes(id)) onTogglePhrase(id);
              });
              highRelevanceSkills.forEach(id => {
                if (!selectedSkills.includes(id)) onToggleSkill(id);
              });
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Select High-Relevance Items
          </Button>
        </div>
      )}
    </div>
  );
};
