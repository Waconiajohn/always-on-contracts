// Comprehensive job title synonym mapping for intelligent boolean search generation
export const JOB_SYNONYMS: Record<string, string[]> = {
  // Product & Program Management
  "Product Manager": ["Program Manager", "Product Owner", "Technical Product Manager", "Product Lead", "Platform Product Manager"],
  "Program Manager": ["Product Manager", "Project Manager", "Technical Program Manager", "Delivery Manager"],
  "Product Owner": ["Product Manager", "Scrum Product Owner", "Agile Product Owner"],
  
  // Engineering & Development
  "Software Engineer": ["Software Developer", "Full Stack Developer", "Application Developer", "Engineer"],
  "Full Stack Developer": ["Full Stack Engineer", "Software Engineer", "Web Developer"],
  "Frontend Developer": ["Frontend Engineer", "UI Developer", "Web Developer", "React Developer"],
  "Backend Developer": ["Backend Engineer", "Server Developer", "API Developer"],
  "DevOps Engineer": ["Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer", "Cloud Engineer"],
  "Mobile Developer": ["iOS Developer", "Android Developer", "Mobile Engineer", "App Developer"],
  
  // Data & Analytics
  "Data Scientist": ["Machine Learning Engineer", "Data Analyst", "AI Engineer", "ML Scientist"],
  "Data Analyst": ["Business Analyst", "Data Scientist", "Analytics Engineer", "BI Analyst"],
  "Data Engineer": ["Big Data Engineer", "ETL Developer", "Data Platform Engineer"],
  "Machine Learning Engineer": ["ML Engineer", "AI Engineer", "Data Scientist", "Deep Learning Engineer"],
  
  // Design
  "UX Designer": ["User Experience Designer", "Product Designer", "UI/UX Designer", "Experience Designer"],
  "UI Designer": ["Visual Designer", "Interface Designer", "Product Designer"],
  "Product Designer": ["UX Designer", "UI/UX Designer", "User Experience Designer"],
  
  // Marketing
  "Marketing Manager": ["Digital Marketing Manager", "Growth Manager", "Marketing Lead"],
  "Content Manager": ["Content Strategist", "Content Marketing Manager", "Editorial Manager"],
  "Social Media Manager": ["Social Media Strategist", "Community Manager", "Digital Marketing Specialist"],
  
  // Sales & Business
  "Account Executive": ["Sales Executive", "Business Development Representative", "Sales Manager"],
  "Business Development": ["BD Manager", "Partnerships Manager", "Growth Manager"],
  "Customer Success Manager": ["Account Manager", "Client Success Manager", "Customer Support Manager"],
  
  // Leadership
  "Engineering Manager": ["Software Engineering Manager", "Development Manager", "Technical Manager"],
  "Director of Engineering": ["VP of Engineering", "Head of Engineering", "Engineering Lead"],
  "CTO": ["Chief Technology Officer", "VP of Engineering", "Head of Technology"],
  
  // Operations
  "Operations Manager": ["Business Operations Manager", "Project Manager", "Operations Lead"],
  "Project Manager": ["Program Manager", "Delivery Manager", "Scrum Master"],
  "Scrum Master": ["Agile Coach", "Agile Project Manager", "Team Lead"],
};

// Common skills by job category for quick suggestions
export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  engineering: ["JavaScript", "Python", "React", "Node.js", "TypeScript", "AWS", "Docker", "Kubernetes", "Git", "SQL"],
  product: ["Agile", "Scrum", "Product Strategy", "Roadmapping", "User Research", "A/B Testing", "Analytics", "Jira"],
  data: ["Python", "SQL", "Machine Learning", "Data Analysis", "Pandas", "TensorFlow", "R", "Statistics", "Big Data"],
  design: ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping", "Wireframing", "Design Systems"],
  marketing: ["SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media", "Email Marketing", "CRM"],
  sales: ["Salesforce", "CRM", "Cold Calling", "Lead Generation", "Pipeline Management", "Account Management"],
};

// Common exclusions by seniority level
export const EXCLUSIONS_BY_LEVEL: Record<string, string[]> = {
  senior: ["junior", "intern", "entry", "graduate", "associate"],
  mid: ["junior", "intern", "entry", "graduate", "senior", "lead", "principal"],
  entry: ["senior", "lead", "principal", "staff", "director"],
};

// Experience level configurations
export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level", excludes: ["senior", "lead", "principal", "staff", "director", "manager"] },
  { value: "mid", label: "Mid-Level", excludes: ["junior", "intern", "entry", "graduate", "senior", "lead", "principal"] },
  { value: "senior", label: "Senior", excludes: ["junior", "intern", "entry", "graduate", "associate"] },
  { value: "lead", label: "Lead/Staff", excludes: ["junior", "intern", "entry", "mid", "associate"] },
  { value: "executive", label: "Executive", excludes: ["junior", "intern", "entry", "mid", "associate"] },
] as const;

// Helper function to get job title suggestions
export function getJobTitleSuggestions(title: string): string[] {
  const normalized = title.trim();
  
  // Direct match
  if (JOB_SYNONYMS[normalized]) {
    return JOB_SYNONYMS[normalized];
  }
  
  // Partial match
  for (const [key, synonyms] of Object.entries(JOB_SYNONYMS)) {
    if (key.toLowerCase().includes(normalized.toLowerCase()) || 
        normalized.toLowerCase().includes(key.toLowerCase())) {
      return synonyms;
    }
  }
  
  return [];
}

// Helper function to detect job category
export function detectJobCategory(title: string): keyof typeof SKILLS_BY_CATEGORY | null {
  const lower = title.toLowerCase();
  
  if (lower.includes('engineer') || lower.includes('developer')) return 'engineering';
  if (lower.includes('product') || lower.includes('program')) return 'product';
  if (lower.includes('data') || lower.includes('analyst') || lower.includes('scientist')) return 'data';
  if (lower.includes('design') || lower.includes('ux') || lower.includes('ui')) return 'design';
  if (lower.includes('marketing') || lower.includes('content')) return 'marketing';
  if (lower.includes('sales') || lower.includes('account')) return 'sales';
  
  return null;
}
