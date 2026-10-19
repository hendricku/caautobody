"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/UI/Icon";

export default function QuickActions() {
  const [copied, setCopied] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const footer = document.querySelector(".hp-footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // A cancelled native share is not an error that needs UI noise.
    }
  };

  return (
    <>
      <a
        className={`hp-google-rating-float ${footerVisible ? "is-footer-visible" : ""}`}
        href="https://admin.trustindex.io/api/googleReview?place-id=ChIJ5xaw2aoS1moRDU4kUHImdPg"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Read CA Autobody's 4.9 star Google rating from more than 350 five-star reviews"
      >
        <svg className="hp-google-rating-float__mark" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.86-6.86C35.9 2.36 30.5 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.56 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.5 24.55c0-1.57-.14-3.08-.4-4.55H24v8.61h12.66c-.55 2.92-2.19 5.4-4.68 7.07l7.56 5.87C43.96 37.48 46.5 31.53 46.5 24.55Z" />
          <path fill="#FBBC05" d="M10.54 28.58A14.43 14.43 0 0 1 9.77 24c0-1.59.27-3.13.77-4.58l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.86.92 7.52 2.56 10.78l7.98-6.2Z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.95-2.15 15.94-5.85l-7.56-5.87c-2.1 1.41-4.78 2.25-8.38 2.25-6.26 0-11.57-4.06-13.46-9.95l-7.98 6.2C6.51 42.62 14.62 48 24 48Z" />
        </svg>
        <span className="hp-google-rating-float__copy">
          <b>350+ five-star reviews</b>
          <span className="hp-google-rating-float__metric"><strong>4.9</strong><span className="hp-google-rating-float__stars" aria-hidden="true">★★★★★</span></span>
        </span>
      </a>
      <aside className={`hp-utility-rail ${footerVisible ? "is-footer-visible" : ""}`} aria-label="Quick actions">
        <a href="tel:+61397727411" aria-label="Call CA Autobody">
          <Icon name="phone" />
          <span>03 9772 7411</span>
        </a>
        <a href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196" target="_blank" rel="noopener noreferrer" aria-label="Open CA Autobody location in Google Maps">
          <Icon name="location" />
          <span>Location</span>
        </a>
        <div className="hp-utility-share">
          <button type="button" aria-label="Open sharing options" aria-expanded={shareOpen} onClick={() => setShareOpen((open) => !open)} onFocus={() => setShareOpen(true)}>
            <Icon name="share" />
            <span>Share</span>
          </button>
          <div className={`hp-utility-socials ${shareOpen ? "is-open" : ""}`} aria-label="Share and social links">
            <a href="https://www.facebook.com/CA-Chelsea-AutoBody-105411534900916/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Facebook"><Icon name="facebook" /></a>
            <a href="https://www.instagram.com/chelseaautobody/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Instagram"><Icon name="instagram" /></a>
            <button type="button" onClick={copyLink} aria-label="Copy page link"><Icon name="copy" /></button>
          </div>
        </div>
      </aside>
      <div className={`hp-toast ${copied ? "is-visible" : ""}`} role="status" aria-live="polite">Page link copied.</div>
    </>
  );
}
