"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Download } from "@/types/database";

export default function DownloadsList({
  downloads,
  hasPaid,
}: {
  downloads: Download[];
  hasPaid: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  if (downloads.length === 0) return null;

  async function handleDownload(id: string) {
    setLoading(id);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`/api/download-file?id=${id}`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    });
    const data = await res.json();

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert(data.error || "Something went wrong");
    }
    setLoading(null);
  }

  function handleLocked() {
    const btn = document.getElementById("unlock-btn");
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      btn.classList.add("animate-pulse");
      setTimeout(() => btn.classList.remove("animate-pulse"), 1500);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12">
      <h3
        className="mb-4 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        Downloads
      </h3>
      <div className="flex flex-col gap-3">
        {downloads.map((dl) =>
          hasPaid ? (
            <button
              key={dl.id}
              onClick={() => handleDownload(dl.id)}
              disabled={loading === dl.id}
              className="btn-outline flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium disabled:opacity-50"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              {loading === dl.id ? "Preparing…" : dl.label}
            </button>
          ) : (
            <button
              key={dl.id}
              onClick={handleLocked}
              className="flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              {dl.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
