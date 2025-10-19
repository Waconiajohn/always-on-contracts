import { useState, useEffect } from 'react';

interface RelevanceScore {
  item: any;
  relevanceScore: number;
  keywordMatches: string[];
  isRequired: boolean;
}

export function useIntelligentVaultFiltering(vaultData: any, jobDescription: string) {
  const [filteredVault, setFilteredVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!vaultData || !jobDescription) {
      setLoading(false);
      return;
    }
    
    const filterAndScore = () => {
      const keywords = extractKeywords(jobDescription);
      
      const scoredPhrases = (vaultData.vault_power_phrases || []).map(phrase => ({
        ...phrase,
        relevanceScore: calculateRelevance(phrase.power_phrase, keywords),
        keywordMatches: findMatches(phrase.power_phrase, keywords)
      }));
      
      const scoredSkills = (vaultData.vault_transferable_skills || []).map(skill => ({
        ...skill,
        relevanceScore: calculateRelevance(skill.stated_skill + ' ' + (skill.transferable_skill || ''), keywords),
        isRequired: keywords.some(kw => 
          skill.stated_skill.toLowerCase().includes(kw.toLowerCase())
        ),
        keywordMatches: findMatches(skill.stated_skill, keywords)
      }));
      
      const scoredCompetencies = (vaultData.vault_hidden_competencies || []).map(comp => ({
        ...comp,
        relevanceScore: calculateRelevance(comp.competency_area + ' ' + comp.inferred_capability, keywords),
        keywordMatches: findMatches(comp.competency_area, keywords)
      }));
      
      setFilteredVault({
        powerPhrases: scoredPhrases.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 15),
        skills: scoredSkills.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20),
        competencies: scoredCompetencies.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10),
        allPhrases: scoredPhrases,
        allSkills: scoredSkills,
        allCompetencies: scoredCompetencies
      });
      
      setLoading(false);
    };
    
    filterAndScore();
  }, [vaultData, jobDescription]);
  
  return { filteredVault, loading };
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'has', 'have', 'had', 'will', 'would', 'should', 'can', 'could']);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return Array.from(new Set(words));
}

function calculateRelevance(text: string, keywords: string[]): number {
  const textLower = text.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      score += keyword.length > 5 ? 3 : 1;
    }
  });
  
  return Math.min(score, 10);
}

function findMatches(text: string, keywords: string[]): string[] {
  const textLower = text.toLowerCase();
  return keywords.filter(kw => textLower.includes(kw)).slice(0, 3);
}
