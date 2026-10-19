import Stripe from "npm:stripe@^22";
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
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const billingEnabled = Deno.env.get("STRIPE_BILLING_ENABLED") === "true";
  const priceIds: Record<string, string> = {
    monthly: Deno.env.get("STRIPE_PRICE_MONTHLY") || "",
    annual: Deno.env.get("STRIPE_PRICE_ANNUAL") || "",
  };
  // Safe public readiness probe; reveals booleans only, never provider secrets.
  if (req.method === "GET") {
    return json({
      billing_enabled: billingEnabled && Boolean(stripeSecret),
      monthly_enabled: billingEnabled && Boolean(stripeSecret && priceIds.monthly),
      annual_enabled: billingEnabled && Boolean(stripeSecret && priceIds.annual),
    });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "login_required", message: "سجّل الدخول أولاً." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://husseinmishbak.github.io/-/").replace(/\/$/, "");
  if (!billingEnabled || !anonKey || !serviceKey || !stripeSecret) return json({ error: "billing_not_configured", message: "لم يُفعّل الدفع بعد. يلزم إكمال حماية المحتوى وإعداد مزوّد الدفع والأسعار في إعدادات الخادم." }, 503);

  const accessToken = authHeader.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !user) return json({ error: "invalid_session", message: "انتهت جلسة الدخول؛ سجّل الدخول مجدداً." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: profile } = await admin.from("profiles").select("role,referred_by_teacher_id").eq("id", user.id).maybeSingle();
  if (profile?.role === "teacher") return json({ error: "teacher_free", message: "حساب المدرّس المخوّل مجاني ولا يحتاج إلى اشتراك." }, 409);

  let body: { plan?: string; promotion_code?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const plan = body.plan === "annual" ? "annual" : body.plan === "monthly" ? "monthly" : "";
  if (!plan) return json({ error: "invalid_plan", message: "اختر خطة شهرية أو سنوية." }, 400);
  if (!priceIds[plan]) return json({ error: "price_not_configured", message: "لم يحدد مالك المنصة سعر هذه الخطة بعد." }, 503);
  const { data: existing } = await admin.from("billing_subscriptions")
    .select("stripe_customer_id,status").eq("user_id", user.id).maybeSingle();
  if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
    return json({ error: "subscription_exists", message: "لديك اشتراك قائم أو يحتاج إلى تحديث طريقة الدفع. استخدم إدارة الاشتراك." }, 409);
  }

  const stripe = new Stripe(stripeSecret, { httpClient: Stripe.createFetchHttpClient() });
  const referral = await admin.from("student_referrals").select("teacher_id,referral_code")
    .eq("student_id", user.id).maybeSingle();
  const meta = {
    app_user_id: user.id,
    plan_key: plan,
    teacher_id: referral.data?.teacher_id || profile?.referred_by_teacher_id || "",
    teacher_referral_code: referral.data?.referral_code || "",
  };

  const rawPromo = String(body.promotion_code || "").trim();
  if (rawPromo.length > 64) return json({ error: "invalid_promotion_code", message: "رمز الخصم غير صالح." }, 400);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceIds[plan], quantity: 1 }],
    client_reference_id: user.id,
    success_url: siteUrl + "/?billing=success#account",
    cancel_url: siteUrl + "/?billing=cancel#account",
    metadata: meta,
    subscription_data: { metadata: meta },
    billing_address_collection: "auto",
    allow_promotion_codes: rawPromo ? undefined : true,
    ...(existing?.stripe_customer_id ? { customer: existing.stripe_customer_id } : { customer_email: user.email || undefined }),
    ...(rawPromo ? {} : {}),
  };

  if (rawPromo) {
    const matches = await stripe.promotionCodes.list({ code: rawPromo, active: true, limit: 1 });
    const match = matches.data[0];
    if (!match) return json({ error: "invalid_promotion_code", message: "رمز الخصم غير معروف أو غير نشط." }, 400);
    params.discounts = [{ promotion_code: match.id }];
    delete params.allow_promotion_codes;
  }

  const idempotencyKey = "urfre-checkout-" + user.id + "-" + crypto.randomUUID();
  try {
    const session = await stripe.checkout.sessions.create(params, { idempotencyKey });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return json({ url: session.url });
  } catch (e) {
    console.error("checkout session failed", e);
    return json({ error: "checkout_failed", message: "تعذر إنشاء جلسة الدفع. حاول لاحقاً أو تواصل مع الدعم." }, 502);
  }
});
