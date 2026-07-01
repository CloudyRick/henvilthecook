"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "./AuthModal";

export function CheckoutButton({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  useEffect(() => {
    const supabase = createClient();

    // Check session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleCheckout() {
    if (!loggedIn) {
      setAuthOpen(true);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        id="unlock-btn"
        onClick={handleCheckout}
        disabled={loading}
        className="btn-primary rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Unlock Full Content"}
      </button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} redirectToCheckout />
    </>
  );
}

export function DownloadButton() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    const res = await fetch("/api/download");
    const data = await res.json();

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert(data.error || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn-outline rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-50"
    >
      {loading ? "Preparing..." : "Download PDF"}
    </button>
  );
}

export function SignOutButton() {
  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <button
      onClick={handleSignOut}
      className="link-muted text-sm"
    >
      Sign Out
    </button>
  );
}
