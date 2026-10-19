import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const signature = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  if (!signature || !secret || !signingSecret || !service || !url) {
    return json({ error: "webhook_not_configured" }, 500);
  }

  const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(), signature, signingSecret, undefined, Stripe.createSubtleCryptoProvider()
    );
  } catch (e) {
    console.warn("Stripe webhook signature rejected", e);
    return json({ error: "invalid_signature" }, 400);
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: seen } = await admin.from("billing_events")
    .select("stripe_event_id").eq("stripe_event_id", event.id).maybeSingle();
  if (seen) return json({ received: true, duplicate: true });

  async function upsertSubscription(sub: Stripe.Subscription, fallbackUserId?: string) {
    const userId = sub.metadata?.app_user_id || fallbackUserId;
    if (!userId) throw new Error("No app_user_id in Stripe subscription metadata");

    // A deleted URFRE account must never be recreated by a late webhook.
    // If an orphaned active subscription exists (for example, the user deleted
    // their account while Checkout was still open), cancel it and acknowledge
    // the webhook rather than retrying forever or continuing to bill the user.
    const { data: userProfile, error: profileLookupError } = await admin
      .from("profiles").select("id").eq("id", userId).maybeSingle();
    if (profileLookupError) throw profileLookupError;
    if (!userProfile) {
      if (!["canceled", "incomplete_expired"].includes(sub.status)) {
        await stripe.subscriptions.cancel(sub.id);
      }
      return;
    }

    const firstItem = sub.items.data[0];
    const row = {
      user_id: userId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      plan_key: sub.metadata?.plan_key || null,
      price_id: firstItem?.price?.id || null,
      status: sub.status,
      current_period_end: firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("billing_subscriptions").upsert(row, { onConflict: "user_id" });
    if (error) throw error;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscription(sub, session.metadata?.app_user_id || session.client_reference_id || undefined);
        const { error } = await admin.from("billing_subscriptions")
          .update({ stripe_checkout_session_id: session.id }).eq("stripe_subscription_id", subscriptionId);
        if (error) throw error;
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub);
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const { error } = await admin.from("billing_subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId).in("status", ["active", "trialing"]);
        if (error) throw error;
      }
    }
    const { error: eventError } = await admin.from("billing_events").insert({
      stripe_event_id: event.id, event_type: event.type
    });
    if (eventError && eventError.code !== "23505") throw eventError;
    return json({ received: true });
  } catch (e) {
    console.error("Stripe webhook processing failed", { id: event.id, type: event.type, error: String(e) });
    return json({ error: "webhook_processing_failed" }, 500);
  }
});
