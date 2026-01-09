/**
 * Executive Role Success Rubrics
 * Defines what "best-in-class" looks like for senior roles
 * Used to ground AI analysis in real-world hiring expectations
 */

// ============= Rubric Types =============

export interface ExecutiveRubric {
  roleArchetype: string;
  industryContext: string;
  aliases: string[];
  seniorityLevel: 'VP' | 'Director' | 'Senior Manager' | 'C-Suite';
  
  // What success looks like
  coreOutcomes: string[];
  
  // Competencies with proof examples
  topCompetencies: CompetencyDefinition[];
  
  // What benchmark candidates have achieved
  benchmarkProofPoints: string[];
  
  // Metrics norms for this level
  metricsNorms: MetricNorm[];
  
  // Common mistakes candidates make
  commonPitfalls: string[];
  
  // What HMs look for (signals)
  executiveSignals: string[];
  
  // Anti-patterns to avoid in claims
  antiPatterns: string[];
}

export interface CompetencyDefinition {
  id: string;
  name: string;
  definition: string;
  proofExamples: string[];  // What evidence looks like
  antiPatterns: string[];   // What NOT to claim
}

export interface MetricNorm {
  metric: string;
  typicalRange: string;
  unit: string;
  sources: string[];
  riskIfMissing: 'high' | 'medium' | 'low';
}

export interface BenchmarkResumePattern {
  targetTitleRules: string[];
  sectionOrder: string[];
  signatureWinsPattern: {
    description: string;
    bulletFormula: string;
    examples: string[];
  };
  summaryPattern: {
    description: string;
    requiredElements: string[];
  };
  bulletFormula: string;
  orderingRules: string[];
  executive50PlusRules: string[];
}

// ============= Executive Rubric Library =============

