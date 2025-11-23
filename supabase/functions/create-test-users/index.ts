import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      console.error('User is not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { users } = await req.json() as { users: TestUser[] };

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: users array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating ${users.length} test users...`);

    // Use service role client to create users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        console.log(`Processing user: ${userData.email}`);
        let userId: string | null = null;
        let isNewUser = false;

        // Try to create auth user, or get existing user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.fullName
          }
        });

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already been registered')) {
            console.log(`User ${userData.email} already exists, fetching user ID...`);
            
            // Get existing user by email
            const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
              console.error(`Error fetching users:`, listError);
              errors.push({ email: userData.email, error: `Cannot fetch existing user: ${listError.message}` });
              continue;
            }

            const existingUser = existingUsers?.users.find(u => u.email === userData.email);
            if (!existingUser) {
              console.error(`User ${userData.email} should exist but not found`);
              errors.push({ email: userData.email, error: 'User exists but cannot be found' });
              continue;
            }

            userId = existingUser.id;
            console.log(`Found existing user: ${userId}`);
          } else {
            console.error(`Error creating auth user ${userData.email}:`, authError);
            errors.push({ email: userData.email, error: authError.message });
            continue;
          }
        } else {
          if (!authData.user) {
            console.error(`No user returned for ${userData.email}`);
            errors.push({ email: userData.email, error: 'No user returned from auth' });
            continue;
          }
          userId = authData.user.id;
          isNewUser = true;
          console.log(`Auth user created: ${userId}`);
        }

        // Ensure profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: userId,
              full_name: userData.fullName
            });

          if (profileError) {
            console.error(`Error creating profile for ${userData.email}:`, profileError);
            errors.push({ email: userData.email, error: `Profile error: ${profileError.message}` });
            continue;
          }
          console.log(`Profile created for ${userData.email}`);
        } else {
          console.log(`Profile already exists for ${userData.email}`);
        }

        // Ensure role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', userData.role)
          .single();

        if (!existingRole) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              role: userData.role
            });

          if (roleError) {
            console.error(`Error assigning role for ${userData.email}:`, roleError);
            errors.push({ email: userData.email, error: `Role error: ${roleError.message}` });
            continue;
          }
          console.log(`Role ${userData.role} assigned to ${userData.email}`);
        } else {
          console.log(`Role already exists for ${userData.email}`);
        }

        results.push({
          email: userData.email,
          userId: userId,
          role: userData.role,
          success: true,
          action: isNewUser ? 'created' : 'updated'
        });

      } catch (error) {
        console.error(`Unexpected error for ${userData.email}:`, error);
        errors.push({ 
          email: userData.email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`Batch creation complete. Success: ${results.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        created: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: users.length,
          successful: results.length,
          failed: errors.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-test-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
