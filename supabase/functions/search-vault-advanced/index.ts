// =====================================================
// ADVANCED VAULT SEARCH - Career Vault 2.0
// =====================================================
// FULL-TEXT SEARCH WITH SEMANTIC RANKING
//
// This function provides advanced search capabilities
// across all 10 vault intelligence categories with
// PostgreSQL full-text search for instant results.
//
// UNIQUE VALUE:
// - Cross-category search with relevance ranking
// - Filters by quality tier, category, date range
// - Semantic understanding of search intent
// - Instant results using GIN indexes
//
// MARKETING MESSAGE:
// "Unlike basic keyword search, our AI-powered vault
// search understands context—finding 'leadership' will
// surface power phrases about team building, soft skills
// like delegation, and executive presence indicators."
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SearchRequest {
  vaultId: string;
  query: string;
  category?: string;
  qualityTier?: string;
  limit?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      vaultId,
      query,
      category,
      qualityTier,
      limit = 50,
    }: SearchRequest = await req.json();

    console.log('🔍 ADVANCED VAULT SEARCH:', {
      vaultId,
      query,
      category,
      qualityTier,
      limit,
      userId: user.id,
    });

    // Call database function for full-text search
    const { data: searchResults, error: searchError } = await supabaseClient
      .rpc('search_vault_items', {
        p_vault_id: vaultId,
        p_search_query: query,
        p_category: category || null,
        p_quality_tier: qualityTier || null,
        p_limit: limit,
      });

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`);
    }

    // Organize results by category
    const resultsByCategory: Record<string, any[]> = {};
    searchResults.forEach((result: any) => {
      const cat = result.item_type || 'Other';
      if (!resultsByCategory[cat]) {
        resultsByCategory[cat] = [];
      }
      resultsByCategory[cat].push(result);
    });

    // Calculate search insights
    const totalResults = searchResults.length;
    const qualityBreakdown = {
      gold: searchResults.filter((r: any) => r.quality_tier === 'gold').length,
      silver: searchResults.filter((r: any) => r.quality_tier === 'silver').length,
      bronze: searchResults.filter((r: any) => r.quality_tier === 'bronze').length,
      assumed: searchResults.filter((r: any) => r.quality_tier === 'assumed').length,
    };

    const avgMatchRank = searchResults.length > 0
      ? searchResults.reduce((sum: number, r: any) => sum + (r.match_rank || 0), 0) / searchResults.length
      : 0;

    console.log('✅ SEARCH COMPLETE:', {
      totalResults,
      categories: Object.keys(resultsByCategory).length,
      avgMatchRank: avgMatchRank.toFixed(3),
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results: searchResults,
          resultsByCategory,
          insights: {
            totalResults,
            qualityBreakdown,
            avgMatchRank,
            categoriesFound: Object.keys(resultsByCategory),
          },
        },
        meta: {
          message: `Found ${totalResults} matching items across ${Object.keys(resultsByCategory).length} categories`,
          uniqueValue: totalResults > 0
            ? 'Our AI-powered search understands context—finding related items you might have missed with basic keyword search.'
            : 'Try broadening your search or check spelling. Our full-text search indexes every word in your vault.',
          searchTip: avgMatchRank > 0.5
            ? 'High relevance scores—these results are very closely matched to your query!'
            : avgMatchRank > 0.2
            ? 'Good matches found. For more precise results, try adding specific keywords.'
            : 'Some matches found. Try different search terms or browse by category.',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in search-vault-advanced:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        userMessage: 'Search failed. Please try again with different terms.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
