import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

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
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (!authHeader) {
      // Log failed authentication attempt
      await supabaseServiceClient.rpc('log_security_event', {
        _event_type: 'failed_auth',
        _severity: 'medium',
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        _user_agent: req.headers.get('user-agent'),
        _endpoint: '/validate-role',
        _details: { reason: 'missing_auth_header' }
      });
      
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      
      // Log failed authentication
      await supabaseServiceClient.rpc('log_security_event', {
        _event_type: 'failed_auth',
        _severity: 'high',
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        _user_agent: req.headers.get('user-agent'),
        _endpoint: '/validate-role',
        _details: { error: userError?.message || 'invalid_token' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side role validation using RLS-protected query
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('Role query error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch role', role: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ role: roleData?.role || null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in validate-role function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
