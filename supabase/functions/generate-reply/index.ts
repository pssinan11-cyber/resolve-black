import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for logging
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // Log failed authentication attempt
      await supabaseServiceClient.rpc('log_security_event', {
        _event_type: 'failed_auth',
        _severity: 'medium',
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        _user_agent: req.headers.get('user-agent'),
        _endpoint: '/generate-reply',
        _details: { reason: 'missing_auth_header' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
        _user_id: null,
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        _user_agent: req.headers.get('user-agent'),
        _endpoint: '/generate-reply',
        _details: { error: userError?.message || 'invalid_token' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error('Authorization failed:', roleError || 'Not an admin');
      
      // Log failed authorization (privilege escalation attempt)
      await supabaseServiceClient.rpc('log_security_event', {
        _event_type: 'failed_authz',
        _severity: 'high',
        _user_id: user.id,
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        _user_agent: req.headers.get('user-agent'),
        _endpoint: '/generate-reply',
        _details: { 
          reason: 'insufficient_permissions',
          required_role: 'admin',
          error: roleError?.message
        }
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { complaint } = await req.json();

    // Input validation
    if (!complaint || typeof complaint !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Complaint object is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!complaint.title || typeof complaint.title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Complaint title is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!complaint.description || typeof complaint.description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Complaint description is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Length validation
    if (complaint.title.length > MAX_TITLE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Title must not exceed ${MAX_TITLE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (complaint.description.length > MAX_DESCRIPTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedComplaint = {
      title: complaint.title.trim(),
      description: complaint.description.trim()
    };

    if (!sanitizedComplaint.title || !sanitizedComplaint.description) {
      return new Response(
        JSON.stringify({ error: 'Title and description cannot be empty or only whitespace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const generateReply = async (tone: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `Write a ${tone} reply to this complaint:\n\nTitle: ${sanitizedComplaint.title}\nDescription: ${sanitizedComplaint.description}\n\nReply (2-3 sentences max):`
          }],
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    };

    const [formal, friendly, empathetic] = await Promise.all([
      generateReply('formal and professional'),
      generateReply('friendly and casual'),
      generateReply('empathetic and understanding')
    ]);

    return new Response(JSON.stringify({ formal, friendly, empathetic }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate replies' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});