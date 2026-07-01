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

    router.refresh();

    if (next) {
      const timer = setTimeout(() => {
        window.location.href = next;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loggedin, next, router]);

  return null;
}
