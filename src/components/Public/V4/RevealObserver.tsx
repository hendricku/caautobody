"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("hp-reveal-ready");

    let observer: IntersectionObserver | null = null;
    let frame = 0;
    let fallbackTimer = 0;

    const reveal = () => {
      const elements = [...document.querySelectorAll<HTMLElement>(".hp-reveal")];
      if (!elements.length) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!("IntersectionObserver" in window) || reducedMotion) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
      );

      elements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        observer?.observe(element);
      });

      // Animation must never be allowed to hide real page content. Some mobile
      // browsers can defer IntersectionObserver callbacks during a long-page
      // capture or a quick restored scroll position, so reveal anything left
      // pending after the initial paint.
      fallbackTimer = window.setTimeout(() => {
        elements.forEach((element) => {
          element.classList.add("is-visible");
          observer?.unobserve(element);
        });
      }, 900);
    };

    // Next.js client navigation can replace the page while the shared chrome stays mounted.
    // Re-scan after every route change so new sections never remain stuck at opacity: 0.
    frame = window.requestAnimationFrame(reveal);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallbackTimer);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
