/**
 * VAULT DATA TRANSFORMER
 * 
 * Converts AI-extracted vault data into a consistent format for UI display.
 * Handles both snake_case (AI response) and camelCase (UI) field names.
 */

interface VaultItem {
  category: string;
  content: string;
  subContent?: string;
  metadata: any;
  confidence?: number;
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  // Database identifiers for deletion
  tableName?: string;
  recordId?: string;
}

/**
 * Safely get a value from an object using multiple possible field names
 */
const getField = (obj: any, ...fieldNames: string[]): string | undefined => {
  for (const name of fieldNames) {
    if (obj[name]) return obj[name];
  }
  return undefined;
};

/**
 * Transform extracted data into reviewable vault items
 */
export const transformExtractedDataToItems = (extractedData: any): VaultItem[] => {
  const allItems: VaultItem[] = [];

  // Power Phrases
  extractedData.powerPhrases?.forEach((pp: any) => {
    allItems.push({
      category: 'Power Phrase',
      content: pp.phrase || '',
      subContent: pp.context || '',
      metadata: pp,
      confidence: pp.confidence || 85,
      status: 'pending'
    });
  });

  // Transferable Skills
  extractedData.transferableSkills?.forEach((skill: any) => {
    allItems.push({
      category: 'Transferable Skill',
      content: skill.skill || '',
      subContent: skill.evidence || '',
      metadata: skill,
      confidence: skill.level === 'expert' ? 95 : skill.level === 'advanced' ? 85 : 75,
      status: 'pending'
    });
  });

  // Hidden Competencies
  extractedData.hiddenCompetencies?.forEach((comp: any) => {
    allItems.push({
      category: 'Hidden Competency',
      content: comp.competency || '',
      subContent: comp.description || '',
      metadata: comp,
      confidence: 80,
      status: 'pending'
    });
  });

  // Soft Skills - handle both field name formats
  extractedData.softSkills?.forEach((soft: any) => {
    allItems.push({
      category: 'Soft Skill',
      content: getField(soft, 'skillName', 'skill_name', 'skill') || '',
      subContent: soft.evidence || '',
      metadata: soft,
      confidence: 80,
      status: 'pending'
    });
  });

  // Leadership Philosophy - handle both formats
  extractedData.leadershipPhilosophy?.forEach((phil: any) => {
    allItems.push({
      category: 'Leadership Philosophy',
      content: getField(phil, 'philosophyStatement', 'philosophy_statement') || '',
      subContent: getField(phil, 'realWorldApplication', 'real_world_application', 'supportingEvidence', 'supporting_evidence') || '',
      metadata: phil,
      confidence: 85,
      status: 'pending'
    });
  });

  // Executive Presence - handle both formats
  extractedData.executivePresence?.forEach((pres: any) => {
    allItems.push({
      category: 'Executive Presence',
      content: getField(pres, 'presenceIndicator', 'presence_indicator') || '',
      subContent: getField(pres, 'situationalExample', 'situational_example', 'evidence') || '',
      metadata: pres,
      confidence: 80,
      status: 'pending'
    });
  });

  // Personality Traits - handle both formats
  extractedData.personalityTraits?.forEach((trait: any) => {
    allItems.push({
      category: 'Personality Trait',
      content: getField(trait, 'traitName', 'trait_name') || '',
      subContent: getField(trait, 'behavioralEvidence', 'behavioral_evidence', 'evidence') || '',
      metadata: trait,
      confidence: 75,
      status: 'pending'
    });
  });

  // Work Style - handle both formats
  extractedData.workStyle?.forEach((style: any) => {
    allItems.push({
      category: 'Work Style',
      content: getField(style, 'preferenceArea', 'preference_area', 'styleAspect', 'style_aspect') || '',
      subContent: getField(style, 'preferenceDescription', 'preference_description', 'evidence', 'examples') || '',
      metadata: style,
      confidence: 75,
      status: 'pending'
    });
  });

  // Values - handle both formats
  extractedData.values?.forEach((value: any) => {
    allItems.push({
      category: 'Core Value',
      content: getField(value, 'valueName', 'value_name') || '',
      subContent: getField(value, 'manifestation', 'evidence') || '',
      metadata: value,
      confidence: 80,
      status: 'pending'
    });
  });

  // Behavioral Indicators - handle both formats
  extractedData.behavioralIndicators?.forEach((indicator: any) => {
    allItems.push({
      category: 'Behavioral Pattern',
      content: getField(indicator, 'indicatorType', 'indicator_type') || '',
      subContent: getField(indicator, 'specificBehavior', 'specific_behavior') || '',
      metadata: indicator,
      confidence: 75,
      status: 'pending'
    });
  });

  return allItems;
};

/**
 * Map review categories to database table names for deletion
 */
export const getCategoryTableMapping = (): Record<string, string> => ({
  'Power Phrase': 'vault_power_phrases',
  'Transferable Skill': 'vault_transferable_skills',
  'Hidden Competency': 'vault_hidden_competencies',
  'Soft Skill': 'vault_soft_skills',
  'Leadership Philosophy': 'vault_leadership_philosophy',
  'Executive Presence': 'vault_executive_presence',
  'Personality Trait': 'vault_personality_traits',
  'Work Style': 'vault_work_style',
  'Core Value': 'vault_values',
  'Behavioral Pattern': 'vault_behavioral_indicators'
});
