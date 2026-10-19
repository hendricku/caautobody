"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { media } from "@/lib/media";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ActionIcon from "@/components/UI/ActionIcon";

const items = [
  { label: "Tesla Repair", kicker: "01 / Tesla", title: "Tesla Repair", image: media.heroPanels.tesla, copy: "Specialist accident repair support for Tesla vehicles, with care for modern EV construction, finish and approved repair requirements.", href: "/services/tesla-approved-repair-centre", cta: "Explore Tesla Repair" },
  { label: "Zeekr Repair", kicker: "02 / Zeekr", title: "Zeekr Repair", image: media.heroPanels.zeekr, copy: "Approved repair support for Zeekr vehicles, with careful assessment, accurate colour matching and modern EV repair procedures.", href: "/services/services-zeekr-approved-repairer-melbourne", cta: "Explore Zeekr Repair" },
  { label: "BYD Repair", kicker: "03 / BYD", title: "BYD Repair", image: media.brandRepair.bydHero, copy: "Approved repair support for BYD vehicles, with EV-aware assessment, genuine parts planning and manufacturer-aligned procedures.", href: "/services/byd-approved-repairer-melbourne", cta: "Explore BYD Repair" },
  { label: "Lexus Repair", kicker: "04 / Lexus", title: "Lexus Repair", image: media.brandRepair.lexusHero, copy: "Approved Lexus collision repair with careful body accuracy, refinishing and genuine parts planning.", href: "/services/lexus-approved-body-shop-melbourne", cta: "Explore Lexus Repair" },
  { label: "Prestige Brands", kicker: "05 / Approved Expertise", title: "Prestige Brands", image: media.workshop.exteriorWide, copy: "Approved repair support for Tesla, Zeekr, BYD and Lexus vehicles, with care for modern construction and finish quality.", href: "/services", cta: "All Services" },
  { label: "Panel Beating", kicker: "06 / Body Repair", title: "Panel Beating", image: media.service.panelBeating, copy: "Precision panel restoration for cosmetic damage through to more involved collision repairs.", href: "/services/panel-beating", cta: "Explore Panel Beating" },
  { label: "Spray Painting", kicker: "07 / Refinishing", title: "Spray Painting", image: media.service.sprayPainting, copy: "Professional refinishing with careful preparation, colour matching and controlled application.", href: "/services/spray-painting", cta: "Explore Spray Painting" },
  { label: "Replacement Vehicles", kicker: "08 / Keep Moving", title: "Replacement Vehicles", image: media.service.replacementVehiclesCard, copy: "Practical mobility options to help keep your routine moving while your vehicle is being repaired.", href: "/services/replacement-vehicles", cta: "Explore Replacement Vehicles" },
  { label: "Paintless Dent Removal", kicker: "09 / Dent Repair", title: "Paintless Dent Removal", image: media.service.paintlessDent, copy: "A low-impact approach for suitable dents that helps preserve the vehicle’s existing paint finish.", href: "/services/paintless-dent-removal", cta: "Explore PDR" },
  { label: "Accident Assistance", kicker: "10 / Support", title: "Accident Assistance", image: media.service.accident, copy: "Clear support after an accident, from repair planning and towing guidance to insurer coordination.", href: "/services/accident-assistance", cta: "Explore Accident Assistance" },
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
            <span>{String(itemIndex + 1).padStart(2, "0")}</span><b>{item.label}</b><ArrowForwardRounded className="hp-service-nav__icon" aria-hidden="true" />
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
              <span>{String(itemIndex + 1).padStart(2, "0")} / {item.kicker.replace(/^\d+\s*\/\s*/, "")}</span><h3>{item.title}</h3><p>{item.copy}</p>
              <div className="hp-service-panel__actions">
                <Link className="hp-service-panel__detail" href={item.href}>{item.cta} <ActionIcon /></Link>
                <Link className="hp-service-panel__book" href="/contact">Book a repair assessment <ActionIcon /></Link>
              </div>
            </div>
          </article>
        ))}

        <div className="hp-service-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous service"><ChevronLeftRounded aria-hidden="true" /></button>
          <div className="hp-service-progress"><span style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
          <strong>{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</strong>
          <button type="button" onClick={() => move(1)} aria-label="Next service"><ChevronRightRounded aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}
