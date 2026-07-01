"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  const checkout = params.get("checkout");

  useEffect(() => {
    console.log("[LoginRedirect] checkout param:", checkout);
    if (!checkout) return;

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
  }, [checkout, router]);

  return null;
}
