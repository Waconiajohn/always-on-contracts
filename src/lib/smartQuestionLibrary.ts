/**
 * Smart Question Library - Coach-style prompts by category
 * 
 * These question templates are designed for 50+ executives, 
 * using conversational, respectful language that feels like 
 * sitting with a career coach rather than filling out forms.
 */

export interface SmartQuestionTemplate {
  category: string;
  question: string;
  reasoning: string;
  suggestedAnswer: string;
}

/**
 * Metrics & Impact Questions
 * These help quantify results without forcing executives to brag.
 */
export const METRICS_QUESTIONS: SmartQuestionTemplate[] = [
  {
    category: "Metrics",
    question: "Thinking about your most recent role, what 2–3 tangible results are you comfortable quantifying (for example, revenue growth, cost savings, risk reduction, or client retention)?",
    reasoning: "This helps us move from responsibilities to clear accomplishments we can highlight on resumes and LinkedIn.",
    suggestedAnswer: "For example: \"Increased regional revenue by ~15% over 12 months by restructuring territories and coaching underperforming reps.\""
  },
  {
    category: "Metrics",
    question: "Were there any changes you led that reduced cost, waste, or manual effort? Even rough estimates (percentages or ranges) are helpful.",
    reasoning: "Many executives underplay operational wins. Quantifying even approximate savings strengthens your story.",
    suggestedAnswer: "For example: \"Consolidated vendors and renegotiated contracts, reducing annual operating expenses by an estimated 8–10%.\""
  },
  {
    category: "Metrics",
    question: "Over your last 1–2 roles, how did key metrics move under your leadership—such as revenue, assets under management, pipeline, or client retention?",
    reasoning: "We want to show the before-and-after picture of your leadership, not just your day-to-day responsibilities.",
    suggestedAnswer: "For example: \"Grew book of business from ~$120M to ~$165M over four years while maintaining 95%+ client retention.\""
  },
  {
    category: "Metrics",
    question: "Did you improve any risk, quality, or compliance measures (fewer errors, audit findings, incidents, or escalations)? Share anything you're comfortable estimating.",
    reasoning: "Improvements in risk and quality matter just as much as revenue and growth, especially at senior levels.",
    suggestedAnswer: "For example: \"Reduced operational audit findings from 7 to 1 over two cycles by tightening procedures and retraining staff.\""
  },
  {
    category: "Metrics",
    question: "If you led teams, were there any metrics around engagement, turnover, or promotion rates that improved while you were in the role?",
    reasoning: "This gives us evidence that your leadership style delivers results for both the business and the people.",
    suggestedAnswer: "For example: \"Cut voluntary turnover on the team from ~18% to ~9% over two years by clarifying roles and development paths.\""
  }
];

/**
 * Scope & Complexity Questions
 * These help understand "how big" their world was without making them brag.
 */
export const SCOPE_QUESTIONS: SmartQuestionTemplate[] = [
  {
    category: "Scope",
    question: "At a high level, what was the scope of your role—size of team, budget responsibility, or number of locations or clients under your oversight?",
    reasoning: "Scope tells hiring managers the level at which you've operated, beyond just your job title.",
    suggestedAnswer: "For example: \"Led a team of 12 (mix of on-site and remote), managed a ~$6M annual budget, and supported 40+ key client relationships.\""
  },
  {
    category: "Scope",
    question: "Did your work primarily cover a local, regional, national, or global footprint? Were you coordinating across multiple business units or lines of business?",
    reasoning: "This helps us position you correctly for roles that match the complexity you're used to managing.",
    suggestedAnswer: "For example: \"Oversaw operations across three U.S. regions, coordinating with sales, service, and compliance stakeholders.\""
  },
  {
    category: "Scope",
    question: "What types of products, services, or programs were under your responsibility, and roughly how many at any given time?",
    reasoning: "This clarifies the breadth of your portfolio so we can match you to similar or slightly larger opportunities.",
    suggestedAnswer: "For example: \"Owned a portfolio of 6 key retirement products and advised on an additional 15–20 customized plan designs each year.\""
  },
  {
    category: "Scope",
    question: "How would you describe your decision-making authority—were you mainly advising, jointly deciding with leadership, or acting as final decision maker in your area?",
    reasoning: "Understanding your level of authority helps us target roles that feel like a step forward, not a step back.",
    suggestedAnswer: "For example: \"Final decision maker for team structure and hiring; jointly decided on pricing and major client proposals with regional leadership.\""
  }
];

/**
 * Team Leadership & People Management Questions
 * Pull out style, scale, and impact on people—not just "I managed a team."
 */
export const TEAM_LEADERSHIP_QUESTIONS: SmartQuestionTemplate[] = [
  {
    category: "Team Leadership",
    question: "Over the last few roles, what types of teams did you lead (size, mix of roles, and whether they were on-site, remote, or hybrid)?",
    reasoning: "This helps us describe your leadership experience with enough detail for a hiring manager to picture your span of control.",
    suggestedAnswer: "For example: \"Led a team of 10–14, including relationship managers, analysts, and support staff across two locations (hybrid).\""
  },
  {
    category: "Team Leadership",
    question: "Can you share one or two examples where you developed people—helping someone step into a bigger role, turn performance around, or grow a new capability on the team?",
    reasoning: "Senior roles often hinge on how well you develop others. These stories translate directly into strong interview answers.",
    suggestedAnswer: "For example: \"Coached an underperforming manager into a top-quartile performer within a year; they were later promoted to director.\""
  },
  {
    category: "Team Leadership",
    question: "Did you make any noticeable changes to team culture, ways of working, or stability (such as reducing turnover, improving collaboration, or smoothing handoffs)?",
    reasoning: "This helps us capture the \"how you lead\" side of your experience, not just the numbers.",
    suggestedAnswer: "For example: \"Introduced a simple weekly stand-up and clearer ownership; reduced friction between sales and service and cut escalations by ~30%.\""
  },
  {
    category: "Team Leadership",
    question: "Think of a time your team went through a major change—new system, re-org, merger, or leadership shift. How did you help them through it, and what was the outcome?",
    reasoning: "Change leadership stories are some of the strongest material for senior-level interviews.",
    suggestedAnswer: "For example: \"Led the team through a platform migration; kept service levels steady and retained all key clients during the transition.\""
  }
];

/**
 * Get all question templates
 */
export function getAllQuestionTemplates(): SmartQuestionTemplate[] {
  return [
    ...METRICS_QUESTIONS,
    ...SCOPE_QUESTIONS,
    ...TEAM_LEADERSHIP_QUESTIONS
  ];
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: string): SmartQuestionTemplate[] {
  const allQuestions = getAllQuestionTemplates();
  return allQuestions.filter(q => q.category === category);
}

/**
 * Get a random sample of questions across categories
 */
export function getRandomQuestions(count: number): SmartQuestionTemplate[] {
  const allQuestions = getAllQuestionTemplates();
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
