// Resume Format Templates and Configurations

export interface ResumeSection {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
  guidancePrompt: string; // What AI should tell user about this section
  vaultCategories: string[]; // Which vault categories are relevant
}

export interface ResumeFormat {
  id: string;
  templateId: string; // UUID from resume_templates table
  name: string;
  description: string;
  bestFor: string[];
  sections: ResumeSection[];
  icon: string;
}

export const RESUME_FORMATS: ResumeFormat[] = [
  {
    id: 'executive',
    templateId: '96ac1200-0e4e-4584-b1ec-5f93c2b94376',
    name: 'Executive Format',
    description: 'Best for senior leadership, C-suite, VP, and director-level positions. Emphasizes strategic impact and results.',
    bestFor: ['C-Suite', 'VP', 'Senior Director', 'Executive', 'President', 'COO', 'CFO', 'CMO'],
    icon: '👔',
    sections: [
      {
        id: 'opening_paragraph',
        type: 'opening_paragraph',
        title: 'Professional Summary',
        description: 'Compelling opening paragraph that positions you as the ideal candidate',
        required: true,
        order: 1,
        guidancePrompt: `For this executive position, your opening paragraph should:
• Highlight years of relevant leadership experience
• Mention specific industry expertise that matches the job
• Include 2-3 quantifiable achievements (revenue, team size, market impact)
• Reference technical or domain expertise mentioned in job description
• Use powerful, confident language that demonstrates executive presence
• Keep it to 3-4 sentences maximum`,
        vaultCategories: ['power_phrases', 'resume_milestones', 'hidden_competencies', 'leadership_philosophy', 'executive_presence']
      },
      {
        id: 'core_competencies',
        type: 'skills_list',
        title: 'Core Competencies',
        description: 'Strategic skills and leadership capabilities',
        required: true,
        order: 2,
        guidancePrompt: `Your core competencies section should include 8-12 skills that:
• Match ATS keywords from the job description
• Combine hard skills (technical, domain) and soft skills (leadership, communication)
• Focus on strategic/leadership capabilities, not tactical tasks
• Use industry-standard terminology
• Prioritize skills mentioned in "required qualifications"`,
        vaultCategories: ['transferable_skills', 'soft_skills', 'hidden_competencies']
      },
      {
        id: 'selected_accomplishments',
        type: 'accomplishments',
        title: 'Selected Accomplishments',
        description: 'Top 3-4 achievements that directly address key job requirements',
        required: true,
        order: 3,
        guidancePrompt: `Select 3-4 major accomplishments that:
• Each addresses one of the top job requirements
• Includes specific, quantifiable results (%, $, scale)
• Demonstrates leadership and strategic impact
• Uses strong action verbs (Led, Drove, Transformed, Pioneered)
• Shows progression and increasing responsibility
• Answers "So what?" - why does this matter to the hiring company?`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'leadership_philosophy', 'executive_presence', 'behavioral_indicators']
      },
      {
        id: 'professional_timeline',
        type: 'experience',
        title: 'Professional Experience',
        description: 'Chronological work history with company, title, dates, and key responsibilities',
        required: true,
        order: 4,
        guidancePrompt: `For each position, include:
• Company name, your title, and dates (Month Year - Month Year)
• 2-3 sentence overview of company/role scope
• 3-5 bullet points highlighting key responsibilities and achievements
• Focus on leadership, strategy, and impact - not day-to-day tasks
• Use metrics wherever possible
• Tailor older positions to be more concise`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'leadership_philosophy', 'behavioral_indicators']
      },
      {
        id: 'additional_skills',
        type: 'additional_skills',
        title: 'Additional Skills & Keywords',
        description: 'Secondary skills and ATS keywords to improve score',
        required: false,
        order: 5,
        guidancePrompt: `This section helps with ATS scoring by including:
• Important keywords from job description not yet covered
• Tools, technologies, methodologies mentioned in job posting
• Certifications or specialized knowledge
• Industry buzzwords and terminology
• Keep it concise - just a list of terms`,
        vaultCategories: ['transferable_skills', 'soft_skills', 'hidden_competencies']
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education & Certifications',
        description: 'Academic credentials and professional certifications',
        required: true,
        order: 6,
        guidancePrompt: `Include:
• Highest degree first (e.g., MBA, MS, BS)
• University name and graduation year
• Relevant certifications (PMP, CPA, etc.)
• Professional development if highly relevant
• For executives with 15+ years experience, keep this brief`,
        vaultCategories: ['resume_milestones']
      }
    ]
  },
  {
    id: 'technical',
    templateId: '2269b438-5876-4658-8980-ae8c62374676',
    name: 'Technical Format',
    description: 'Optimized for engineers, developers, architects, and technical specialists. Emphasizes technical skills and projects.',
    bestFor: ['Software Engineer', 'Developer', 'Architect', 'DevOps', 'Data Scientist', 'Technical Lead'],
    icon: '💻',
    sections: [
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        description: 'Brief technical profile highlighting expertise',
        required: true,
        order: 1,
        guidancePrompt: `Your technical summary should:
• Highlight years of experience in specific technologies
• Mention key technical domains (e.g., distributed systems, ML, cloud)
• Include 1-2 major achievements with metrics
• Reference technologies from the job description
• Keep it to 2-3 sentences`,
        vaultCategories: ['power_phrases', 'transferable_skills', 'resume_milestones']
      },
      {
        id: 'technical_skills',
        type: 'technical_skills',
        title: 'Technical Skills',
        description: 'Categorized technical expertise',
        required: true,
        order: 2,
        guidancePrompt: `Organize your technical skills by category:
• Languages: (e.g., Python, Java, TypeScript)
• Frameworks: (e.g., React, Django, Spring)
• Cloud/Infrastructure: (e.g., AWS, Kubernetes, Docker)
• Databases: (e.g., PostgreSQL, MongoDB, Redis)
• Tools: (e.g., Git, Jenkins, Terraform)
• Prioritize skills mentioned in job description`,
        vaultCategories: ['transferable_skills', 'soft_skills']
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        description: 'Work history with technical contributions',
        required: true,
        order: 3,
        guidancePrompt: `For each role:
• Company, title, dates
• Brief company/product description
• 4-6 bullets focusing on technical contributions
• Include technologies used, scale/performance metrics
• Emphasize impact and outcomes, not just tasks`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'transferable_skills', 'behavioral_indicators']
      },
      {
        id: 'projects',
        type: 'projects',
        title: 'Key Projects',
        description: 'Notable technical projects and contributions',
        required: false,
        order: 4,
        guidancePrompt: `Highlight 2-4 significant projects:
• Project name and purpose
• Technologies and architecture
• Your specific role and contributions
• Quantifiable outcomes (performance, scale, adoption)
• Link to GitHub/portfolio if applicable`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'transferable_skills']
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        description: 'Degrees and relevant coursework',
        required: true,
        order: 5,
        guidancePrompt: `Include:
• Degree, major, university, graduation year
• Relevant coursework or specializations
• Academic achievements if early career
• Technical certifications (AWS, Azure, etc.)`,
        vaultCategories: ['resume_milestones']
      }
    ]
  },
  {
    id: 'functional',
    templateId: 'ba535a3f-af9e-4a04-aef1-3ca959651c42', // Using modern template for functional
    name: 'Functional Format',
    description: 'Skills-based format for career changers, gaps in employment, or diverse experience. Emphasizes capabilities over chronology.',
    bestFor: ['Career Changer', 'Returning to Workforce', 'Diverse Experience', 'Consultant'],
    icon: '🔄',
    sections: [
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Profile',
        description: 'Strong positioning statement',
        required: true,
        order: 1,
        guidancePrompt: `Your profile should:
• Position you for the target role despite non-linear path
• Emphasize transferable skills and relevant experience
• Highlight passion/commitment to this field
• Include one strong achievement
• Focus on what you bring, not what you lack`,
        vaultCategories: ['power_phrases', 'resume_milestones', 'leadership_philosophy']
      },
      {
        id: 'core_capabilities',
        type: 'skills_groups',
        title: 'Core Capabilities',
        description: 'Grouped skill areas with supporting examples',
        required: true,
        order: 2,
        guidancePrompt: `Create 3-4 skill clusters, each with:
• Skill category name (e.g., "Project Management")
• 2-3 bullet points demonstrating that skill
• Include specific examples and results
• Match to job requirements`,
        vaultCategories: ['transferable_skills', 'resume_milestones', 'power_phrases']
      },
      {
        id: 'achievements',
        type: 'accomplishments',
        title: 'Key Achievements',
        description: 'Notable accomplishments across career',
        required: true,
        order: 3,
        guidancePrompt: `Select 4-6 achievements that:
• Demonstrate capabilities for target role
• Come from various parts of your background
• Include quantifiable results
• Show progression and growth`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'behavioral_indicators']
      },
      {
        id: 'employment_history',
        type: 'employment_history',
        title: 'Employment History',
        description: 'Brief chronological listing',
        required: true,
        order: 4,
        guidancePrompt: `Simple listing:
• Company, Title, Dates
• One-line description if needed
• No detailed bullets (covered in skills sections above)
• Shows stability and progression`,
        vaultCategories: ['resume_milestones']
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education & Training',
        description: 'Academic and professional development',
        required: true,
        order: 5,
        guidancePrompt: `Include:
• Degrees and certifications
• Relevant training programs
• Professional development
• Shows commitment to continuous learning`,
        vaultCategories: ['resume_milestones']
      }
    ]
  },
  {
    id: 'hybrid',
    templateId: 'ba535a3f-af9e-4a04-aef1-3ca959651c42', // Using modern template for hybrid
    name: 'Hybrid Format',
    description: 'Combines skills highlight with chronological experience. Versatile format for most professional roles.',
    bestFor: ['Manager', 'Analyst', 'Specialist', 'Coordinator', 'Mid-Level Professional'],
    icon: '⚡',
    sections: [
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        description: 'Concise career overview',
        required: true,
        order: 1,
        guidancePrompt: `Write a 2-3 sentence summary that:
• States your years of experience and key expertise
• Highlights 1-2 major achievements
• Mentions relevant skills for this specific job
• Uses confident, professional tone`,
        vaultCategories: ['power_phrases', 'resume_milestones', 'hidden_competencies']
      },
      {
        id: 'key_skills',
        type: 'skills_list',
        title: 'Key Skills',
        description: 'Relevant skills and competencies',
        required: true,
        order: 2,
        guidancePrompt: `List 10-12 skills that:
• Mix hard and soft skills
• Match job requirements and ATS keywords
• Are demonstrably true from your experience
• Use industry-standard terminology`,
        vaultCategories: ['transferable_skills', 'soft_skills', 'hidden_competencies']
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        description: 'Work history with achievements',
        required: true,
        order: 3,
        guidancePrompt: `For each position:
• Company, Title, Dates, Location
• 3-5 achievement-focused bullets
• Use action verbs and quantify results
• Tailor to emphasize relevant experience
• Most recent roles get more detail`,
        vaultCategories: ['resume_milestones', 'power_phrases', 'behavioral_indicators']
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        description: 'Academic background',
        required: true,
        order: 4,
        guidancePrompt: `Include:
• Degree, Major, University, Year
• Relevant honors or achievements
• Certifications if applicable
• Keep concise unless recent graduate`,
        vaultCategories: ['resume_milestones']
      }
    ]
  }
];

