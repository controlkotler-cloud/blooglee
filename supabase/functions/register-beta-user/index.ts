import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

function getInvitationIdFromMetadata(userMetadata: unknown): string | null {
  if (!userMetadata || typeof userMetadata !== "object") return null;
  const maybe = (userMetadata as Record<string, unknown>).beta_invitation_id;
  return typeof maybe === "string" ? maybe : null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function rollbackInvitationReservation(
  supabaseAdmin: ReturnType<typeof createClient>,
  invitationId: string,
  previousUses: number,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("beta_invitations")
      .update({ current_uses: previousUses })
      .eq("id", invitationId)
      .eq("current_uses", previousUses + 1);
    if (error) {
      console.error("[register-beta-user] Failed to rollback invitation reservation:", error.message);
    } else {
      console.log("[register-beta-user] Invitation reservation rolled back");
    }
  } catch (error) {
    console.error("[register-beta-user] Exception during invitation rollback:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("[register-beta-user] Missing Supabase environment variables");
      return jsonResponse({ error: "server_not_configured" }, 500);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const invitationId = typeof body.invitation_id === "string" ? body.invitation_id : null;
    const bodyUserId = typeof body.user_id === "string" ? body.user_id : null;
    if (!isValidUuid(invitationId)) {
      return jsonResponse({ error: "invitation_id must be a valid UUID" }, 400);
    }
    if (bodyUserId && !isValidUuid(bodyUserId)) {
      return jsonResponse({ error: "user_id must be a valid UUID" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "authentication_required" }, 401);
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !authUser) {
      return jsonResponse({ error: "invalid_auth_token" }, 401);
    }
    const authenticatedUserId = authUser.id;

    const targetUserId = authenticatedUserId;
    if (bodyUserId && bodyUserId !== authenticatedUserId) {
      return jsonResponse({ error: "user_id does not match authenticated user" }, 403);
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify target user exists and is tied to the same invitation in metadata.
    const { data: targetAuthData, error: targetAuthError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (targetAuthError || !targetAuthData?.user) {
      console.error("[register-beta-user] User lookup failed:", targetAuthError?.message);
      return jsonResponse({ error: "user_not_found" }, 404);
    }

    const metadataInvitationId = getInvitationIdFromMetadata(targetAuthData.user.user_metadata);
    if (metadataInvitationId !== invitationId) {
      return jsonResponse({ error: "invitation_mismatch_for_user" }, 403);
    }

    // Validate invitation state on server side.
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("beta_invitations")
      .select("id, is_active, expires_at, max_uses, current_uses")
      .eq("id", invitationId)
      .maybeSingle();
    if (invitationError || !invitation) {
      return jsonResponse({ error: "invitation_not_found" }, 404);
    }
    if (!invitation.is_active) {
      return jsonResponse({ error: "invitation_inactive" }, 409);
    }
    if (isExpired(invitation.expires_at)) {
      return jsonResponse({ error: "invitation_expired" }, 409);
    }
    if (invitation.current_uses >= invitation.max_uses) {
      return jsonResponse({ error: "invitation_usage_limit_reached" }, 409);
    }

    // Fetch profile with retries because profile trigger may lag right after signup.
    let profile: { is_beta: boolean | null; beta_invitation_id: string | null; beta_expires_at: string | null } | null =
      null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("is_beta, beta_invitation_id, beta_expires_at")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) {
        console.error("[register-beta-user] Error loading profile:", error.message);
        return jsonResponse({ error: "failed_to_load_profile", details: error.message }, 500);
      }

      if (data) {
        profile = data;
        break;
      }

      await sleep(250);
    }

    if (!profile) {
      return jsonResponse({ error: "profile_not_ready_try_again" }, 409);
    }

    // Idempotency: if this exact beta registration already happened, return success without consuming another slot.
    if (profile.is_beta && profile.beta_invitation_id === invitationId) {
      return jsonResponse({
        success: true,
        message: "Beta user already registered",
        beta_expires_at: profile.beta_expires_at,
        already_registered: true,
      });
    }

    if (profile.is_beta && profile.beta_invitation_id && profile.beta_invitation_id !== invitationId) {
      return jsonResponse({ error: "user_already_registered_with_another_invitation" }, 409);
    }

    // Calculate beta dates
    const betaStartedAt = new Date();
    const betaExpiresAt = new Date();
    betaExpiresAt.setMonth(betaExpiresAt.getMonth() + 3);

    console.log(`[register-beta-user] Registering beta user: ${targetUserId} with invitation: ${invitationId}`);

    // Reserve invitation usage with optimistic concurrency control.
    const nextUses = invitation.current_uses + 1;
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("beta_invitations")
      .update({ current_uses: nextUses })
      .eq("id", invitationId)
      .eq("current_uses", invitation.current_uses)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .select("id")
      .maybeSingle();

    if (reservationError) {
      console.error("[register-beta-user] Error reserving invitation usage:", reservationError.message);
      return jsonResponse({ error: "failed_to_reserve_invitation", details: reservationError.message }, 500);
    }

    if (!reservation) {
      return jsonResponse({ error: "invitation_no_longer_available" }, 409);
    }

    // 1. Update profile with beta information
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_beta: true,
        beta_started_at: betaStartedAt.toISOString(),
        beta_expires_at: betaExpiresAt.toISOString(),
        beta_invitation_id: invitationId,
        plan: "starter",
        sites_limit: 1,
        posts_limit: 4,
      })
      .eq("user_id", targetUserId)
      .select("user_id")
      .maybeSingle();

    if (profileError || !updatedProfile) {
      console.error("[register-beta-user] Error updating profile:", profileError?.message || "profile not found");
      await rollbackInvitationReservation(supabaseAdmin, invitationId, invitation.current_uses);
      return jsonResponse({ error: "failed_to_update_profile", details: profileError?.message }, 500);
    }

    console.log("[register-beta-user] Profile updated successfully");

    // 2. Add beta role (upsert to avoid duplicates)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: targetUserId, role: "beta" }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("[register-beta-user] Error adding beta role:", roleError.message);
      // Keep success response: profile and invitation usage are already consistent.
    } else {
      console.log("[register-beta-user] Beta role added successfully");
    }

    return jsonResponse({
      success: true,
      message: "Beta user registered successfully",
      beta_expires_at: betaExpiresAt.toISOString(),
      role_assigned: !roleError,
    });
  } catch (error: unknown) {
    console.error("[register-beta-user] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: "internal_server_error", details: errorMessage }, 500);
  }
});
