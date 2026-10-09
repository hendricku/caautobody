"use client";

import { useEffect, useState } from "react";

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
        aria-label="Read CA Autobody's 4.9 star Google rating"
      >
        <svg className="hp-google-rating-float__mark" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.86-6.86C35.9 2.36 30.5 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.56 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.5 24.55c0-1.57-.14-3.08-.4-4.55H24v8.61h12.66c-.55 2.92-2.19 5.4-4.68 7.07l7.56 5.87C43.96 37.48 46.5 31.53 46.5 24.55Z" />
          <path fill="#FBBC05" d="M10.54 28.58A14.43 14.43 0 0 1 9.77 24c0-1.59.27-3.13.77-4.58l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.86.92 7.52 2.56 10.78l7.98-6.2Z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.95-2.15 15.94-5.85l-7.56-5.87c-2.1 1.41-4.78 2.25-8.38 2.25-6.26 0-11.57-4.06-13.46-9.95l-7.98 6.2C6.51 42.62 14.62 48 24 48Z" />
        </svg>
        <span className="hp-google-rating-float__copy"><b>Google rating</b><strong>4.9</strong></span>
        <span className="hp-google-rating-float__stars" aria-hidden="true">★★★★★</span>
      </a>
      <aside className={`hp-utility-rail ${footerVisible ? "is-footer-visible" : ""}`} aria-label="Quick actions">
        <a href="tel:+61397727411" aria-label="Call CA Autobody">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 2.7 10 6l-2.1 2.1c1.1 2.3 2.9 4.1 5.2 5.2l2.1-2.1 3.3 3.3-1.7 2.5c-.5.8-1.5 1.2-2.4 1C8.6 17 4 12.4 3 6.6c-.2-.9.2-1.9 1-2.4l2.7-1.5Z" /></svg>
          <span>03 9772 7411</span>
        </a>
        <a href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196" target="_blank" rel="noopener noreferrer" aria-label="Open CA Autobody location in Google Maps">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.6 6-11A6 6 0 1 0 6 10c0 5.4 6 11 6 11Zm0-8.5A2.5 2.5 0 1 1 12 7a2.5 2.5 0 0 1 0 5.5Z" /></svg>
          <span>Location</span>
        </a>
        <div className="hp-utility-share">
          <button type="button" aria-label="Open sharing options" aria-expanded={shareOpen} onClick={() => setShareOpen((open) => !open)} onFocus={() => setShareOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.6a3.2 3.2 0 0 0 0-3.2l6.7-3.6A3 3 0 1 0 15 5c0 .2 0 .4.1.6L8.4 9.2a3 3 0 1 0 0 5.6l6.7 3.6c0 .2-.1.4-.1.6a3 3 0 1 0 3-3Z" /></svg>
            <span>Share</span>
          </button>
          <div className={`hp-utility-socials ${shareOpen ? "is-open" : ""}`} aria-label="Share and social links">
            <a href="https://www.facebook.com/CA-Chelsea-AutoBody-105411534900916/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1V7.95c0-.9.25-1.5 1.57-1.5h1.68V3.68c-.3-.04-1.3-.12-2.47-.12-2.45 0-4.12 1.5-4.12 4.24v2.1H7.63V13h2.75v8h3.32Z" /></svg></a>
            <a href="https://www.instagram.com/chelseaautobody/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 2.75h9.6a4.45 4.45 0 0 1 4.45 4.45v9.6a4.45 4.45 0 0 1-4.45 4.45H7.2a4.45 4.45 0 0 1-4.45-4.45V7.2A4.45 4.45 0 0 1 7.2 2.75Zm0 1.9A2.55 2.55 0 0 0 4.65 7.2v9.6a2.55 2.55 0 0 0 2.55 2.55h9.6a2.55 2.55 0 0 0 2.55-2.55V7.2a2.55 2.55 0 0 0-2.55-2.55H7.2Zm9.96 1.42a1.14 1.14 0 1 1 0 2.28 1.14 1.14 0 0 1 0-2.28ZM12 7.42A4.58 4.58 0 1 1 7.42 12 4.58 4.58 0 0 1 12 7.42Zm0 1.9A2.68 2.68 0 1 0 14.68 12 2.68 2.68 0 0 0 12 9.32Z" /></svg></a>
            <button type="button" onClick={copyLink} aria-label="Copy page link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 13.8 8.55 15.45a3.1 3.1 0 1 1-4.38-4.38l3.24-3.24a3.1 3.1 0 0 1 4.38 0" /><path d="m13.8 10.2 1.65-1.65a3.1 3.1 0 1 1 4.38 4.38l-3.24 3.24a3.1 3.1 0 0 1-4.38 0" /><path d="m8.8 15.2 6.4-6.4" /></svg></button>
          </div>
        </div>
      </aside>
      <div className={`hp-toast ${copied ? "is-visible" : ""}`} role="status" aria-live="polite">Page link copied.</div>
    </>
  );
}
