import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(url: string, cookieResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  cookieResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value);
  });
  return redirect;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieResponse = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next === "checkout") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("has_paid")
            .eq("id", user.id)
            .single();
          if (profile?.has_paid) {
            return redirectWithCookies(`${origin}/?loggedin=1`, cookieResponse);
          }
          const stripe = new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY!);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.email,
            client_reference_id: user.id ?? undefined,
            line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
            metadata: { user_id: user.id },
            success_url: `${origin}/?payment=success`,
            cancel_url: `${origin}/`,
          });
          if (session.url) {
            const dest = `${origin}/?loggedin=1&next=${encodeURIComponent(session.url)}`;
            return redirectWithCookies(dest, cookieResponse);
          }
        }
        return redirectWithCookies(`${origin}/?loggedin=1`, cookieResponse);
      }
      return redirectWithCookies(`${origin}/?loggedin=1`, cookieResponse);
    }
  }

  return NextResponse.redirect(`${origin}/?auth=error`);
}
