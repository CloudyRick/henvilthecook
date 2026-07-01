"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginRedirect() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem("pending_checkout");
    if (!pending) return;

    localStorage.removeItem("pending_checkout");
    setRedirecting(true);

    async function goToCheckout() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRedirecting(false);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
        router.refresh();
      }
    }

    goToCheckout();
  }, [router]);

  if (!redirecting) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <svg
        className="h-8 w-8 animate-spin"
        style={{ color: "var(--accent)" }}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        Taking you to checkout…
      </p>
    </div>
  );
}
