"use client";
import Image from "next/image";

import { useCallback, useEffect, useState } from "react";

export default function InsurerLogoGrid({ insurers, className = "about-insurance__logo-grid" }: { insurers: readonly (readonly [string, string])[]; className?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const markFailed = useCallback((name: string) => {
    setFailed((current) => current.includes(name) ? current : [...current, name]);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLImageElement>("img[data-insurer-logo]").forEach((image) => {
        if (image.complete && image.naturalWidth === 0) markFailed(image.dataset.insurerLogo || "");
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [markFailed, insurers]);

  return <div className={className}>
    {insurers.map(([name, image]) => <div className={failed.includes(name) ? "is-fallback" : ""} key={name}>
      <Image src={image} alt={name} data-insurer-logo={name} onError={() => markFailed(name)}  width={640} height={320} unoptimized />
      <span>{name}</span>
    </div>)}
  </div>;
}
