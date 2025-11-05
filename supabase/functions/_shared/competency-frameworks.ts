/**
 * Industry-Standard Competency Frameworks
 * Based on SPE, PMI, SHL Universal Competency Framework
 */

export interface CompetencyFramework {
  role: string;
  industry: string;
  aliases: string[]; // Alternative job titles
  technicalCompetencies: TechnicalCompetency[];
  managementBenchmarks: ManagementBenchmark[];
  educationRequirements: EducationRequirement[];
  certifications: CertificationRequirement[];
  experienceLevel: {
    minYears: number;
    maxYears: number;
    typical: number;
  };
}

export interface TechnicalCompetency {
  name: string;
  requiredLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  keywords: string[]; // Keywords to look for in resume
}

export interface ManagementBenchmark {
  aspect: string;
  minValue: number;
  maxValue: number;
  typicalValue: number;
  unit: string;
  keywords: string[];
}

export interface EducationRequirement {
  level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';
  fields: string[];
  required: boolean;
}

export interface CertificationRequirement {
  name: string;
  required: boolean;
  alternatives: string[];
}

/**
 * Competency Frameworks Database
 */
export const COMPETENCY_FRAMEWORKS: CompetencyFramework[] = [
  // Oil & Gas - Drilling Engineering
  {
    role: 'Drilling Engineering Supervisor',
    industry: 'Oil & Gas',
    aliases: [
      'Drilling Supervisor',
      'Drilling Engineer',
      'Well Engineering Supervisor',
      'Drilling Operations Manager',
      'Senior Drilling Engineer'
    ],
    technicalCompetencies: [
      {
        name: 'Well Control',
        requiredLevel: 'advanced',
        category: 'Technical',
        keywords: ['well control', 'blowout prevention', 'kick detection', 'well integrity']
      },
      {
        name: 'AFE Generation',
        requiredLevel: 'expert',
        category: 'Financial',
        keywords: ['AFE', 'authorization for expenditure', 'cost estimation', 'budget']
      },
      {
        name: 'HSE Compliance',
        requiredLevel: 'advanced',
        category: 'Safety',
        keywords: ['HSE', 'safety', 'compliance', 'regulations', 'OSHA', 'incident prevention']
      },
      {
        name: 'Drilling Operations',
        requiredLevel: 'expert',
        category: 'Technical',
        keywords: ['drilling', 'rig operations', 'mud engineering', 'casing', 'completion']
      },
      {
        name: 'Contract Management',
        requiredLevel: 'advanced',
        category: 'Business',
        keywords: ['contract', 'vendor management', 'procurement', 'RFP']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 3,
        maxValue: 12,
        typicalValue: 6,
        unit: 'people',
        keywords: ['team', 'supervised', 'managed', 'led', 'direct reports', 'crew']
      },
      {
        aspect: 'Budget Responsibility',
        minValue: 50000000,
        maxValue: 500000000,
        typicalValue: 200000000,
        unit: 'USD',
        keywords: ['budget', 'AFE', 'cost', 'expenditure', '$', 'MM', 'million']
      },
      {
        aspect: 'Wells Managed',
        minValue: 5,
        maxValue: 50,
        typicalValue: 20,
        unit: 'wells',
        keywords: ['wells', 'projects', 'drilling programs']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['Petroleum Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Civil Engineering'],
        required: true
      }
    ],
    certifications: [
      {
        name: 'SPE Membership',
        required: false,
        alternatives: ['Society of Petroleum Engineers', 'IADC']
      },
      {
        name: 'Well Control Certification',
        required: true,
        alternatives: ['IWCF', 'IADC Well Control']
      }
    ],
    experienceLevel: {
      minYears: 8,
      maxYears: 20,
      typical: 12
    }
  },

  // Project Management
  {
    role: 'Project Manager',
    industry: 'General',
    aliases: [
      'Program Manager',
      'Project Lead',
      'PMO Manager',
      'Delivery Manager'
    ],
    technicalCompetencies: [
      {
        name: 'Project Planning',
        requiredLevel: 'expert',
        category: 'Project Management',
        keywords: ['project plan', 'scheduling', 'timeline', 'milestones', 'Gantt chart']
      },
      {
        name: 'Stakeholder Management',
        requiredLevel: 'advanced',
        category: 'Communication',
        keywords: ['stakeholder', 'communication', 'executive reporting', 'client relations']
      },
      {
        name: 'Risk Management',
        requiredLevel: 'advanced',
        category: 'Risk',
        keywords: ['risk', 'mitigation', 'contingency', 'issue management']
      },
      {
        name: 'Agile/Waterfall',
        requiredLevel: 'intermediate',
        category: 'Methodology',
        keywords: ['agile', 'scrum', 'waterfall', 'sprint', 'kanban']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 5,
        maxValue: 50,
        typicalValue: 15,
        unit: 'people',
        keywords: ['team', 'managed', 'led', 'cross-functional']
      },
      {
        aspect: 'Budget Responsibility',
        minValue: 1000000,
        maxValue: 50000000,
        typicalValue: 10000000,
        unit: 'USD',
        keywords: ['budget', 'cost', 'P&L', 'financial']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['Business', 'Engineering', 'Computer Science', 'Management'],
        required: false
      }
    ],
    certifications: [
      {
        name: 'PMP',
        required: false,
        alternatives: ['Project Management Professional', 'PRINCE2', 'CSM']
      }
    ],
    experienceLevel: {
      minYears: 5,
      maxYears: 15,
      typical: 8
    }
  },

  // Software Engineering
  {
    role: 'Senior Software Engineer',
    industry: 'Technology',
    aliases: [
      'Software Engineer',
      'Staff Engineer',
      'Principal Engineer',
      'Lead Developer'
    ],
    technicalCompetencies: [
      {
        name: 'Programming Languages',
        requiredLevel: 'expert',
        category: 'Technical',
        keywords: ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'Go', 'Rust']
      },
      {
        name: 'System Design',
        requiredLevel: 'advanced',
        category: 'Architecture',
        keywords: ['architecture', 'design patterns', 'scalability', 'microservices']
      },
      {
        name: 'Cloud Platforms',
        requiredLevel: 'advanced',
        category: 'Infrastructure',
        keywords: ['AWS', 'Azure', 'GCP', 'cloud', 'DevOps']
      },
      {
        name: 'Databases',
        requiredLevel: 'advanced',
        category: 'Data',
        keywords: ['SQL', 'NoSQL', 'PostgreSQL', 'MongoDB', 'Redis']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 0,
        maxValue: 8,
        typicalValue: 3,
        unit: 'people',
        keywords: ['mentored', 'led', 'team lead', 'tech lead']
      },
      {
        aspect: 'Users Impacted',
        minValue: 10000,
        maxValue: 10000000,
        typicalValue: 500000,
        unit: 'users',
        keywords: ['users', 'customers', 'scale', 'traffic']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['Computer Science', 'Software Engineering', 'Computer Engineering'],
        required: false
      }
    ],
    certifications: [
      {
        name: 'AWS Certification',
        required: false,
        alternatives: ['AWS Solutions Architect', 'AWS Developer', 'GCP Professional']
      }
    ],
    experienceLevel: {
      minYears: 5,
      maxYears: 15,
      typical: 8
    }
  },

  // Marketing Manager
  {
    role: 'Marketing Manager',
    industry: 'Marketing',
    aliases: [
      'Marketing Director',
      'Head of Marketing',
      'Senior Marketing Manager',
      'Brand Manager'
    ],
    technicalCompetencies: [
      {
        name: 'Digital Marketing',
        requiredLevel: 'expert',
        category: 'Marketing',
        keywords: ['SEO', 'SEM', 'social media', 'content marketing', 'email marketing']
      },
      {
        name: 'Analytics',
        requiredLevel: 'advanced',
        category: 'Data',
        keywords: ['Google Analytics', 'data analysis', 'KPIs', 'ROI', 'metrics']
      },
      {
        name: 'Campaign Management',
        requiredLevel: 'expert',
        category: 'Strategy',
        keywords: ['campaign', 'launch', 'strategy', 'execution', 'multi-channel']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 3,
        maxValue: 15,
        typicalValue: 6,
        unit: 'people',
        keywords: ['team', 'managed', 'led']
      },
      {
        aspect: 'Budget Responsibility',
        minValue: 500000,
        maxValue: 10000000,
        typicalValue: 2000000,
        unit: 'USD',
        keywords: ['budget', 'marketing spend', 'ad spend']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['Marketing', 'Business', 'Communications'],
        required: false
      }
    ],
    certifications: [
      {
        name: 'Google Analytics',
        required: false,
        alternatives: ['Google Ads', 'HubSpot', 'Facebook Blueprint']
      }
    ],
    experienceLevel: {
      minYears: 5,
      maxYears: 12,
      typical: 7
    }
  }
];