// Helper function to recommend format based on job analysis
export function recommendFormat(jobAnalysis: any): string {
  const jobTitle = jobAnalysis.roleProfile?.title?.toLowerCase() || '';
  const seniority = jobAnalysis.roleProfile?.seniority?.toLowerCase() || '';
  const industry = jobAnalysis.roleProfile?.industry?.toLowerCase() || '';

  // Executive roles
  if (
    seniority.includes('executive') ||
    seniority.includes('c-level') ||
    seniority.includes('vp') ||
    seniority.includes('vice president') ||
    seniority.includes('director') ||
    jobTitle.includes('chief') ||
    jobTitle.includes('president') ||
    jobTitle.includes('vp ')
  ) {
    return 'executive';
  }

  // Technical roles
  if (
    jobTitle.includes('engineer') ||
    jobTitle.includes('developer') ||
    jobTitle.includes('architect') ||
    jobTitle.includes('devops') ||
    jobTitle.includes('data scientist') ||
    industry.includes('software') ||
    industry.includes('technology')
  ) {
    return 'technical';
  }

  // Functional format for career changers or diverse backgrounds
  // (This would need more sophisticated logic based on user's profile)

  // Default to hybrid for most professional roles
  return 'hybrid';
}

// Get format by ID
export function getFormat(formatId: string): ResumeFormat | undefined {
  return RESUME_FORMATS.find(f => f.id === formatId);
}

// Get section guidance
export function getSectionGuidance(formatId: string, sectionType: string): string {
  const format = getFormat(formatId);
  const section = format?.sections.find(s => s.type === sectionType);
  return section?.guidancePrompt || '';
}
