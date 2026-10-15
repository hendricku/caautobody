"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { LocationContent } from "@/types/content";
import ActionIcon from "@/components/UI/ActionIcon";

const WORKSHOP = {
  name: "CA Autobody",
  coordinates: [-38.0371529, 145.1377818] as [number, number],
  description: "7 Ashley Park Drive, Chelsea Heights VIC 3196"
};

interface ServiceAreaMapProps {
  locations: LocationContent[];
  variant?: "directory" | "single-area";
}

export default function ServiceAreaMap({ locations, variant = "directory" }: ServiceAreaMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">("loading");

  const allCoordinates = useMemo(() => [...locations.map(({ coordinates }) => coordinates), WORKSHOP.coordinates], [locations]);
  const selectedArea = locations.find(({ slug }) => slug === selectedSlug) ?? null;

  useEffect(() => {
    let active = true;

    const initialiseMap = async () => {
      if (!mapElementRef.current || mapRef.current) return;

      try {
        const L = await import("leaflet");
        if (!active || !mapElementRef.current) return;

        const map = L.map(mapElementRef.current, {
          attributionControl: true,
          scrollWheelZoom: false,
          zoomControl: false
        });
        mapRef.current = map;
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const iconFor = (kind: "area" | "workshop") => L.divIcon({
          className: "service-area-map__leaflet-icon",
          html: `<span class="service-area-map__pin service-area-map__pin--${kind}" aria-hidden="true"></span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          tooltipAnchor: [0, -14]
        });

        locations.forEach((location) => {
          const marker = L.marker(location.coordinates, {
            icon: iconFor("area"),
            title: `${location.name} service area`,
            keyboard: true
          })
            .addTo(map)
            .bindTooltip(location.name, { direction: "top", offset: [0, -10] })
            .on("click", () => {
              setSelectedSlug(location.slug);
              const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              map.flyTo(location.coordinates, 13, { animate: !reducedMotion, duration: reducedMotion ? 0 : 0.55 });
            });
          markersRef.current.set(location.slug, marker);
        });

        L.marker(WORKSHOP.coordinates, {
          icon: iconFor("workshop"),
          title: "CA Autobody workshop",
          keyboard: true
        })
          .addTo(map)
          .bindTooltip("CA Autobody workshop", { direction: "top", offset: [0, -10] });

        map.fitBounds(allCoordinates, { padding: [48, 48], maxZoom: 12 });
        setMapState("ready");
      } catch {
        if (active) setMapState("unavailable");
      }
    };

    void initialiseMap();
    return () => {
      active = false;
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [allCoordinates, locations]);

  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const pin = marker.getElement()?.querySelector(".service-area-map__pin");
      const emphasised = slug === selectedSlug || slug === hoveredSlug;
      pin?.classList.toggle("is-active", emphasised);
      if (slug === hoveredSlug) marker.openTooltip();
      if (!hoveredSlug) marker.closeTooltip();
    });
  }, [hoveredSlug, selectedSlug]);

  const focusArea = useCallback((slug: string | null) => {
    setSelectedSlug(slug);
    setHoveredSlug(null);

    const map = mapRef.current;
    if (!map) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (slug) {
      const area = locations.find((location) => location.slug === slug);
      if (area) map.flyTo(area.coordinates, 13, { animate: !reducedMotion, duration: reducedMotion ? 0 : 0.55 });
      return;
    }
    map.fitBounds(allCoordinates, { padding: [48, 48], maxZoom: 12, animate: !reducedMotion });
  }, [allCoordinates, locations]);

  return (
    <section className="service-area-map-section" id="service-map" aria-labelledby="service-area-map-title">
      <div className={`hp-shell service-area-map ${variant === "single-area" ? "service-area-map--single" : ""}`}>
        <div className="service-area-map__directory">
          <p className="hp-eyebrow">{variant === "single-area" ? "Your local repair route" : "Find your suburb"}</p>
          <h2 id="service-area-map-title">{variant === "single-area" ? `${locations[0]?.name ?? "Local"} support, centred on Chelsea Heights.` : "Local support, centred on Chelsea Heights."}</h2>
          <p className="service-area-map__intro">{variant === "single-area" ? "See your area in relation to the CA Autobody workshop, then get directions when you are ready to visit." : "Select an area to see where it sits in relation to our workshop, then visit its local service page for more detail."}</p>

          {variant === "directory" ? <button
            className={`service-area-map__all ${selectedSlug === null ? "is-active" : ""}`}
            type="button"
            onClick={() => focusArea(null)}
            onMouseEnter={() => setHoveredSlug(null)}
            aria-pressed={selectedSlug === null}
          >
            <span>All service areas</span><b>{locations.length}</b>
          </button> : null}

          <ul className="service-area-map__areas" aria-label="Areas we serve">
            {locations.map((location) => (
              <li key={location.slug}>
                <button
                  className={selectedSlug === location.slug ? "is-active" : ""}
                  type="button"
                  onClick={() => focusArea(location.slug)}
                  onMouseEnter={() => setHoveredSlug(location.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  onFocus={() => setHoveredSlug(location.slug)}
                  onBlur={() => setHoveredSlug(null)}
                  aria-pressed={selectedSlug === location.slug}
                >
                  <span>{location.name}</span><ActionIcon />
                </button>
              </li>
            ))}
          </ul>

          <div className="service-area-map__selection" aria-live="polite">
            {selectedArea ? (
              <>
                <span>Selected area</span>
                <strong>{selectedArea.name}</strong>
                <p>{selectedArea.mapDescription}</p>
                <Link href={`/areas-we-serve/${selectedArea.slug}`}>View {selectedArea.name} repair support <ActionIcon /></Link>
              </>
            ) : (
              <>
                <span>Our workshop</span>
                <strong>CA Autobody</strong>
                <p>{WORKSHOP.description}</p>
              </>
            )}
          </div>
        </div>

        <div className="service-area-map__map-panel">
          <div className="service-area-map__map" ref={mapElementRef} aria-label="Map of CA Autobody service areas" />
          <div className="service-area-map__legend" aria-hidden="true">
            <span><i className="service-area-map__legend-pin service-area-map__legend-pin--workshop" />Workshop</span>
            <span><i className="service-area-map__legend-pin" />Service area</span>
          </div>
          {mapState === "unavailable" ? (
            <div className="service-area-map__fallback">
              <p>The interactive map could not load.</p>
              <a href="https://www.google.com/maps/search/?api=1&query=CA+Autobody+Chelsea+Heights" target="_blank" rel="noopener noreferrer">Open CA Autobody in Google Maps <ActionIcon external /></a>
            </div>
          ) : null}
          <a className="service-area-map__directions" href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196" target="_blank" rel="noopener noreferrer">Get directions <ActionIcon external /></a>
        </div>
      </div>
    </section>
  );
}
