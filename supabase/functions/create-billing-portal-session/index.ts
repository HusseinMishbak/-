import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://husseinmishbak.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "login_required", message: "سجّل الدخول أولاً." }, 401);
  const secret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const site = (Deno.env.get("PUBLIC_SITE_URL") || "https://husseinmishbak.github.io/-/").replace(/\/$/, "");
  if (!secret || !service || !anon) return json({ error: "billing_not_configured", message: "لم تُفعّل إدارة الاشتراكات بعد." }, 503);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json({ error: "invalid_session", message: "سجّل الدخول مجدداً." }, 401);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: billing } = await admin.from("billing_subscriptions")
    .select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!billing?.stripe_customer_id) return json({ error: "no_customer", message: "لا يوجد حساب دفع مرتبط بهذا المستخدم بعد." }, 404);
  try {
    const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: site + "/?billing=portal-return#account",
    });
    return json({ url: session.url });
  } catch (e) {
    console.error("billing portal failed", e);
    return json({ error: "portal_failed", message: "تعذر فتح إدارة الاشتراك حالياً." }, 502);
  }
});
