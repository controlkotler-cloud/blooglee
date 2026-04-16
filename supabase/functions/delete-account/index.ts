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
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
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
    const errors: string[] = [];

    // Helper: delete and track errors instead of failing silently
    async function safeDelete(table: string, column: string, value: string | string[], op: "eq" | "in" = "eq") {
      try {
        const query = adminClient.from(table).delete();
        const result =
          op === "eq" ? await query.eq(column, value as string) : await query.in(column, value as string[]);
        if (result.error) {
          errors.push(`${table}: ${result.error.message}`);
        }
      } catch (e) {
        errors.push(`${table}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    // Delete user data in order (respecting foreign keys)
    // 1. Articles
    await safeDelete("articles", "user_id", userId);

    // 2. WordPress configs & taxonomies
    const { data: wpConfigs } = await adminClient.from("wordpress_configs").select("id").eq("user_id", userId);
    if (wpConfigs?.length) {
      const configIds = wpConfigs.map((c) => c.id);
      await safeDelete("wordpress_taxonomies_saas", "wordpress_config_id", configIds, "in");
      await safeDelete("wordpress_configs", "user_id", userId);
    }

    // 3. WordPress diagnostics
    await safeDelete("wordpress_diagnostics", "user_id", userId);

    // 4. Onboarding
    await safeDelete("onboarding_checklist", "user_id", userId);
    await safeDelete("onboarding_progress", "user_id", userId);

    // 5. Support
    const { data: convos } = await adminClient.from("support_conversations").select("id").eq("user_id", userId);
    if (convos?.length) {
      const convoIds = convos.map((c) => c.id);
      await safeDelete("support_messages", "conversation_id", convoIds, "in");
      await safeDelete("support_conversations", "user_id", userId);
    }

    // 6. Surveys
    await safeDelete("survey_responses", "user_id", userId);
    await safeDelete("pending_surveys", "user_id", userId);

    // 7. Sites
    await safeDelete("sites", "user_id", userId);

    // 8. User roles
    await safeDelete("user_roles", "user_id", userId);

    // 9. Profile
    await safeDelete("profiles", "user_id", userId);

    // 10. Avatar from storage
    try {
      const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
      if (avatarFiles?.length) {
        const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from("avatars").remove(paths);
      }
    } catch (e) {
      errors.push(`avatars: ${e instanceof Error ? e.message : "Unknown error"}`);
    }

    // Log any partial deletion errors
    if (errors.length > 0) {
      console.error(`Partial deletion errors for user ${userId}:`, errors);
    }

    // 11. Delete auth user (always attempt even if some data deletes failed)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Error deleting auth account",
          partialErrors: errors,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        warnings: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
