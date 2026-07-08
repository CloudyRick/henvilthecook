import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ContentViewer from "@/components/ContentViewer";
import { CheckoutButton, DownloadButton } from "@/components/ActionButtons";
import TestimonialSlideshow from "@/components/TestimonialSlideshow";
import LoginRedirect from "@/components/LoginRedirect";
import type { ContentSection, SiteContent, Testimonial, SectionFile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let hasPaid = false;
  let isAdmin = false;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_paid, is_admin")
      .eq("id", user.id)
      .single();
    hasPaid = profile?.has_paid ?? false;
    isAdmin = profile?.is_admin ?? false;
    console.log("[DEBUG page.tsx]", {
      userId: user.id,
      userEmail: user.email,
      profile,
      profileError,
      hasPaid,
    });
  } else {
    console.log("[DEBUG page.tsx] no user", { userError });
  }

  const { data: siteContentRows } = await supabase
    .from("site_content")
    .select("*");

  const siteContent: Record<string, string> = {};
  (siteContentRows as SiteContent[] | null)?.forEach((row) => {
    siteContent[row.key] = row.value;
  });

  const { data: sections } = await supabase
    .from("content_sections")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: sectionFilesRows } = await supabase
    .from("section_files")
    .select("*")
    .order("sort_order", { ascending: true });

  const filesBySection: Record<string, SectionFile[]> = {};
  (sectionFilesRows as SectionFile[] | null)?.forEach((f) => {
    if (!filesBySection[f.section_id]) filesBySection[f.section_id] = [];
    filesBySection[f.section_id].push(f);
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Suspense fallback={null}>
        <LoginRedirect />
      </Suspense>
      <Header userEmail={user?.email ?? null} isAdmin={isAdmin} />

      <main className="mx-auto max-w-[1280px] px-8">
        {/* Hero */}
        <section className="pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="max-w-[720px]">
            <p
              className="mb-6 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: "var(--accent)" }}
            >
              {siteContent.hero_subtitle || "A Personal Guide"}
            </p>
            <h1
              className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl lg:text-[84px]"
              style={{ color: "var(--text-primary)" }}
            >
              {siteContent.hero_title || "From Kitchen to Permanent Residency"}
            </h1>
            <p
              className="max-w-[480px] text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              {siteContent.hero_description ||
                "Discover the real story of navigating the Australian immigration system as a chef. From visa applications to permanent residency — every step documented."}
            </p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="pb-16">
          <p
            className="mb-10 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--text-muted)" }}
          >
            Table of Contents
          </p>
          <ContentViewer
            sections={(sections as ContentSection[]) || []}
            filesBySection={filesBySection}
            hasPaid={hasPaid}
          />
        </section>

        {/* Membership CTA */}
        {!hasPaid && (
          <section className="py-16">
            <div
              className="flex flex-col items-center gap-6 rounded-2xl px-8 py-12 text-center md:flex-row md:justify-between md:text-left"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-4 md:gap-5">
                <svg
                  className="h-8 w-8 shrink-0"
                  style={{ color: "var(--accent)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Unlock the complete guide
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    One-time payment of{" "}
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>
                      {siteContent.price_display || "$29 AUD"}
                    </span>
                    {" "}&mdash; lifetime access to all chapters &amp; PDF download.
                  </p>
                </div>
              </div>
              <CheckoutButton isLoggedIn={!!user} />
            </div>
          </section>
        )}

        {/* Paid user download */}
        {hasPaid && (
          <section className="py-16">
            <div
              className="flex flex-col items-center gap-6 rounded-2xl px-8 py-12 text-center md:flex-row md:justify-between md:text-left"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  You have full access
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Download the complete guide as a PDF to read offline.
                </p>
              </div>
              <DownloadButton />
            </div>
          </section>
        )}

      </main>

      <TestimonialSlideshow testimonials={(testimonials as Testimonial[] | null) || []} />

    </div>
  );
}
