"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    const pending = localStorage.getItem("pending_checkout");
    console.log("[LoginRedirect] pending_checkout:", pending);
    if (!pending) return;

    localStorage.removeItem("pending_checkout");

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
