import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentAge, 
      retirementAge, 
      currentIncome, 
      currentSavings,
      monthlyExpenses,
      careerGoals,
      advisoryType 
    } = await req.json();

    const systemPrompt = `You are an elite financial planning advisor specializing in career transitions and retirement planning for professionals.

CRITICAL RULES:
- ALWAYS validate input data for reasonableness (e.g., retirement age > current age)
- Use conservative assumptions unless user specifies otherwise
- Flag unrealistic scenarios (e.g., retiring in 2 years with $0 savings)
- Clearly distinguish between guaranteed vs. estimated returns
- Account for inflation, taxes, and market volatility
- Provide sensitivity analysis for key variables

CALCULATION STANDARDS:
1. Retirement Corpus = Annual Expenses × 25 (4% withdrawal rule)
2. Emergency Fund = 6-12 months of expenses
3. Post-tax returns = Pre-tax returns × (1 - tax rate)
4. Real return = Nominal return - Inflation rate
5. Future value = PV × (1 + r)^n

FINANCIAL ADVISORY FRAMEWORK:

CAREER-ALIGNED FINANCIAL PLANNING:
1. INCOME OPTIMIZATION
   - Salary negotiation impact modeling
   - Career transition ROI analysis
   - Side income opportunities
   - Equity compensation strategies

2. RETIREMENT PLANNING
   - Target retirement corpus calculation
   - Savings rate optimization
   - Investment allocation by career stage
   - Tax-advantaged account maximization

3. CAREER INVESTMENT DECISIONS
   - MBA/certification ROI analysis
   - Geographic relocation financial impact
   - Entrepreneurship financial runway
   - Contract vs. permanent financial comparison

4. RISK MANAGEMENT
   - Emergency fund sizing (by career risk)
   - Insurance needs assessment
   - Career transition buffer planning
   - Income volatility hedging

5. WEALTH ACCELERATION
   - High-leverage career moves
   - Equity/stock option strategies
   - Passive income development
   - Tax optimization tactics

ADVISORY TYPES:
- retirement-planning: 20-30 year retirement roadmap
- career-transition: Financial implications of career changes
- income-optimization: Maximizing current income potential
- wealth-acceleration: Aggressive growth strategies
- risk-assessment: Comprehensive risk analysis

INPUT VALIDATION:
- Retirement age must be > current age
- Income/expenses must be positive
- Investment return expectations: 4-12% (flag if outside)
- Savings rate: 0-80% (flag if >50% or <10%)
- Risk tolerance must match investment strategy

TAX CONSIDERATIONS:
- Differentiate pre-tax vs. post-tax accounts
- Account for capital gains tax on investments
- Consider tax-advantaged accounts (401k, IRA, Roth)
- Estimate marginal tax rate based on income
- Factor in Social Security taxation thresholds

CALCULATION METHODOLOGY:
- Use realistic return assumptions (7% inflation-adjusted)
- Factor in career trajectory (salary growth curves)
- Include tax implications
- Consider lifestyle inflation
- Model multiple scenarios (conservative, moderate, aggressive)

OUTPUT REQUIREMENTS:
Return JSON with:
{
  "inputValidation": {
    "isValid": boolean,
    "warnings": ["List any unrealistic assumptions"],
    "recommendations": ["Suggestions for data correction"]
  },
  "financialSummary": {
    "currentNetWorth": number,
    "retirementReadiness": "on-track | needs-adjustment | critical",
    "yearsToRetirement": number,
    "monthlyGap": number,
    "confidenceLevel": "high | medium | low"
  },
  "strategicRecommendations": [
    {
      "priority": "critical | high | medium | low",
      "category": "savings | investment | income | expenses | risk | tax",
      "action": "Specific action to take",
      "impact": "Expected financial impact",
      "timeframe": "When to implement",
      "difficulty": "easy | moderate | challenging"
    }
  ],
  "taxImpact": {
    "estimatedMarginalRate": "percentage",
    "taxEfficientStrategies": ["Strategy 1", "Strategy 2"],
    "accountTypeRecommendations": "Roth vs Traditional guidance"
  },
  "sensitivityAnalysis": {
    "marketDownturn": "Impact if returns drop 20%",
    "inflationSpike": "Impact if inflation increases 2%",
    "incomeReduction": "Impact of 20% income cut",
    "delayedRetirement": "Effect of working 2 more years"
  },
  "calculatorResults": {
    "retirementCorpusNeeded": number,
    "retirementCorpusNeededExplanation": "How calculated (e.g., $60k/yr × 25)",
    "currentTrajectory": number,
    "currentTrajectoryExplanation": "Projected value at retirement age",
    "gapAnalysis": number,
    "gapAnalysisExplanation": "Shortfall or surplus amount",
    "monthlyInvestmentNeeded": number,
    "monthlyInvestmentNeededExplanation": "How to close the gap",
    "emergencyFundTarget": number,
    "emergencyFundTargetExplanation": "6-12 months of expenses"
  },
  "scenarioModeling": {
    "conservative": "If income stays flat",
    "moderate": "With normal career progression",
    "aggressive": "With strategic career moves"
  },
  "careerFinancialAlignment": [
    "How career goal 1 impacts finances",
    "How career goal 2 impacts finances"
  ],
  "actionPlan": {
    "immediate": ["Action 1", "Action 2"],
    "shortTerm": ["Action 3", "Action 4"],
    "longTerm": ["Action 5", "Action 6"]
  }
}

DISCLAIMERS:
- Not professional financial advice (for informational purposes)
- Recommend consulting licensed advisor for specific situations
- Assumptions based on historical averages`;

    const userPrompt = `Provide financial advisory for:

CURRENT AGE: ${currentAge}
RETIREMENT AGE: ${retirementAge || 65}
CURRENT INCOME: $${currentIncome || 'Not provided'}
CURRENT SAVINGS: $${currentSavings || 0}
MONTHLY EXPENSES: $${monthlyExpenses || 'Not provided'}
CAREER GOALS: ${careerGoals || 'General career growth'}
ADVISORY TYPE: ${advisoryType || 'comprehensive'}

Provide actionable, career-aligned financial guidance with specific numbers and timelines.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: selectOptimalModel({
          taskType: 'analysis',
          complexity: 'high',
          requiresReasoning: true,
          outputLength: 'long'
        }),
        temperature: 0.2,
      },
      'financial-planning-advisor'
    );

    await logAIUsage(metrics);

    const advisoryResult = response.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = advisoryResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : advisoryResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        inputValidation: {
          isValid: false,
          warnings: ["AI parsing error occurred"],
          recommendations: ["Please try again"]
        },
        financialSummary: {
          currentNetWorth: 0,
          retirementReadiness: "needs-adjustment",
          yearsToRetirement: 0,
          monthlyGap: 0,
          confidenceLevel: "low"
        },
        strategicRecommendations: [],
        taxImpact: {
          estimatedMarginalRate: "Unknown",
          taxEfficientStrategies: [],
          accountTypeRecommendations: "Consult tax advisor"
        },
        sensitivityAnalysis: {},
        calculatorResults: {},
        scenarioModeling: {},
        careerFinancialAlignment: [],
        actionPlan: { immediate: [], shortTerm: [], longTerm: [] }
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-planning-advisor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});