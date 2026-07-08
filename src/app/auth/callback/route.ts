import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(url: string, cookieResponse: NextResponse, extra?: Record<string, string>) {
  const redirect = NextResponse.redirect(url);
  cookieResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  if (extra) {
    Object.entries(extra).forEach(([name, value]) => {
      redirect.cookies.set(name, value, { maxAge: 60, path: "/" });
    });
  }
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
    console.log("[DEBUG auth/callback]", {
      exchangeError: error,
      cookiesToForward: cookieResponse.cookies.getAll().map((c) => ({
        name: c.name,
        sameSite: c.sameSite,
        maxAge: c.maxAge,
        path: c.path,
        secure: c.secure,
      })),
    });
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
            return redirectWithCookies(`${origin}/`, cookieResponse);
          }
          return redirectWithCookies(`${origin}/`, cookieResponse);
        }
      }
      return redirectWithCookies(`${origin}/`, cookieResponse);
    }
  }

  return NextResponse.redirect(`${origin}/?auth=error`);
}
