"use client";

import { useState } from "react";
import type { ContentSection } from "@/types/database";

export default function ContentViewer({
  sections,
  hasPaid,
}: {
  sections: ContentSection[];
  hasPaid: boolean;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div id="chapters">
      {sections.map((section, index) => {
        const isLocked = !section.is_free_preview && !hasPaid;
        const isOpen = openIds.has(section.id);
        const chapterNum = String(index + 1).padStart(2, "0");

        return (
          <div
            key={section.id}
            className="row-hover"
            style={{
              borderTop: "1px solid var(--border)",
              ...(index === sections.length - 1
                ? { borderBottom: "1px solid var(--border)" }
                : {}),
            }}
          >
            <button
              onClick={() => !isLocked && toggle(section.id)}
              className="flex w-full items-center gap-8 px-0 py-6 text-left md:py-8"
              style={{ cursor: isLocked ? "default" : "pointer" }}
            >
              <span
                className="w-12 shrink-0 text-sm font-medium tabular-nums"
                style={{ color: "var(--text-muted)" }}
              >
                {chapterNum}
              </span>

              <div className="min-w-0 flex-1">
                <h3
                  className="text-lg font-semibold md:text-xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {section.title}
                  {section.teaser && !isOpen && (
                    <span
                      className="ml-3 text-sm font-normal md:text-base"
                      style={{ color: "var(--text-muted)" }}
                    >
                      — {section.teaser}
                    </span>
                  )}
                </h3>
              </div>

              {isLocked ? (
                <span
                  className="flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Members
                </span>
              ) : (
                <svg
                  className="h-5 w-5 shrink-0 transition-transform duration-200"
                  style={{
                    color: "var(--accent)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
            </button>

            {isOpen && !isLocked && (
              <div className="pb-6 pl-20 pr-4">
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed md:text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {section.body}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
