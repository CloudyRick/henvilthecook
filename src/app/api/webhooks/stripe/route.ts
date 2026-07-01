import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Only grant access for paid sessions (async payment methods may be unpaid initially)
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      return NextResponse.json({ error: "No user_id" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Idempotency: skip if this session was already processed
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    await supabase
      .from("profiles")
      .update({
        has_paid: true,
        stripe_customer_id: session.customer as string,
        stripe_payment_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await supabase.from("purchases").insert({
      user_id: userId,
      stripe_session_id: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "aud",
      status: "completed",
    });
  }

  return NextResponse.json({ received: true });
}
