import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://husseinmishbak.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!["GET", "POST"].includes(req.method)) return json({ error: "method_not_allowed" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "login_required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !anon || !service) return json({ error: "service_not_configured" }, 503);

  const accessToken = auth.slice("Bearer ".length);
  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken);
  if (authError || !user) return json({ error: "invalid_session" }, 401);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("role").eq("id", user.id).maybeSingle();
  if (profileError) return json({ error: "profile_lookup_failed" }, 500);
  if (profile?.role !== "teacher") return json({ error: "teacher_only" }, 403);

  const { data: referralRows, error: referralError } = await admin.from("student_referrals")
    .select("student_id").eq("teacher_id", user.id);
  if (referralError) return json({ error: "referral_data_not_ready" }, 503);
  const studentIds = (referralRows || []).map((row: { student_id: string }) => row.student_id);
  if (!studentIds.length) {
    return json({ total_referrals: 0, active_paid_subscribers: 0, past_due_subscribers: 0 });
  }

  const counts: Record<string, number> = { active_paid_subscribers: 0, past_due_subscribers: 0 };
  for (let offset = 0; offset < studentIds.length; offset += 500) {
    const batch = studentIds.slice(offset, offset + 500);
    const { data: subscriptions, error } = await admin.from("billing_subscriptions")
      .select("user_id,status").in("user_id", batch);
    if (error) return json({ error: "billing_data_not_ready" }, 503);
    for (const sub of subscriptions || []) {
      if (sub.status === "active" || sub.status === "trialing") counts.active_paid_subscribers += 1;
      if (sub.status === "past_due") counts.past_due_subscribers += 1;
    }
  }

  return json({
    total_referrals: studentIds.length,
    active_paid_subscribers: counts.active_paid_subscribers,
    past_due_subscribers: counts.past_due_subscribers,
  });
});
