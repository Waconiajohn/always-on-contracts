// =====================================================
// EXPORT VAULT - Career Vault 2.0
// =====================================================
// MULTI-FORMAT VAULT EXPORT
//
// This function exports vault intelligence in multiple
// formats: JSON (full data), CSV (spreadsheet), or
// formatted text (human-readable for AI tools).
//
// UNIQUE VALUE:
// - Export to JSON for backup/migration
// - Export to CSV for Excel analysis
// - Export to formatted text for AI assistants
// - Selective export by category or quality tier
//
// MARKETING MESSAGE:
// "Your career intelligence is YOURS. Export anytime in
// JSON (full backup), CSV (Excel-ready), or formatted
// text (perfect for ChatGPT/Claude). Unlike competitors
// who lock your data, we believe in portability."
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ExportRequest {
  vaultId: string;
  format: 'json' | 'csv' | 'text';
  categories?: string[];
  qualityTiers?: string[];
  includeMetadata?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_TABLES = {
  power_phrases: 'vault_power_phrases',
  transferable_skills: 'vault_transferable_skills',
  hidden_competencies: 'vault_hidden_competencies',
  soft_skills: 'vault_soft_skills',
  leadership_philosophy: 'vault_leadership_philosophy',
  executive_presence: 'vault_executive_presence',
  personality_traits: 'vault_personality_traits',
  work_style: 'vault_work_style',
  values: 'vault_values_motivations',
  behavioral_indicators: 'vault_behavioral_indicators',
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
      format,
      categories = Object.keys(CATEGORY_TABLES),
      qualityTiers,
      includeMetadata = true,
    }: ExportRequest = await req.json();

    console.log('📦 VAULT EXPORT:', {
      vaultId,
      format,
      categories: categories.length,
      qualityTiers,
      userId: user.id,
    });

    // Fetch vault metadata
    const { data: vault } = await supabaseClient
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (!vault) {
      throw new Error('Vault not found');
    }

    // Fetch all requested categories
    const vaultData: any = {};
    let totalItems = 0;

    for (const category of categories) {
      const tableName = CATEGORY_TABLES[category as keyof typeof CATEGORY_TABLES];
      if (!tableName) continue;

      let query = supabaseClient
        .from(tableName)
        .select('*')
        .eq('vault_id', vaultId);

      // Filter by quality tier if specified
      if (qualityTiers && qualityTiers.length > 0) {
        query = query.in('quality_tier', qualityTiers);
      }

      const { data: items } = await query;

      if (items && items.length > 0) {
        vaultData[category] = items;
        totalItems += items.length;
      }
    }

    // Generate export based on format
    let exportContent: string;
    let contentType: string;
    let filename: string;

    if (format === 'json') {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        vaultId: vault.id,
        userId: user.id,
        metadata: includeMetadata ? {
          vaultStrength: vault.overall_strength_score,
          totalItems,
          createdAt: vault.created_at,
          lastUpdatedAt: vault.updated_at,
        } : null,
        data: vaultData,
      };

      exportContent = JSON.stringify(exportObject, null, 2);
      contentType = 'application/json';
      filename = `career-vault-${vaultId.slice(0, 8)}-${Date.now()}.json`;

    } else if (format === 'csv') {
      // Flatten all items into CSV rows
      const rows: string[][] = [['Category', 'Content', 'Quality Tier', 'Source', 'Created At']];

      for (const [category, items] of Object.entries(vaultData)) {
        for (const item of items as any[]) {
          const content = item.power_phrase || item.stated_skill || item.competency_area ||
                         item.skill_name || item.philosophy_statement || item.presence_indicator ||
                         item.trait_name || item.preference_area || item.value_name ||
                         item.indicator_type || 'N/A';

          rows.push([
            category,
            `"${content.replace(/"/g, '""')}"`, // Escape quotes
            item.quality_tier || 'assumed',
            item.source || item.inferred_from || 'N/A',
            item.created_at || 'N/A',
          ]);
        }
      }

      exportContent = rows.map(row => row.join(',')).join('\n');
      contentType = 'text/csv';
      filename = `career-vault-${vaultId.slice(0, 8)}-${Date.now()}.csv`;

    } else if (format === 'text') {
      // Human-readable text format (perfect for AI assistants)
      const lines: string[] = [];

      lines.push('═══════════════════════════════════════════════════');
      lines.push('CAREER VAULT EXPORT');
      lines.push(`Exported: ${new Date().toISOString()}`);
      lines.push(`Total Items: ${totalItems}`);
      lines.push('═══════════════════════════════════════════════════\n');

      for (const [category, items] of Object.entries(vaultData)) {
        lines.push(`\n━━━ ${category.toUpperCase().replace(/_/g, ' ')} (${(items as any[]).length} items) ━━━\n`);

        for (const item of items as any[]) {
          const content = item.power_phrase || item.stated_skill || item.competency_area ||
                         item.skill_name || item.philosophy_statement || item.presence_indicator ||
                         item.trait_name || item.preference_area || item.value_name ||
                         item.indicator_type || 'N/A';

          lines.push(`• ${content}`);

          if (item.evidence) lines.push(`  Evidence: ${item.evidence}`);
          if (item.examples) lines.push(`  Examples: ${item.examples}`);
          if (item.quality_tier) lines.push(`  Quality: ${item.quality_tier.toUpperCase()}`);

          lines.push('');
        }
      }

      exportContent = lines.join('\n');
      contentType = 'text/plain';
      filename = `career-vault-${vaultId.slice(0, 8)}-${Date.now()}.txt`;

    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Log export activity
    await supabaseClient.from('vault_activity_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      activity_type: 'export',
      description: `Exported vault data as ${format.toUpperCase()}`,
      metadata: {
        format,
        categories: categories.length,
        totalItems,
        qualityTiers,
      },
    });

    console.log('✅ EXPORT COMPLETE:', {
      format,
      totalItems,
      fileSize: `${(exportContent.length / 1024).toFixed(1)} KB`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          content: exportContent,
          filename,
          contentType,
          totalItems,
          categories: Object.keys(vaultData),
        },
        meta: {
          message: `Exported ${totalItems} items across ${Object.keys(vaultData).length} categories`,
          uniqueValue: format === 'text'
            ? 'This text format is perfect for copying into ChatGPT, Claude, or any AI assistant for personalized career advice!'
            : format === 'csv'
            ? 'Import this CSV into Excel or Google Sheets for custom analysis, filtering, and visualization.'
            : 'This JSON backup includes all metadata and can be used for migration or external integrations.',
          dataOwnership: 'Your career intelligence is YOURS. Export anytime, use anywhere. No lock-in.',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in export-vault:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        userMessage: 'Export failed. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
