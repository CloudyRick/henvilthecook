"use client";

import { useState } from "react";
import AuthModal from "./AuthModal";
import { SignOutButton } from "./ActionButtons";

export default function Header({
  userEmail,
  isAdmin = false,
}: {
  userEmail: string | null;
  isAdmin?: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <header
      className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-6"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span
        className="text-sm font-semibold uppercase tracking-[0.2em]"
        style={{ color: "var(--text-primary)" }}
      >
        Henvil the Cook
      </span>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <a href="/admin" className="link-accent text-sm font-medium">
            Dashboard
          </a>
        )}
        {userEmail ? (
          <>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{userEmail}</span>
            <SignOutButton />
          </>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="btn-primary rounded-full px-5 py-2 text-sm font-medium"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
