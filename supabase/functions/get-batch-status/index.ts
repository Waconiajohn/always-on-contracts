import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchOperationId } = await req.json();

    if (!batchOperationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'batchOperationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch batch operation status
    const { data: batchOp, error } = await supabase
      .from('batch_operations')
      .select('*')
      .eq('id', batchOperationId)
      .single();

    if (error || !batchOp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch operation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate progress percentage
    const progress = batchOp.total_items > 0
      ? Math.round((batchOp.processed_items / batchOp.total_items) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        status: batchOp.status,
        progress,
        total_items: batchOp.total_items,
        processed_items: batchOp.processed_items,
        successful_items: batchOp.successful_items,
        failed_items: batchOp.failed_items,
        is_complete: batchOp.status === 'completed' || batchOp.status === 'failed',
        error_message: batchOp.error_message,
        created_at: batchOp.created_at,
        completed_at: batchOp.completed_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-batch-status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get batch status'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
