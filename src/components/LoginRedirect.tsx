"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log("[LoginRedirect] all cookies:", document.cookie);
    const hasPendingCheckout = document.cookie.includes("pending_checkout=1");
    console.log("[LoginRedirect] hasPendingCheckout:", hasPendingCheckout);
    if (!hasPendingCheckout) return;

    document.cookie = "pending_checkout=; max-age=0; path=/";

    async function goToCheckout() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[LoginRedirect] session:", !!session);
      if (!session) return;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      console.log("[LoginRedirect] checkout response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        router.refresh();
      }
    }

    goToCheckout();
  }, [router]);

  return null;
}
