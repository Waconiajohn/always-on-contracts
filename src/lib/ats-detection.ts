/**
 * ATS Detection and Optimization Tips
 * Based on reverse-engineering common ATS patterns (inspired by Jobscan's approach)
 */

export type ATSSystem =
  | 'workday'
  | 'greenhouse'
  | 'lever'
  | 'icims'
  | 'taleo'
  | 'successfactors'
  | 'smartrecruiters'
  | 'jobvite'
  | 'bamboohr'
  | 'unknown';

interface ATSDetectionResult {
  system: ATSSystem;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

interface ATSTips {
  name: string;
  description: string;
  tips: string[];
  formatAdvice: string[];
  keywordAdvice: string;
  avoidList: string[];
}

// Detection patterns for common ATS systems
const ATS_PATTERNS: Record<ATSSystem, { urlPatterns: RegExp[]; textPatterns: RegExp[] }> = {
  workday: {
    urlPatterns: [/myworkdayjobs\.com/i, /workday\.com/i, /wd\d+\.myworkdayjobs/i],
    textPatterns: [/workday/i, /apply via workday/i],
  },
  greenhouse: {
    urlPatterns: [/greenhouse\.io/i, /boards\.greenhouse/i, /grnh\.se/i],
    textPatterns: [/greenhouse/i, /powered by greenhouse/i],
  },
  lever: {
    urlPatterns: [/lever\.co/i, /jobs\.lever\.co/i],
    textPatterns: [/lever/i, /powered by lever/i],
  },
  icims: {
    urlPatterns: [/icims\.com/i, /careers-.*\.icims/i],
    textPatterns: [/icims/i, /powered by icims/i],
  },
  taleo: {
    urlPatterns: [/taleo\.net/i, /jobs\.taleo/i],
    textPatterns: [/taleo/i, /oracle taleo/i],
  },
  successfactors: {
    urlPatterns: [/successfactors\.com/i, /jobs\.sap\.com/i],
    textPatterns: [/successfactors/i, /sap successfactors/i],
  },
  smartrecruiters: {
    urlPatterns: [/smartrecruiters\.com/i, /jobs\.smartrecruiters/i],
    textPatterns: [/smartrecruiters/i, /powered by smartrecruiters/i],
  },
  jobvite: {
    urlPatterns: [/jobvite\.com/i, /jobs\.jobvite/i],
    textPatterns: [/jobvite/i, /powered by jobvite/i],
  },
  bamboohr: {
    urlPatterns: [/bamboohr\.com/i, /.*\.bamboohr\.com\/jobs/i],
    textPatterns: [/bamboohr/i, /powered by bamboohr/i],
  },
  unknown: {
    urlPatterns: [],
    textPatterns: [],
  },
};

// ATS-specific optimization tips
const ATS_TIPS: Record<ATSSystem, ATSTips> = {
  workday: {
    name: 'Workday',
    description: 'Used by Fortune 500 companies. Very strict parsing.',
    tips: [
      'Use exact job title match in your resume header',
      'Include skills in a dedicated "Skills" section - Workday extracts these',
      'Use standard date formats (MM/YYYY or Month YYYY)',
      'Keep formatting minimal - Workday strips complex formatting',
    ],
    formatAdvice: [
      'Use .docx format (preferred over PDF)',
      'Avoid tables, columns, and text boxes',
      'Use standard fonts: Arial, Calibri, Times New Roman',
    ],
    keywordAdvice: 'Workday heavily weights exact keyword matches. Include both spelled-out terms and acronyms (e.g., "Project Management Professional (PMP)").',
    avoidList: ['Headers/footers', 'Images or logos', 'Special characters', 'Columns or tables'],
  },
  greenhouse: {
    name: 'Greenhouse',
    description: 'Popular with tech companies. Good at parsing modern formats.',
    tips: [
      'Greenhouse handles PDFs well - either format works',
      'Include GitHub/portfolio links - Greenhouse displays these prominently',
      'Skills can be inline or in dedicated section',
      'Modern formatting is acceptable',
    ],
    formatAdvice: [
      'PDF or DOCX both work well',
      'Simple two-column layouts are acceptable',
      'Hyperlinks are preserved and clickable',
    ],
    keywordAdvice: 'Greenhouse uses semantic matching. Variations of keywords are recognized, but exact matches still help with filtering.',
    avoidList: ['Overly complex graphics', 'Embedded images with text'],
  },
  lever: {
    name: 'Lever',
    description: 'Startup-friendly ATS. Clean interface, good parsing.',
    tips: [
      'Lever parses well - focus on content quality',
      'Include social links (LinkedIn, GitHub)',
      'Bullet points are preferred for experience',
      'Quantified achievements stand out',
    ],
    formatAdvice: [
      'PDF recommended for consistent display',
      'Standard formatting works best',
      'Keep to 1-2 pages',
    ],
    keywordAdvice: 'Lever uses AI-assisted matching. Focus on demonstrating impact rather than keyword stuffing.',
    avoidList: ['Excessive formatting', 'Non-standard section headers'],
  },
  icims: {
    name: 'iCIMS',
    description: 'Enterprise ATS. Strict keyword matching.',
    tips: [
      'Mirror exact phrases from job description',
      'Use standard section headers (Experience, Education, Skills)',
      'Include job title keywords in experience bullets',
      'List certifications prominently',
    ],
    formatAdvice: [
      'Plain .docx format strongly preferred',
      'Avoid PDF if possible',
      'Single column layout only',
    ],
    keywordAdvice: 'iCIMS relies heavily on exact keyword matching. Use the exact terminology from the job posting.',
    avoidList: ['PDF format', 'Any graphics', 'Non-standard sections', 'Creative formatting'],
  },
  taleo: {
    name: 'Oracle Taleo',
    description: 'Legacy enterprise ATS. Very strict parsing rules.',
    tips: [
      'Use extremely simple formatting',
      'Standard reverse-chronological order required',
      'Include full company names (not abbreviations)',
      'Spell out all acronyms at least once',
    ],
    formatAdvice: [
      'Plain text or simple .docx only',
      'Avoid PDFs entirely',
      'No bullets - use dashes or plain text',
    ],
    keywordAdvice: 'Taleo uses basic keyword matching. Exact matches are critical. Include all variations.',
    avoidList: ['PDFs', 'Any formatting beyond bold/italic', 'Tables', 'Special characters', 'Bullets'],
  },
  successfactors: {
    name: 'SAP SuccessFactors',
    description: 'Enterprise HR system. Moderate parsing capability.',
    tips: [
      'Use clear section demarcation',
      'Include full dates for all positions',
      'List skills in a dedicated section',
      'Use standard job titles when possible',
    ],
    formatAdvice: [
      '.docx preferred',
      'Simple formatting only',
      'Clear section breaks',
    ],
    keywordAdvice: 'SuccessFactors matches on skills and job titles. Include industry-standard terminology.',
    avoidList: ['Complex layouts', 'Embedded objects', 'Non-standard fonts'],
  },
  smartrecruiters: {
    name: 'SmartRecruiters',
    description: 'Modern cloud ATS. Good AI-powered parsing.',
    tips: [
      'Focus on achievement statements',
      'Include relevant metrics and outcomes',
      'Skills matching is AI-powered',
      'LinkedIn integration - keep profiles consistent',
    ],
    formatAdvice: [
      'PDF or DOCX both work',
      'Modern formatting acceptable',
      'Links are clickable',
    ],
    keywordAdvice: 'SmartRecruiters uses AI matching. Focus on demonstrated competencies over keyword density.',
    avoidList: ['Inconsistent information across platforms'],
  },
  jobvite: {
    name: 'Jobvite',
    description: 'Recruiting-focused ATS. Good social integration.',
    tips: [
      'Social profiles matter - Jobvite checks them',
      'Employee referrals carry weight',
      'Clean, professional formatting works',
      'Include relevant portfolio links',
    ],
    formatAdvice: [
      'PDF recommended',
      'Professional formatting accepted',
      'Include contact info prominently',
    ],
    keywordAdvice: 'Jobvite balances keywords with candidate experience. Quality content matters.',
    avoidList: ['Overly casual tone', 'Inconsistent social profiles'],
  },
  bamboohr: {
    name: 'BambooHR',
    description: 'SMB-focused HR system. Basic ATS functionality.',
    tips: [
      'Simple formatting works best',
      'Focus on relevant experience',
      'Skills section is important',
      'Clear contact information required',
    ],
    formatAdvice: [
      '.docx or PDF both acceptable',
      'Keep formatting simple',
      'Standard 1-2 pages',
    ],
    keywordAdvice: 'BambooHR uses basic matching. Include relevant keywords but prioritize readability.',
    avoidList: ['Overly complex formatting'],
  },
  unknown: {
    name: 'Unknown ATS',
    description: 'Could not detect specific ATS. Using safe defaults.',
    tips: [
      'Use ATS-safe formatting (simple, clean)',
      'Include exact keywords from job description',
      'Standard section headers (Experience, Education, Skills)',
      'Quantify achievements where possible',
    ],
    formatAdvice: [
      'Use .docx format for maximum compatibility',
      'Avoid tables, columns, graphics',
      'Use standard fonts (Arial, Calibri)',
      'Single column layout',
    ],
    keywordAdvice: 'When ATS is unknown, prioritize exact keyword matches and simple formatting for maximum compatibility.',
    avoidList: ['Headers/footers', 'Tables', 'Images', 'Columns', 'Text boxes', 'Special characters'],
  },
};

/**
 * Detect which ATS a job posting likely uses
 */
export function detectATS(jobUrl?: string, jobText?: string): ATSDetectionResult {
  const indicators: string[] = [];

  // Check URL patterns
  if (jobUrl) {
    for (const [system, patterns] of Object.entries(ATS_PATTERNS)) {
      if (system === 'unknown') continue;

      for (const pattern of patterns.urlPatterns) {
        if (pattern.test(jobUrl)) {
          indicators.push(`URL matches ${system} pattern`);
          return {
            system: system as ATSSystem,
            confidence: 'high',
            indicators,
          };
        }
      }
    }
  }

  // Check text patterns
  if (jobText) {
    for (const [system, patterns] of Object.entries(ATS_PATTERNS)) {
      if (system === 'unknown') continue;

      for (const pattern of patterns.textPatterns) {
        if (pattern.test(jobText)) {
          indicators.push(`Job posting mentions ${system}`);
          return {
            system: system as ATSSystem,
            confidence: 'medium',
            indicators,
          };
        }
      }
    }
  }

  // Default to unknown
  return {
    system: 'unknown',
    confidence: 'low',
    indicators: ['No ATS indicators found - using safe defaults'],
  };
}

/**
 * Get optimization tips for a specific ATS
 */
export function getATSTips(system: ATSSystem): ATSTips {
  return ATS_TIPS[system] || ATS_TIPS.unknown;
}

/**
 * Get all available ATS systems for manual selection
 */
export function getAllATSSystems(): { id: ATSSystem; name: string }[] {
  return [
    { id: 'workday', name: 'Workday' },
    { id: 'greenhouse', name: 'Greenhouse' },
    { id: 'lever', name: 'Lever' },
    { id: 'icims', name: 'iCIMS' },
    { id: 'taleo', name: 'Oracle Taleo' },
    { id: 'successfactors', name: 'SAP SuccessFactors' },
    { id: 'smartrecruiters', name: 'SmartRecruiters' },
    { id: 'jobvite', name: 'Jobvite' },
    { id: 'bamboohr', name: 'BambooHR' },
    { id: 'unknown', name: 'Unknown / Other' },
  ];
}
