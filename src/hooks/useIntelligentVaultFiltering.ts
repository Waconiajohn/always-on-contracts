import { useMemo } from 'react';

interface VaultItem {
  id: string;
  text: string;
  category?: string;
  type: 'phrase' | 'skill' | 'competency';
}

interface RankedVaultItem extends VaultItem {
  relevanceScore: number;
  matchedKeywords: string[];
  isRequired: boolean;
}

export const useIntelligentVaultFiltering = (
  vaultData: any,
  jobDescription: string
) => {
  return useMemo(() => {
    if (!jobDescription.trim() || !vaultData) {
      return {
        rankedPhrases: [],
        rankedSkills: [],
        rankedCompetencies: [],
        requiredKeywords: [],
        totalMatches: 0
      };
    }

    // Extract keywords from job description
    const jobLower = jobDescription.toLowerCase();
    const words = jobLower.split(/\s+/);
    
    // Common job keywords that indicate requirements
    const requirementIndicators = [
      'required', 'must have', 'essential', 'mandatory', 
      'needed', 'critical', 'key requirement'
    ];
    
    // Extract required keywords
    const requiredKeywords: string[] = [];
    const lines = jobDescription.split('\n');
    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      if (requirementIndicators.some(ind => lineLower.includes(ind))) {
        // Extract technical terms (capitalized words, tech acronyms)
        const matches = line.match(/\b[A-Z][A-Za-z0-9+#]{2,}\b/g);
        if (matches) requiredKeywords.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Score function: calculate relevance (0-10)
    const scoreItem = (text: string): { score: number; keywords: string[] } => {
      const itemLower = text.toLowerCase();
      const matchedKeywords: string[] = [];
      let score = 0;

      // Check for exact phrase matches (high value)
      const phrases = jobLower.match(/\b\w+(?:\s+\w+){1,3}\b/g) || [];
      phrases.forEach(phrase => {
        if (phrase.length > 10 && itemLower.includes(phrase)) {
          score += 3;
          matchedKeywords.push(phrase);
        }
      });

      // Check for required keywords (very high value)
      requiredKeywords.forEach(keyword => {
        if (itemLower.includes(keyword)) {
          score += 5;
          if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
        }
      });

      // Check for individual word matches
      const importantWords = words.filter(w => 
        w.length > 4 && 
        !['about', 'their', 'these', 'those', 'would', 'could', 'should'].includes(w)
      );
      
      importantWords.forEach(word => {
        if (itemLower.includes(word)) {
          score += 0.5;
          if (!matchedKeywords.includes(word)) matchedKeywords.push(word);
        }
      });

      // Normalize score to 0-10
      return { 
        score: Math.min(10, Math.round(score * 10) / 10),
        keywords: matchedKeywords.slice(0, 5) // Top 5 keywords
      };
    };

    // Rank power phrases
    const rankedPhrases: RankedVaultItem[] = (vaultData.vault_power_phrases || [])
      .map((phrase: any) => {
        const { score, keywords } = scoreItem(phrase.power_phrase);
        return {
          id: phrase.id,
          text: phrase.power_phrase,
          category: phrase.category,
          type: 'phrase' as const,
          relevanceScore: score,
          matchedKeywords: keywords,
          isRequired: keywords.some(k => requiredKeywords.includes(k))
        };
      })
      .sort((a: RankedVaultItem, b: RankedVaultItem) => b.relevanceScore - a.relevanceScore);

    // Rank skills
    const rankedSkills: RankedVaultItem[] = (vaultData.vault_transferable_skills || [])
      .map((skill: any) => {
        const { score, keywords } = scoreItem(skill.stated_skill);
        return {
          id: skill.id,
          text: skill.stated_skill,
          category: skill.skill_category,
          type: 'skill' as const,
          relevanceScore: score,
          matchedKeywords: keywords,
          isRequired: keywords.some(k => requiredKeywords.includes(k))
        };
      })
      .sort((a: RankedVaultItem, b: RankedVaultItem) => b.relevanceScore - a.relevanceScore);

    // Rank competencies
    const rankedCompetencies: RankedVaultItem[] = (vaultData.vault_hidden_competencies || [])
      .map((comp: any) => {
        const { score, keywords } = scoreItem(
          `${comp.competency_area} ${comp.inferred_capability}`
        );
        return {
          id: comp.id,
          text: comp.competency_area,
          category: comp.inferred_capability,
          type: 'competency' as const,
          relevanceScore: score,
          matchedKeywords: keywords,
          isRequired: keywords.some(k => requiredKeywords.includes(k))
        };
      })
      .sort((a: RankedVaultItem, b: RankedVaultItem) => b.relevanceScore - a.relevanceScore);

    const totalMatches = 
      rankedPhrases.filter(p => p.relevanceScore > 0).length +
      rankedSkills.filter(s => s.relevanceScore > 0).length +
      rankedCompetencies.filter(c => c.relevanceScore > 0).length;

    return {
      rankedPhrases: rankedPhrases.slice(0, 15), // Top 15
      rankedSkills: rankedSkills.slice(0, 20), // Top 20
      rankedCompetencies: rankedCompetencies.slice(0, 10), // Top 10
      requiredKeywords,
      totalMatches
    };
  }, [vaultData, jobDescription]);
};