/**
 * Find competency framework by role/industry
 */
export function findCompetencyFramework(
  jobTitle: string,
  industry?: string
): CompetencyFramework | null {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  
  for (const framework of COMPETENCY_FRAMEWORKS) {
    // Check exact match
    if (framework.role.toLowerCase() === normalizedTitle) {
      return framework;
    }
    
    // Check aliases
    if (framework.aliases.some(alias => alias.toLowerCase() === normalizedTitle)) {
      return framework;
    }
    
    // Check partial match (if industry matches)
    if (industry && framework.industry.toLowerCase() === industry.toLowerCase()) {
      if (framework.aliases.some(alias => normalizedTitle.includes(alias.toLowerCase()))) {
        return framework;
      }
    }
  }
  
  return null;
}

/**
 * Get default framework for unknown roles
 */
export function getDefaultFramework(): CompetencyFramework {
  return {
    role: 'General Professional',
    industry: 'General',
    aliases: [],
    technicalCompetencies: [
      {
        name: 'Technical Skills',
        requiredLevel: 'intermediate',
        category: 'Technical',
        keywords: ['technical', 'software', 'tools', 'systems']
      },
      {
        name: 'Communication',
        requiredLevel: 'advanced',
        category: 'Soft Skills',
        keywords: ['communication', 'presentation', 'writing']
      }
    ],
    managementBenchmarks: [
      {
        aspect: 'Team Size',
        minValue: 0,
        maxValue: 10,
        typicalValue: 3,
        unit: 'people',
        keywords: ['team', 'managed', 'led']
      }
    ],
    educationRequirements: [
      {
        level: 'bachelor',
        fields: ['Any'],
        required: false
      }
    ],
    certifications: [],
    experienceLevel: {
      minYears: 0,
      maxYears: 20,
      typical: 5
    }
  };
}
