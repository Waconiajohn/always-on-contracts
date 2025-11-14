/**
 * Resume Content Formatting Utilities
 * Cleans and formats AI-generated resume content for professional display
 */

/**
 * Remove citation references like [uuid] or [a6510a33-...]
 */
export function removeCitations(text: string): string {
  if (!text) return '';
  return text.replace(/\[[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\]/gi, '');
}

/**
 * Convert markdown formatting to plain text with proper emphasis
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  // Remove bold formatting but keep the text
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Remove italic formatting but keep the text
  text = text.replace(/\*(.*?)\*/g, '$1');
  
  // Remove inline code formatting
  text = text.replace(/`(.*?)`/g, '$1');
  
  // Clean up any remaining markdown artifacts
  text = text.replace(/#{1,6}\s/g, '');
  
  return text.trim();
}

/**
 * Clean and format resume content for professional display
 */
export function formatResumeContent(content: any): string {
  if (typeof content === 'string') {
    let cleaned = removeCitations(content);
    cleaned = cleanMarkdown(cleaned);
    return cleaned;
  }
  
  if (Array.isArray(content)) {
    return content
      .map(item => formatResumeContent(item))
      .filter(Boolean)
      .join('\n');
  }
  
  if (typeof content === 'object' && content.content) {
    return formatResumeContent(content.content);
  }
  
  return String(content || '');
}

/**
 * Extract skills from comma-separated or array format
 */
export function parseSkills(skillsContent: any): string[] {
  if (Array.isArray(skillsContent)) {
    return skillsContent.map(s => formatResumeContent(s));
  }
  
  if (typeof skillsContent === 'string') {
    return skillsContent
      .split(/[,\\n]+/)
      .map(s => formatResumeContent(s))
      .filter(Boolean);
  }
  
  return [];
}
