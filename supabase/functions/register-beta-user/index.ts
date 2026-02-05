import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, invitation_id } = await req.json();

    if (!user_id || !invitation_id) {
      return new Response(
        JSON.stringify({ error: 'user_id and invitation_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calculate beta dates
    const betaStartedAt = new Date();
    const betaExpiresAt = new Date();
    betaExpiresAt.setMonth(betaExpiresAt.getMonth() + 3);

    console.log(`Registering beta user: ${user_id} with invitation: ${invitation_id}`);

    // 1. Update profile with beta information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_beta: true,
        beta_started_at: betaStartedAt.toISOString(),
        beta_expires_at: betaExpiresAt.toISOString(),
        beta_invitation_id: invitation_id,
        plan: 'starter',
        sites_limit: 1,
        posts_limit: 4,
      })
      .eq('user_id', user_id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile updated successfully');

    // 2. Add beta role (upsert to avoid duplicates)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id, role: 'beta' },
        { onConflict: 'user_id,role' }
      );

    if (roleError) {
      console.error('Error adding beta role:', roleError);
      // Don't fail completely, profile was updated
    } else {
      console.log('Beta role added successfully');
    }

    // 3. Increment invitation uses
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('beta_invitations')
      .select('current_uses')
      .eq('id', invitation_id)
      .single();

    if (!fetchError && invitation) {
      const { error: incrementError } = await supabaseAdmin
        .from('beta_invitations')
        .update({ current_uses: invitation.current_uses + 1 })
        .eq('id', invitation_id);

      if (incrementError) {
        console.error('Error incrementing invitation uses:', incrementError);
      } else {
        console.log('Invitation uses incremented');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Beta user registered successfully',
        beta_expires_at: betaExpiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
