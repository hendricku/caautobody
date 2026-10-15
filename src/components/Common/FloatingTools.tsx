"use client";
import Icon from "@/components/UI/Icon";

export default function FloatingTools() {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: document.title, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
  };
  return (
    <div className="floating-tools" aria-label="Quick actions">
      <a href="tel:+61397727411" aria-label="Call CA Autobody"><span>Call</span><Icon name="phone" /></a>
      <a href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196" target="_blank" rel="noreferrer" aria-label="Open location"><span>Location</span><Icon name="location" /></a>
      <button type="button" onClick={share} aria-label="Share page"><span>Share</span><Icon name="share" /></button>
    </div>
  );
}
