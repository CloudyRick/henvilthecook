"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Testimonial } from "@/types/database";

export default function TestimonialSlideshow({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const autoScrollRef = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInteracted = useRef(false);
  const hasDragged = useRef(false);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) return;
    autoScrollRef.current = window.requestAnimationFrame(function tick() {
      const track = trackRef.current;
      if (!track) return;
      track.scrollLeft += 0.8;
      if (track.scrollLeft >= track.scrollWidth / 2) {
        track.scrollLeft = 0;
      }
      autoScrollRef.current = window.requestAnimationFrame(tick);
    });
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      window.cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      userInteracted.current = false;
      startAutoScroll();
    }, 3000);
  }, [startAutoScroll]);

  const handleInteractionStart = useCallback(() => {
    userInteracted.current = true;
    stopAutoScroll();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, [stopAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [startAutoScroll, stopAutoScroll]);

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    scrollStart.current = trackRef.current?.scrollLeft ?? 0;
    trackRef.current?.setPointerCapture(e.pointerId);
    handleInteractionStart();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 3) hasDragged.current = true;
    trackRef.current.scrollLeft = scrollStart.current - dx;
  }

  function onPointerUp(e: React.PointerEvent) {
    isDragging.current = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
    handleInteractionEnd();
  }

  function onSlideClick(url: string) {
    if (!hasDragged.current) {
      setSelectedUrl(url);
    }
  }

  if (!testimonials.length) return null;

  return (
    <>
      <section id="testimonials" className="pt-8">
        <div className="mx-auto max-w-[1280px] px-8 mb-6">
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--text-muted)" }}
          >
            Testimonials
          </p>
          <h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            What readers are saying
          </h2>
        </div>

        <div
          ref={trackRef}
          className="testimonial-scroll mb-24 px-8"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="testimonial-slide"
              onClick={() => onSlideClick(t.image_url)}
            >
              <img src={t.image_url} alt="Reader testimonial" draggable={false} />
            </div>
          ))}
          {testimonials.map((t) => (
            <div
              key={`dup-${t.id}`}
              className="testimonial-slide"
              onClick={() => onSlideClick(t.image_url)}
            >
              <img src={t.image_url} alt="Reader testimonial" draggable={false} />
            </div>
          ))}
        </div>
      </section>

      {selectedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: "rgba(30,30,30,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setSelectedUrl(null)}
        >
          <button
            className="absolute top-6 right-6 link-muted"
            onClick={() => setSelectedUrl(null)}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedUrl}
            alt="Reader testimonial"
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
