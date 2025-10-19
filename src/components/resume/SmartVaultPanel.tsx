import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Zap, Brain, Target } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SmartVaultPanelProps {
  filteredVault: any;
  selectedPhrases: string[];
  selectedSkills: string[];
  onTogglePhrase: (id: string) => void;
  onToggleSkill: (id: string) => void;
}

export const SmartVaultPanel = ({ 
  filteredVault, 
  selectedPhrases, 
  selectedSkills, 
  onTogglePhrase, 
  onToggleSkill 
}: SmartVaultPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string[]>(['phrases']);
  
  if (!filteredVault) return null;
  
  const filterBySearch = (items: any[], fields: string[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => item[field]?.toLowerCase().includes(query))
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Smart Vault (Relevance-Ranked)
        </h2>
        <Input 
          placeholder="Search vault items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      
      <Accordion type="multiple" value={expandedCategory} onValueChange={setExpandedCategory}>
        <AccordionItem value="phrases">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Power Phrases ({filteredVault.powerPhrases?.length || 0})
              <Badge variant="outline" className="text-xs">
                {selectedPhrases.length} selected
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {filterBySearch(filteredVault.powerPhrases || [], ['power_phrase']).map((phrase: any) => (
                  <div
                    key={phrase.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      selectedPhrases.includes(phrase.id) 
                        ? "bg-primary/10 border-2 border-primary" 
                        : "bg-muted hover:bg-muted/70",
                      phrase.relevanceScore > 5 && "ring-2 ring-yellow-400"
                    )}
                    onClick={() => onTogglePhrase(phrase.id)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {phrase.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {phrase.relevanceScore > 7 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                        <span className="text-xs text-muted-foreground">
                          {phrase.relevanceScore}/10
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{phrase.power_phrase}</p>
                    {phrase.keywordMatches && phrase.keywordMatches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phrase.keywordMatches.slice(0, 3).map((match: string) => (
                          <Badge key={match} variant="outline" className="text-xs">
                            {match}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="skills">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Transferable Skills ({filteredVault.skills?.length || 0})
              <Badge variant="outline" className="text-xs">
                {selectedSkills.length} selected
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pr-4">
              {filterBySearch(filteredVault.skills || [], ['stated_skill', 'transferable_skill']).map((skill: any) => (
                <Badge
                  key={skill.id}
                  variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs transition-all",
                    skill.isRequired && "ring-2 ring-green-500",
                    skill.relevanceScore > 5 && "font-bold"
                  )}
                  onClick={() => onToggleSkill(skill.id)}
                >
                  {skill.isRequired && "⭐ "}
                  {skill.stated_skill}
                  <span className="ml-1 text-xs opacity-70">({skill.relevanceScore})</span>
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="competencies">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Hidden Competencies ({filteredVault.competencies?.length || 0})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pr-4">
              {filterBySearch(filteredVault.competencies || [], ['competency_area', 'inferred_capability']).map((comp: any) => (
                <div key={comp.id} className="p-2 bg-muted rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {comp.competency_area}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {comp.relevanceScore}/10
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comp.inferred_capability}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
        <p>💡 <strong>Tips:</strong></p>
        <p>• ⭐ = Required skill (appears in job description)</p>
        <p>• Star icon = High relevance (7+/10)</p>
        <p>• Gold ring = Extremely relevant (top matches)</p>
      </div>
    </div>
  );
};
