import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connection
    const { error: dbError } = await supabase.from('career_vault').select('id').limit(1);
    
    // Check auth system
    const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbError ? 'down' : 'up',
        auth: authError ? 'down' : 'up',
      },
      version: '2.0.0',
    };

    if (dbError || authError) {
      health.status = 'degraded';
    }

    return new Response(
      JSON.stringify(health),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: health.status === 'healthy' ? 200 : 503,
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(
      JSON.stringify({ 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
