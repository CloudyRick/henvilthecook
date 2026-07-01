"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Toast from "./Toast";

export default function LoginRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  const loggedin = params.get("loggedin");
  const next = params.get("next");

  useEffect(() => {
    if (!loggedin) return;

    // Force server components to re-fetch session so logged-in state shows without manual refresh
    router.refresh();

    if (next) {
      const timer = setTimeout(() => {
        window.location.href = next;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loggedin, next, router]);

  if (!loggedin) return null;

  return <Toast message={next ? "You're signed in! Taking you to checkout…" : "Welcome! You're now signed in."} />;
}
