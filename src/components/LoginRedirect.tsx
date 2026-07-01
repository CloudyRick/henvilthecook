"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Toast from "./Toast";

export default function LoginRedirect() {
  const params = useSearchParams();
  const loggedin = params.get("loggedin");
  const next = params.get("next");

  useEffect(() => {
    if (loggedin && next) {
      const timer = setTimeout(() => {
        window.location.href = next;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loggedin, next]);

  if (!loggedin) return null;

  return <Toast message="You're signed in! Taking you to checkout…" />;
}
