import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with their token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { confirmation } = await req.json();
    if (confirmation !== "ELIMINAR") {
      return new Response(JSON.stringify({ error: "Confirmation text does not match" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    // Delete user data in order (respecting foreign keys)
    // 1. Articles
    await adminClient.from("articles").delete().eq("user_id", userId);
    // 2. WordPress configs & taxonomies
    const { data: wpConfigs } = await adminClient.from("wordpress_configs").select("id").eq("user_id", userId);
    if (wpConfigs?.length) {
      const configIds = wpConfigs.map(c => c.id);
      await adminClient.from("wordpress_taxonomies_saas").delete().in("wordpress_config_id", configIds);
      await adminClient.from("wordpress_configs").delete().eq("user_id", userId);
    }
    // 3. WordPress diagnostics
    await adminClient.from("wordpress_diagnostics").delete().eq("user_id", userId);
    // 4. Onboarding
    await adminClient.from("onboarding_checklist").delete().eq("user_id", userId);
    await adminClient.from("onboarding_progress").delete().eq("user_id", userId);
    // 5. Support
    const { data: convos } = await adminClient.from("support_conversations").select("id").eq("user_id", userId);
    if (convos?.length) {
      const convoIds = convos.map(c => c.id);
      await adminClient.from("support_messages").delete().in("conversation_id", convoIds);
      await adminClient.from("support_conversations").delete().eq("user_id", userId);
    }
    // 6. Surveys
    await adminClient.from("survey_responses").delete().eq("user_id", userId);
    await adminClient.from("pending_surveys").delete().eq("user_id", userId);
    // 7. Sites
    await adminClient.from("sites").delete().eq("user_id", userId);
    // 8. User roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    // 9. Profile
    await adminClient.from("profiles").delete().eq("user_id", userId);
    // 10. Avatar from storage
    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
    if (avatarFiles?.length) {
      const paths = avatarFiles.map(f => `${userId}/${f.name}`);
      await adminClient.storage.from("avatars").remove(paths);
    }
    // 11. Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Error deleting auth account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