export const EXECUTIVE_RUBRICS: ExecutiveRubric[] = [
  // Customer Success Leader
  {
    roleArchetype: 'Customer Success Leader',
    industryContext: 'SaaS / Technology',
    aliases: [
      'VP of Customer Success', 'Director of Customer Success', 'Head of Customer Success',
      'Chief Customer Officer', 'VP Client Success', 'Director Client Success',
      'SVP Customer Success', 'VP Customer Experience', 'Director CS Operations'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Net Revenue Retention (NRR) above 100%',
      'Gross retention above industry benchmark',
      'Reduced churn and improved customer health scores',
      'Expansion revenue through upsells and cross-sells',
      'Scaled onboarding and adoption programs'
    ],
    topCompetencies: [
      {
        id: 'cs-retention',
        name: 'Retention Strategy',
        definition: 'Ability to build systems and processes that maximize customer retention and minimize churn',
        proofExamples: [
          'Built health scoring system that predicted churn with 85% accuracy',
          'Reduced churn from 15% to 8% annually through early intervention program',
          'Implemented QBR cadence that increased retention by 12 points'
        ],
        antiPatterns: [
          'Claiming retention improvements without baseline metrics',
          'Taking credit for market-driven retention',
          'Vague claims like "improved customer satisfaction"'
        ]
      },
      {
        id: 'cs-expansion',
        name: 'Revenue Expansion',
        definition: 'Driving growth through existing customer base via upsells, cross-sells, and advocacy',
        proofExamples: [
          'Grew NRR from 105% to 125% through structured expansion playbook',
          'Generated $5M in expansion revenue through CSM-led upsell motion',
          'Built advocacy program producing 40% of new pipeline'
        ],
        antiPatterns: [
          'Conflating CS-driven expansion with Sales-driven deals',
          'Claiming expansion without showing CS contribution'
        ]
      },
      {
        id: 'cs-scale',
        name: 'Operational Scalability',
        definition: 'Building repeatable processes and tech stack to serve growing customer base efficiently',
        proofExamples: [
          'Scaled team from 5 to 35 CSMs while maintaining 150:1 customer ratio',
          'Implemented Gainsight reducing manual work by 60%',
          'Built tiered service model supporting 3x customer growth with 1.5x headcount'
        ],
        antiPatterns: [
          'Claiming scale without ratio or efficiency metrics',
          'Technology implementation without business outcome'
        ]
      },
      {
        id: 'cs-team-leadership',
        name: 'Team Leadership',
        definition: 'Building, developing, and retaining high-performing CS teams',
        proofExamples: [
          'Built CS org from 0 to 25 across 3 regions',
          'Maintained 90% team retention in competitive market',
          'Promoted 5 individual contributors to management roles'
        ],
        antiPatterns: [
          'Claiming team size without context of scope',
          'Leadership claims without retention or development evidence'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Achieved NRR of 115%+ consistently',
      'Built and scaled CS function from early stage to enterprise',
      'Implemented customer health scoring with predictive accuracy',
      'Created playbooks adopted across global teams',
      'Established executive sponsor program with C-suite engagement'
    ],
    metricsNorms: [
      { metric: 'NRR', typicalRange: '100-130%', unit: 'percentage', sources: ['renewal data', 'expansion tracking'], riskIfMissing: 'high' },
      { metric: 'Gross Retention', typicalRange: '85-95%', unit: 'percentage', sources: ['churn analysis'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '10-50', unit: 'CSMs', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'ARR Managed', typicalRange: '$20M-$200M', unit: 'USD', sources: ['customer portfolio'], riskIfMissing: 'medium' },
      { metric: 'Customer Count', typicalRange: '100-2000', unit: 'logos', sources: ['CRM'], riskIfMissing: 'low' }
    ],
    commonPitfalls: [
      'Focusing on activity metrics vs. outcomes',
      'Not showing progression in scope/scale',
      'Missing the retention-to-expansion connection',
      'Generic claims without company/context specifics',
      'Overemphasizing tech stack vs. business impact'
    ],
    executiveSignals: [
      'Board-level reporting experience',
      'Cross-functional collaboration with Sales, Product, Support',
      'Data-driven decision making',
      'Customer segmentation strategy',
      'International/global team experience'
    ],
    antiPatterns: [
      'Claiming CS outcomes that were clearly Sales-driven',
      'Inventing metrics not present in resume',
      'Claiming team sizes without evidence',
      'Using buzzwords without substance (e.g., "customer-centric culture")'
    ]
  },

  // Program/Transformation Leader
  {
    roleArchetype: 'Program/Transformation Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'VP Transformation', 'Director of Strategic Programs', 'Head of PMO',
      'Chief Transformation Officer', 'VP Enterprise Programs', 'Director Change Management',
      'SVP Operations Excellence', 'VP Process Improvement', 'Director Digital Transformation'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Successful delivery of multi-million dollar transformation programs',
      'Measurable operational efficiency improvements',
      'Organizational change adoption at scale',
      'Risk mitigation and stakeholder alignment',
      'Sustainable process improvements'
    ],
    topCompetencies: [
      {
        id: 'prog-delivery',
        name: 'Program Delivery Excellence',
        definition: 'Delivering complex, cross-functional programs on time, on budget, with expected outcomes',
        proofExamples: [
          'Delivered $50M ERP implementation 2 months ahead of schedule',
          'Led 18-month digital transformation with 95% milestone achievement',
          'Managed portfolio of 12 concurrent programs totaling $100M investment'
        ],
        antiPatterns: [
          'Claiming delivery without budget/timeline context',
          'Program involvement without ownership clarity'
        ]
      },
      {
        id: 'prog-change',
        name: 'Change Management',
        definition: 'Driving organizational adoption of new processes, systems, and ways of working',
        proofExamples: [
          'Achieved 85% adoption rate within 3 months of system launch',
          'Trained 2,000 employees across 5 regions on new workflows',
          'Reduced change resistance through stakeholder engagement program'
        ],
        antiPatterns: [
          'Claiming change management without adoption metrics',
          'Training delivery without behavior change evidence'
        ]
      },
      {
        id: 'prog-stakeholder',
        name: 'Executive Stakeholder Management',
        definition: 'Aligning and managing expectations across C-suite and senior leadership',
        proofExamples: [
          'Presented monthly to CEO and Board on transformation progress',
          'Secured $20M additional funding through executive business case',
          'Resolved cross-functional conflicts between 4 VP-level stakeholders'
        ],
        antiPatterns: [
          'Vague stakeholder claims without specific outcomes',
          'Claiming executive access without decision influence'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Led enterprise-wide transformation affecting 5,000+ employees',
      'Achieved ROI of 200%+ on transformation investment',
      'Built PMO from scratch with governance framework',
      'Delivered multi-year program with sustained benefits realization',
      'Integrated M&A targets successfully'
    ],
    metricsNorms: [
      { metric: 'Program Budget', typicalRange: '$10M-$100M', unit: 'USD', sources: ['program charter'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '20-100', unit: 'people', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Employees Impacted', typicalRange: '500-10,000', unit: 'people', sources: ['change scope'], riskIfMissing: 'medium' },
      { metric: 'Efficiency Gain', typicalRange: '15-40%', unit: 'percentage', sources: ['benefits tracking'], riskIfMissing: 'high' }
    ],
    commonPitfalls: [
      'Listing programs without outcomes',
      'Methodology focus over business results',
      'Missing the "why it mattered" context',
      'Not showing progression to larger programs'
    ],
    executiveSignals: [
      'Board-level transformation experience',
      'P&L responsibility',
      'Cross-functional authority',
      'External consultant/vendor management',
      'M&A integration experience'
    ],
    antiPatterns: [
      'Claiming program ownership when contributor',
      'Inventing efficiency percentages',
      'Inflating program budgets'
    ]
  },

  // IT/Technology Leader
  {
    roleArchetype: 'IT/Technology Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'CIO', 'CTO', 'VP of IT', 'Director of IT', 'VP Engineering',
      'Head of Technology', 'VP Infrastructure', 'Director of Technology',
      'Chief Digital Officer', 'VP IT Operations', 'Director Enterprise Architecture'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Technology strategy aligned with business objectives',
      'System reliability and uptime at enterprise scale',
      'Cost optimization while maintaining capability',
      'Security and compliance management',
      'Digital transformation enablement'
    ],
    topCompetencies: [
      {
        id: 'it-strategy',
        name: 'Technology Strategy',
        definition: 'Developing and executing technology roadmaps that enable business growth',
        proofExamples: [
          'Developed 5-year technology roadmap reducing TCO by $15M',
          'Led cloud migration reducing infrastructure costs by 40%',
          'Built API strategy enabling $20M in new revenue streams'
        ],
        antiPatterns: [
          'Strategy claims without execution evidence',
          'Technology modernization without business outcome'
        ]
      },
      {
        id: 'it-ops',
        name: 'IT Operations Excellence',
        definition: 'Maintaining reliable, secure, and efficient technology operations',
        proofExamples: [
          'Achieved 99.99% uptime for critical business systems',
          'Reduced incident resolution time by 65%',
          'Implemented ITIL practices reducing tickets by 30%'
        ],
        antiPatterns: [
          'Uptime claims without SLA context',
          'Efficiency gains without baseline'
        ]
      },
      {
        id: 'it-security',
        name: 'Security & Compliance',
        definition: 'Protecting enterprise assets and maintaining regulatory compliance',
        proofExamples: [
          'Achieved SOC 2 Type II certification in 6 months',
          'Zero security breaches over 3-year tenure',
          'Implemented Zero Trust architecture across 5,000 endpoints'
        ],
        antiPatterns: [
          'Security claims without audit/certification evidence',
          'Compliance without scope context'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Led enterprise cloud transformation (AWS/Azure/GCP)',
      'Managed IT budget of $20M+ with demonstrated optimization',
      'Built and scaled engineering organization globally',
      'Achieved major compliance certifications (SOC 2, ISO 27001, HIPAA)',
      'Delivered digital products generating direct revenue'
    ],
    metricsNorms: [
      { metric: 'IT Budget', typicalRange: '$5M-$100M', unit: 'USD', sources: ['budget docs'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '20-500', unit: 'engineers', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Systems Managed', typicalRange: '50-500', unit: 'applications', sources: ['CMDB'], riskIfMissing: 'low' },
      { metric: 'Uptime', typicalRange: '99.9-99.99%', unit: 'percentage', sources: ['SLA reports'], riskIfMissing: 'medium' }
    ],
    commonPitfalls: [
      'Technology focus without business impact',
      'Project lists without outcomes',
      'Missing security/compliance context',
      'Not showing vendor/budget management'
    ],
    executiveSignals: [
      'Board/C-suite reporting',
      'Vendor negotiation at enterprise scale',
      'M&A technology integration',
      'Regulatory/audit experience',
      'Global team leadership'
    ],
    antiPatterns: [
      'Claiming technology decisions made by others',
      'Inflating team sizes or budgets',
      'Taking credit for vendor-delivered outcomes'
    ]
  },

  // Operations Leader
  {
    roleArchetype: 'Operations Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'COO', 'VP Operations', 'Director of Operations', 'Head of Operations',
      'VP Business Operations', 'Director Strategic Operations', 'Chief Operations Officer',
      'SVP Operations', 'VP Global Operations', 'Director Operational Excellence'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Operational efficiency and cost optimization',
      'Process standardization and scalability',
      'Quality improvement and consistency',
      'Cross-functional operational alignment',
      'Sustainable operational improvements'
    ],
    topCompetencies: [
      {
        id: 'ops-efficiency',
        name: 'Operational Efficiency',
        definition: 'Driving measurable improvements in operational performance and cost',
        proofExamples: [
          'Reduced operational costs by $8M annually through process redesign',
          'Improved throughput by 45% without additional headcount',
          'Implemented lean practices reducing waste by 30%'
        ],
        antiPatterns: [
          'Efficiency claims without baseline metrics',
          'Cost reduction without scope context'
        ]
      },
      {
        id: 'ops-scale',
        name: 'Scalable Operations',
        definition: 'Building operational infrastructure that supports business growth',
        proofExamples: [
          'Scaled operations to support 5x revenue growth',
          'Built shared services center supporting 3 business units',
          'Designed playbooks enabling 50% faster market entry'
        ],
        antiPatterns: [
          'Scale claims without growth context',
          'Process documentation without adoption evidence'
        ]
      },
      {
        id: 'ops-quality',
        name: 'Quality Management',
        definition: 'Ensuring consistent quality and continuous improvement',
        proofExamples: [
          'Reduced defect rate from 5% to 0.5%',
          'Achieved ISO 9001 certification',
          'Implemented Six Sigma program with $3M verified savings'
        ],
        antiPatterns: [
          'Quality claims without measurement',
          'Certification without business impact'
        ]
      }
    ],
    benchmarkProofPoints: [
      'P&L responsibility for operations function',
      'Multi-site or global operations management',
      'Successful operational integration post-M&A',
      'Digital operations transformation',
      'Built operations function from startup to scale'
    ],
    metricsNorms: [
      { metric: 'Cost Savings', typicalRange: '$1M-$20M', unit: 'USD/year', sources: ['finance reports'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '50-500', unit: 'people', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Efficiency Gain', typicalRange: '15-50%', unit: 'percentage', sources: ['ops metrics'], riskIfMissing: 'high' },
      { metric: 'Sites/Locations', typicalRange: '3-50', unit: 'locations', sources: ['org structure'], riskIfMissing: 'low' }
    ],
    commonPitfalls: [
      'Activity focus over outcomes',
      'Missing the business growth connection',
      'Not showing cross-functional impact',
      'Operations maintenance vs. transformation'
    ],
    executiveSignals: [
      'P&L ownership',
      'Board reporting',
      'Union/labor relations (if applicable)',
      'Supply chain oversight',
      'Global/multi-site experience'
    ],
    antiPatterns: [
      'Claiming savings without verification method',
      'Inflating team or site scope',
      'Taking credit for market-driven improvements'
    ]
  },

  // Product Leader
  {
    roleArchetype: 'Product Leader',
    industryContext: 'Technology / SaaS',
    aliases: [
      'VP Product', 'CPO', 'Director of Product', 'Head of Product',
      'Chief Product Officer', 'VP Product Management', 'Director Product Strategy',
      'SVP Product', 'VP Product & Design', 'Director Digital Product'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Product-market fit and revenue growth',
      'Product strategy aligned with business objectives',
      'Successful product launches and adoption',
      'Team building and product culture',
      'Customer-centric product development'
    ],
    topCompetencies: [
      {
        id: 'prod-strategy',
        name: 'Product Strategy',
        definition: 'Defining and executing product vision that drives business growth',
        proofExamples: [
          'Developed product strategy that grew ARR from $10M to $50M',
          'Identified and captured new market segment worth $15M',
          'Pivoted product direction avoiding $5M in failed investment'
        ],
        antiPatterns: [
          'Strategy claims without execution evidence',
          'Vision without metrics or adoption'
        ]
      },
      {
        id: 'prod-execution',
        name: 'Product Execution',
        definition: 'Delivering products on time with high quality and customer adoption',
        proofExamples: [
          'Launched 12 major features with 80%+ adoption rate',
          'Reduced time-to-market by 40% through agile transformation',
          'Achieved NPS of 65+ through product improvements'
        ],
        antiPatterns: [
          'Feature delivery without adoption metrics',
          'Launch claims without customer impact'
        ]
      },
      {
        id: 'prod-team',
        name: 'Product Team Leadership',
        definition: 'Building and scaling high-performing product organizations',
        proofExamples: [
          'Built product org from 3 to 25 across PM, Design, Research',
          'Established product-led growth culture',
          'Mentored 5 PMs promoted to senior roles'
        ],
        antiPatterns: [
          'Team size claims without context',
          'Leadership claims without development evidence'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Led product for $50M+ ARR product line',
      'Built product organization from scratch',
      'Drove successful product-led growth motion',
      'Managed product through major pivot or transformation',
      'Established product discovery and experimentation practices'
    ],
    metricsNorms: [
      { metric: 'ARR Influenced', typicalRange: '$10M-$100M', unit: 'USD', sources: ['product revenue'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '10-50', unit: 'PMs', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Feature Adoption', typicalRange: '60-90%', unit: 'percentage', sources: ['analytics'], riskIfMissing: 'medium' },
      { metric: 'NPS/CSAT', typicalRange: '40-70', unit: 'score', sources: ['surveys'], riskIfMissing: 'low' }
    ],
    commonPitfalls: [
      'Feature lists without customer impact',
      'Strategy without execution evidence',
      'Missing the revenue connection',
      'Not showing cross-functional collaboration'
    ],
    executiveSignals: [
      'Board-level product presentations',
      'Customer advisory board leadership',
      'Investor/analyst communications',
      'Partnership/platform strategy',
      'International product expansion'
    ],
    antiPatterns: [
      'Claiming revenue without product contribution clarity',
      'Inflating influence on features built by engineering',
      'Taking credit for market-driven growth'
    ]
  },

  // Sales Leader
  {
    roleArchetype: 'Sales Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'VP Sales', 'CRO', 'Director of Sales', 'Head of Sales',
      'Chief Revenue Officer', 'SVP Sales', 'VP Global Sales',
      'VP Enterprise Sales', 'Director Business Development', 'VP Commercial'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Revenue target achievement and growth',
      'Sales team performance and retention',
      'Pipeline generation and conversion',
      'Customer acquisition cost optimization',
      'Market expansion'
    ],
    topCompetencies: [
      {
        id: 'sales-growth',
        name: 'Revenue Growth',
        definition: 'Consistently achieving and exceeding revenue targets',
        proofExamples: [
          'Grew territory revenue from $20M to $75M in 3 years',
          'Exceeded quota for 12 consecutive quarters',
          'Expanded into new market generating $10M in first year'
        ],
        antiPatterns: [
          'Revenue claims without baseline or timeline',
          'Growth without market context'
        ]
      },
      {
        id: 'sales-team',
        name: 'Sales Team Building',
        definition: 'Recruiting, developing, and retaining high-performing sales teams',
        proofExamples: [
          'Built sales org from 5 to 45 reps across 3 regions',
          'Maintained 85% rep retention vs. industry 65%',
          'Developed 8 reps promoted to management'
        ],
        antiPatterns: [
          'Team size without performance context',
          'Hiring claims without quota attainment'
        ]
      },
      {
        id: 'sales-process',
        name: 'Sales Process Excellence',
        definition: 'Building repeatable, scalable sales processes and systems',
        proofExamples: [
          'Implemented MEDDIC increasing win rate by 25%',
          'Reduced sales cycle from 90 to 60 days',
          'Built SDR program generating 40% of pipeline'
        ],
        antiPatterns: [
          'Process claims without outcome metrics',
          'Methodology adoption without results'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Managed $50M+ annual quota',
      'Built sales organization from startup to scale',
      'Expanded into new markets or verticals',
      'Implemented successful sales methodology',
      'Managed through economic downturn with maintained performance'
    ],
    metricsNorms: [
      { metric: 'Quota Managed', typicalRange: '$20M-$200M', unit: 'USD/year', sources: ['sales reports'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '10-100', unit: 'reps', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Win Rate', typicalRange: '20-40%', unit: 'percentage', sources: ['CRM'], riskIfMissing: 'medium' },
      { metric: 'Growth Rate', typicalRange: '20-100%', unit: 'YoY percentage', sources: ['revenue reports'], riskIfMissing: 'high' }
    ],
    commonPitfalls: [
      'Revenue claims without context (market, team, product)',
      'Missing the how behind the numbers',
      'Not showing progression in scope',
      'Overemphasizing individual vs. team results'
    ],
    executiveSignals: [
      'Board reporting',
      'Quota-carrying at VP level',
      'International expansion',
      'Major account executive relationships',
      'Partnership/channel development'
    ],
    antiPatterns: [
      'Claiming team revenue as personal',
      'Inflating quota or revenue numbers',
      'Taking credit for market tailwinds'
    ]
  },

  // Finance Leader
  {
    roleArchetype: 'Finance Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'CFO', 'VP Finance', 'Director of Finance', 'Controller',
      'Chief Financial Officer', 'VP Financial Planning', 'Director FP&A',
      'VP Corporate Finance', 'Treasurer', 'VP Accounting'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Financial performance and controls',
      'Strategic planning and analysis',
      'Capital allocation and fundraising',
      'Compliance and risk management',
      'Business partnership and decision support'
    ],
    topCompetencies: [
      {
        id: 'fin-strategy',
        name: 'Financial Strategy',
        definition: 'Driving strategic financial planning aligned with business objectives',
        proofExamples: [
          'Led financial modeling for $100M acquisition',
          'Developed capital allocation strategy optimizing ROIC by 15%',
          'Built 5-year financial plan supporting IPO readiness'
        ],
        antiPatterns: [
          'Strategy claims without execution evidence',
          'Planning without business outcome'
        ]
      },
      {
        id: 'fin-ops',
        name: 'Financial Operations',
        definition: 'Managing efficient, accurate, and compliant financial operations',
        proofExamples: [
          'Reduced close cycle from 15 to 5 days',
          'Achieved clean audit for 5 consecutive years',
          'Implemented ERP reducing reporting effort by 60%'
        ],
        antiPatterns: [
          'Operations claims without metrics',
          'System implementation without business impact'
        ]
      },
      {
        id: 'fin-fundraising',
        name: 'Capital & Fundraising',
        definition: 'Securing capital and managing investor relationships',
        proofExamples: [
          'Led Series C raise of $50M at 4x valuation increase',
          'Negotiated $100M credit facility at favorable terms',
          'Managed successful IPO raising $200M'
        ],
        antiPatterns: [
          'Fundraising claims without role clarity',
          'Capital secured without terms context'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Led finance through IPO or major fundraising',
      'Managed finance for $100M+ revenue company',
      'Built FP&A function from scratch',
      'Drove successful M&A integration',
      'Implemented major ERP transformation'
    ],
    metricsNorms: [
      { metric: 'Revenue Scope', typicalRange: '$50M-$500M', unit: 'USD', sources: ['P&L'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '10-100', unit: 'people', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'Capital Raised', typicalRange: '$10M-$200M', unit: 'USD', sources: ['fundraising docs'], riskIfMissing: 'low' }
    ],
    commonPitfalls: [
      'Compliance focus over business partnership',
      'System lists without business impact',
      'Missing the strategic contribution',
      'Not showing investor relations experience'
    ],
    executiveSignals: [
      'Board reporting and management',
      'Investor relations',
      'M&A due diligence',
      'Audit committee interaction',
      'Banking/lending relationships'
    ],
    antiPatterns: [
      'Claiming credit for business results vs. financial support',
      'Inflating scope or budget responsibility',
      'Taking credit for team accomplishments'
    ]
  },

  // HR/People Leader
  {
    roleArchetype: 'HR/People Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'CHRO', 'VP People', 'VP HR', 'Director of HR', 'Head of People',
      'Chief People Officer', 'VP Human Resources', 'Director Talent',
      'VP People Operations', 'Director HR Business Partner'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Talent acquisition and retention',
      'Organizational development and culture',
      'Compensation and benefits optimization',
      'HR operations and compliance',
      'Leadership development'
    ],
    topCompetencies: [
      {
        id: 'hr-talent',
        name: 'Talent Acquisition',
        definition: 'Building effective recruiting programs that attract top talent',
        proofExamples: [
          'Scaled company from 100 to 500 employees in 2 years',
          'Reduced time-to-fill from 60 to 30 days',
          'Built employer brand increasing inbound applications by 200%'
        ],
        antiPatterns: [
          'Hiring numbers without quality context',
          'Recruiting claims without retention data'
        ]
      },
      {
        id: 'hr-retention',
        name: 'Employee Retention',
        definition: 'Creating environment and programs that retain high performers',
        proofExamples: [
          'Improved retention from 75% to 90% annually',
          'Reduced regrettable attrition by 40%',
          'Built engagement program increasing eNPS by 25 points'
        ],
        antiPatterns: [
          'Retention claims without baseline',
          'Engagement scores without business impact'
        ]
      },
      {
        id: 'hr-culture',
        name: 'Culture & OD',
        definition: 'Developing organizational culture and capabilities',
        proofExamples: [
          'Led culture integration post-acquisition of 200 employees',
          'Implemented values framework adopted by 95% of employees',
          'Built leadership development program with 80% promotion rate'
        ],
        antiPatterns: [
          'Culture claims without measurement',
          'Programs without adoption or impact'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Built People function from scratch at scaling company',
      'Led organization through major transformation',
      'Implemented successful DEI program with measurable impact',
      'Managed HR through M&A integration',
      'Built employer brand at category-defining company'
    ],
    metricsNorms: [
      { metric: 'Employee Count', typicalRange: '200-5000', unit: 'people', sources: ['HRIS'], riskIfMissing: 'medium' },
      { metric: 'Retention Rate', typicalRange: '80-95%', unit: 'percentage', sources: ['HR reports'], riskIfMissing: 'high' },
      { metric: 'Hiring Volume', typicalRange: '50-500/year', unit: 'hires', sources: ['recruiting data'], riskIfMissing: 'medium' },
      { metric: 'HR Team Size', typicalRange: '5-50', unit: 'people', sources: ['org chart'], riskIfMissing: 'low' }
    ],
    commonPitfalls: [
      'Program focus over business impact',
      'HR operations vs. strategic partnership',
      'Missing the culture-to-results connection',
      'Not showing scale progression'
    ],
    executiveSignals: [
      'Board/C-suite advisor',
      'M&A human capital due diligence',
      'Executive compensation design',
      'Labor relations (if applicable)',
      'Organizational restructuring'
    ],
    antiPatterns: [
      'Claiming culture changes without evidence',
      'Inflating employee scope',
      'Taking credit for business-driven retention'
    ]
  },

  // Marketing Leader
  {
    roleArchetype: 'Marketing Leader',
    industryContext: 'Cross-Industry',
    aliases: [
      'CMO', 'VP Marketing', 'Director of Marketing', 'Head of Marketing',
      'Chief Marketing Officer', 'VP Growth', 'Director Brand',
      'VP Demand Generation', 'Director Digital Marketing', 'VP Product Marketing'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'Pipeline and revenue contribution',
      'Brand awareness and positioning',
      'Customer acquisition efficiency',
      'Marketing team performance',
      'Market expansion'
    ],
    topCompetencies: [
      {
        id: 'mkt-demand',
        name: 'Demand Generation',
        definition: 'Building scalable programs that generate quality pipeline',
        proofExamples: [
          'Built demand gen engine generating $100M pipeline annually',
          'Reduced CAC by 40% while increasing volume',
          'Achieved 30% marketing-sourced revenue'
        ],
        antiPatterns: [
          'Pipeline claims without conversion context',
          'Lead volume without quality metrics'
        ]
      },
      {
        id: 'mkt-brand',
        name: 'Brand & Positioning',
        definition: 'Developing brand strategy that differentiates in market',
        proofExamples: [
          'Repositioned brand increasing win rate by 15%',
          'Grew brand awareness from 10% to 45% in category',
          'Led rebrand supporting 3x revenue growth'
        ],
        antiPatterns: [
          'Brand claims without business impact',
          'Awareness without purchase intent correlation'
        ]
      },
      {
        id: 'mkt-growth',
        name: 'Growth Marketing',
        definition: 'Driving measurable, scalable customer acquisition',
        proofExamples: [
          'Scaled paid acquisition from $0 to $5M monthly spend profitably',
          'Built PLG motion with 40% self-serve conversion',
          'Achieved CAC:LTV ratio of 1:5'
        ],
        antiPatterns: [
          'Spend without efficiency metrics',
          'Growth claims without profitability context'
        ]
      }
    ],
    benchmarkProofPoints: [
      'Built marketing org from scratch to 30+ team',
      'Managed $20M+ marketing budget',
      'Led category-creating brand campaign',
      'Drove successful IPO marketing',
      'Built international marketing presence'
    ],
    metricsNorms: [
      { metric: 'Marketing Budget', typicalRange: '$5M-$50M', unit: 'USD/year', sources: ['budget docs'], riskIfMissing: 'high' },
      { metric: 'Pipeline Generated', typicalRange: '$50M-$500M', unit: 'USD', sources: ['CRM'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '10-100', unit: 'people', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'CAC', typicalRange: '$100-$10000', unit: 'USD', sources: ['marketing analytics'], riskIfMissing: 'medium' }
    ],
    commonPitfalls: [
      'Activity metrics over revenue impact',
      'Channel expertise without full-funnel view',
      'Missing the sales partnership story',
      'Not showing budget management'
    ],
    executiveSignals: [
      'Board reporting',
      'Investor/analyst communications',
      'Major campaign leadership',
      'Agency/vendor management at scale',
      'International marketing'
    ],
    antiPatterns: [
      'Claiming pipeline without marketing attribution',
      'Inflating budget responsibility',
      'Taking credit for product-driven growth'
    ]
  },

  // General Executive (catch-all)
  {
    roleArchetype: 'General Executive',
    industryContext: 'Cross-Industry',
    aliases: [
      'Executive Director', 'General Manager', 'Managing Director',
      'President', 'Executive VP', 'Senior Director', 'Principal'
    ],
    seniorityLevel: 'VP',
    coreOutcomes: [
      'P&L responsibility and performance',
      'Strategic planning and execution',
      'Team leadership and development',
      'Stakeholder management',
      'Business growth'
    ],
    topCompetencies: [
      {
        id: 'exec-leadership',
        name: 'Executive Leadership',
        definition: 'Leading organizations and teams to achieve business objectives',
        proofExamples: [
          'Led division of 200 employees generating $100M revenue',
          'Turned around underperforming business unit to profitability',
          'Built new business unit from $0 to $25M'
        ],
        antiPatterns: [
          'Leadership claims without scope context',
          'Results without clear ownership'
        ]
      },
      {
        id: 'exec-strategy',
        name: 'Strategic Thinking',
        definition: 'Developing and executing strategies that drive competitive advantage',
        proofExamples: [
          'Developed 3-year strategy achieving 25% CAGR',
          'Identified and executed market expansion worth $20M',
          'Led strategic pivot increasing margins by 15%'
        ],
        antiPatterns: [
          'Strategy claims without execution evidence',
          'Vision without measurable outcomes'
        ]
      },
      {
        id: 'exec-results',
        name: 'Results Orientation',
        definition: 'Consistently delivering measurable business results',
        proofExamples: [
          'Exceeded targets for 5 consecutive years',
          'Delivered $10M cost reduction while growing revenue 20%',
          'Achieved top-quartile performance in industry benchmarks'
        ],
        antiPatterns: [
          'Results without baseline or timeline',
          'Claims without verification method'
        ]
      }
    ],
    benchmarkProofPoints: [
      'P&L responsibility at $50M+ scale',
      'Multi-function leadership experience',
      'Successful business transformation',
      'Board-level interaction',
      'M&A integration experience'
    ],
    metricsNorms: [
      { metric: 'Revenue Scope', typicalRange: '$25M-$500M', unit: 'USD', sources: ['P&L'], riskIfMissing: 'high' },
      { metric: 'Team Size', typicalRange: '50-500', unit: 'people', sources: ['org chart'], riskIfMissing: 'medium' },
      { metric: 'P&L Ownership', typicalRange: '$10M-$100M', unit: 'USD', sources: ['budget docs'], riskIfMissing: 'high' }
    ],
    commonPitfalls: [
      'Generic leadership claims',
      'Missing the specific industry/function context',
      'Not showing progression in scope',
      'Results without methodology'
    ],
    executiveSignals: [
      'Board experience',
      'P&L ownership',
      'Cross-functional authority',
      'External visibility',
      'M&A involvement'
    ],
    antiPatterns: [
      'Claiming credit for team accomplishments',
      'Inflating scope or responsibility',
      'Generic executive language without substance'
    ]
  }
];

// ============= Default Benchmark Resume Pattern =============

export const DEFAULT_RESUME_PATTERN: BenchmarkResumePattern = {
  targetTitleRules: [
    'Match the JD title exactly if candidate is qualified',
    'Use functional equivalent if title differs but scope matches',
    'Add "Senior" or "Executive" if scope warrants but JD omits'
  ],
  sectionOrder: [
    'Header (Name, Contact, LinkedIn)',
    'Executive Summary (3-4 lines)',
    'Signature Wins (3-5 bullet block)',
    'Professional Experience',
    'Skills & Technologies',
    'Education & Certifications'
  ],
  signatureWinsPattern: {
    description: '3-5 career-defining achievements at the top',
    bulletFormula: 'Result + Action + Scope + Impact',
    examples: [
      'Grew ARR from $10M to $50M by building and scaling customer success function from 5 to 35 CSMs',
      'Led $100M digital transformation delivered 2 months ahead of schedule with 95% milestone achievement',
      'Reduced customer churn by 40% through implementation of predictive health scoring system'
    ]
  },
  summaryPattern: {
    description: 'Concise positioning statement matching JD requirements',
    requiredElements: [
      'Years of relevant experience',
      'Key functional expertise',
      'Industry context',
      'Signature outcome or capability'
    ]
  },
  bulletFormula: 'Action Verb + What You Did + How + Quantified Result',
  orderingRules: [
    'Most impactful/relevant bullets first within each role',
    'Metrics-based bullets before qualitative bullets',
    'Recent experience emphasized over older',
    'Gap-bridging experience prioritized if addressing JD requirements'
  ],
  executive50PlusRules: [
    'Omit graduation years by default',
    'Emphasize last 10-15 years of experience',
    'Condense earlier roles into "Additional Experience" section',
    'Avoid age-signaling phrases (e.g., "30+ years")',
    'Use "15+ years relevant experience" instead of exact counts',
    'Focus on modern skills and recent transformation experience',
    'Highlight technology adoption and continuous learning',
    'Position as "experienced leader" not "long-tenured"'
  ]
};

// ============= Helper Functions =============

/**
 * Find the best matching rubric for a job title
 */
export function findExecutiveRubric(
  jobTitle: string,
  industry?: string
): ExecutiveRubric | null {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  
  for (const rubric of EXECUTIVE_RUBRICS) {
    // Check exact role match
    if (rubric.roleArchetype.toLowerCase() === normalizedTitle) {
      return rubric;
    }
    
    // Check aliases
    if (rubric.aliases.some(alias => 
      normalizedTitle.includes(alias.toLowerCase()) || 
      alias.toLowerCase().includes(normalizedTitle)
    )) {
      return rubric;
    }
  }
  
  // Check for partial keyword matches
  for (const rubric of EXECUTIVE_RUBRICS) {
    const keywords = rubric.roleArchetype.toLowerCase().split(' ');
    if (keywords.some(keyword => 
      keyword.length > 3 && normalizedTitle.includes(keyword)
    )) {
      return rubric;
    }
  }
  
  // Return general executive as fallback
  return EXECUTIVE_RUBRICS.find(r => r.roleArchetype === 'General Executive') || null;
}

/**
 * Get the default resume pattern
 */
export function getDefaultResumePattern(): BenchmarkResumePattern {
  return DEFAULT_RESUME_PATTERN;
}

/**
 * Detect role archetype from job description text
 */
export function detectRoleArchetype(jobDescription: string): string {
  const jdLower = jobDescription.toLowerCase();
  
  const roleIndicators: Record<string, string[]> = {
    'Customer Success Leader': ['customer success', 'client success', 'nrr', 'retention', 'churn', 'csm'],
    'Program/Transformation Leader': ['transformation', 'pmo', 'change management', 'program management', 'digital transformation'],
    'IT/Technology Leader': ['cio', 'cto', 'it infrastructure', 'technology strategy', 'engineering leadership'],
    'Operations Leader': ['coo', 'operations', 'operational excellence', 'process improvement', 'lean'],
    'Product Leader': ['product management', 'product strategy', 'cpo', 'product-led', 'roadmap'],
    'Sales Leader': ['cro', 'sales leadership', 'revenue', 'quota', 'pipeline', 'sales team'],
    'Finance Leader': ['cfo', 'financial planning', 'fp&a', 'treasury', 'controller'],
    'HR/People Leader': ['chro', 'people operations', 'human resources', 'talent acquisition', 'hr business partner'],
    'Marketing Leader': ['cmo', 'demand generation', 'brand', 'marketing strategy', 'growth marketing']
  };
  
  for (const [role, indicators] of Object.entries(roleIndicators)) {
    const matchCount = indicators.filter(ind => jdLower.includes(ind)).length;
    if (matchCount >= 2) {
      return role;
    }
  }
  
  return 'General Executive';
}
