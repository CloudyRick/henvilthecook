"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  const loggedin = params.get("loggedin");
  const next = params.get("next");

  useEffect(() => {
    if (!loggedin) return;

    if (next) {
      // Go straight to Stripe — no refresh needed
      window.location.href = next;
    } else {
      // Plain login — just refresh server components
      router.refresh();
    }
  }, [loggedin, next, router]);

  return null;
}
