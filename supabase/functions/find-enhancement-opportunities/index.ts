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
    const { roadmapItem, currentItems } = await req.json();
    
    const suggestedKeywords = roadmapItem.suggestedActions || [];
    const opportunities: any[] = [];

    // Analyze each existing item for enhancement potential
    currentItems.forEach((item: any) => {
      const content = item.power_phrase || item.stated_skill || item.inferred_capability || item.skill_name || '';
      const contentLower = content.toLowerCase();
      
      // Find missing keywords that could enhance this item
      const missingKeywords = suggestedKeywords.filter((keyword: string) => 
        !contentLower.includes(keyword.toLowerCase())
      );

      // Only suggest if item could benefit and isn't already gold tier
      if (missingKeywords.length > 0 && item.quality_tier !== 'gold') {
        opportunities.push({
          itemId: item.id,
          currentContent: content,
          suggestedKeywords: missingKeywords.slice(0, 3),
          potentialImprovement: `Adding these keywords could elevate this to ${
            item.quality_tier === 'silver' ? 'gold' : 'silver'
          } tier`
        });
      }
    });

    // Return top 5 opportunities
    return new Response(
      JSON.stringify({ opportunities: opportunities.slice(0, 5) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-enhancement-opportunities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, opportunities: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
