"use client";

import { useState } from "react";
import AuthModal from "./AuthModal";

export function CheckoutButton({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  async function handleCheckout() {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
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
