"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const items = [
  { label: "Tesla Repair", kicker: "01 / Tesla", title: "Tesla Repair", image: "https://caautobody.com.au/wp-content/uploads/2024/05/tesla-repair.jpg", copy: "EV-aware collision repair, body work and refinishing for Tesla vehicles, handled with attention to modern construction and safety systems.", href: "/services/tesla-approved-repair-centre", cta: "Explore Tesla Repair" },
  { label: "Panel Beating", kicker: "02 / Body Repair", title: "Panel Beating", image: "https://caautobody.com.au/wp-content/uploads/2021/06/homepage-spray-paint.jpg", copy: "Precision panel restoration for cosmetic damage through to more involved collision repairs.", href: "/services/panel-beating", cta: "Explore Panel Beating" },
  { label: "Spray Painting", kicker: "03 / Refinishing", title: "Spray Painting", image: "https://caautobody.com.au/wp-content/uploads/2021/05/menu-img.jpg", copy: "Professional refinishing with careful preparation, colour matching and controlled application.", href: "/services/spray-painting", cta: "Explore Spray Painting" },
  { label: "Replacement Vehicles", kicker: "04 / Keep Moving", title: "Replacement Vehicles", image: "https://caautobody.com.au/wp-content/uploads/2021/06/homepage-Replacement-Vehicles.jpg", copy: "Practical mobility options to help keep your routine moving while your vehicle is being repaired.", href: "/services/replacement-vehicles", cta: "Explore Replacement Vehicles" },
  { label: "Paintless Dent Removal", kicker: "05 / Dent Repair", title: "Paintless Dent Removal", image: "https://caautobody.com.au/wp-content/uploads/2024/05/tesla-repair.jpg", copy: "A low-impact approach for suitable dents that helps preserve the vehicle’s existing paint finish.", href: "/services/paintless-dent-removal", cta: "Explore PDR" },
  { label: "Accident Assistance", kicker: "06 / Support", title: "Accident Assistance", image: "https://caautobody.com.au/wp-content/uploads/2021/05/ft-img.png", copy: "Clear support after an accident, from repair planning and towing guidance to insurer coordination.", href: "/services/accident-assistance", cta: "Explore Accident Assistance" },
] as const;

export default function ServiceExperience() {
  const [index, setIndex] = useState(0);
  const move = (delta: number) => setIndex((value) => (value + delta + items.length) % items.length);
  const pointerX = useRef<number | null>(null);

  return (
    <div
      className="hp-service-experience hp-reveal"
      tabIndex={0}
      aria-label="CA Autobody service carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      }}
    >
      <div className="hp-service-nav" role="tablist" aria-label="Repair services">
        {items.map((item, itemIndex) => (
          <button
            key={item.label}
            className={itemIndex === index ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            onClick={() => setIndex(itemIndex)}
          >
            <span>{String(itemIndex + 1).padStart(2, "0")}</span><b>{item.label}</b><i>→</i>
          </button>
        ))}
      </div>

      <div
        className="hp-service-stage"
        onPointerDown={(event) => { pointerX.current = event.clientX; }}
        onPointerUp={(event) => {
          if (pointerX.current === null) return;
          const delta = event.clientX - pointerX.current;
          pointerX.current = null;
          if (Math.abs(delta) > 55) move(delta < 0 ? 1 : -1);
        }}
      >
        {items.map((item, itemIndex) => (
          <article className={`hp-service-panel ${itemIndex === index ? "is-active" : ""}`} key={item.label}>
            <img src={item.image} alt={`${item.title} at CA Autobody`} loading="lazy" />
            <div className="hp-service-panel__overlay">
              <span>{item.kicker}</span><h3>{item.title}</h3><p>{item.copy}</p><Link href={item.href}>{item.cta} →</Link>
            </div>
          </article>
        ))}

        <div className="hp-service-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous service">←</button>
          <div className="hp-service-progress"><span style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
          <strong>{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</strong>
          <button type="button" onClick={() => move(1)} aria-label="Next service">→</button>
        </div>
      </div>
    </div>
  );
}
