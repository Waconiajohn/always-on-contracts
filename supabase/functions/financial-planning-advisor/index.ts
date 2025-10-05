import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an elite financial planning advisor specializing in career-aligned wealth building for professionals and executives.

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

CALCULATION METHODOLOGY:
- Use realistic return assumptions (7% inflation-adjusted)
- Factor in career trajectory (salary growth curves)
- Include tax implications
- Consider lifestyle inflation
- Model multiple scenarios (conservative, moderate, aggressive)

OUTPUT REQUIREMENTS:
Return JSON with:
{
  "analysis": {
    "currentFinancialHealth": "Score 1-10 with assessment",
    "retirementReadiness": "On track | Behind | Ahead with details",
    "monthlyGap": "Amount to close gap to retirement goal",
    "projectedRetirementCorpus": "Estimated amount at retirement age"
  },
  "recommendations": [
    {
      "priority": "critical | high | medium | low",
      "category": "savings | investment | career | risk",
      "action": "Specific action to take",
      "impact": "Expected financial impact",
      "timeline": "When to implement"
    }
  ],
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
  },
  "calculatorResults": {
    "monthlyRetirementSavings": "Recommended amount",
    "emergencyFundTarget": "3-12 months expenses",
    "wealthBuildingRate": "Current vs. target"
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI advisory failed: ${response.status}`);
    }

    const data = await response.json();
    const advisoryResult = data.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = advisoryResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : advisoryResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        analysis: {
          currentFinancialHealth: "Unable to assess",
          retirementReadiness: "Insufficient data",
          monthlyGap: "N/A",
          projectedRetirementCorpus: "N/A"
        },
        recommendations: [],
        scenarioModeling: {},
        careerFinancialAlignment: [],
        actionPlan: { immediate: [], shortTerm: [], longTerm: [] },
        calculatorResults: {}
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