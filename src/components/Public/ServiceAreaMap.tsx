"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup as LeafletLayerGroup, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { LocationContent } from "@/types/content";
import ActionIcon from "@/components/UI/ActionIcon";
import mapOnlySuburbs from "../../../caautobody_341_suburbs (1).json";

const WORKSHOP = {
  name: "CA Autobody",
  coordinates: [-38.0371529, 145.1377818] as [number, number],
  description: "7 Ashley Park Drive, Chelsea Heights VIC 3196"
};

interface ServiceAreaMapProps {
  locations: LocationContent[];
  variant?: "directory" | "single-area";
}

interface MapOnlySuburbRecord {
  suburb: string;
  state: string;
  role: string;
  latitude: number;
  longitude: number;
}

interface MapOnlyArea {
  name: string;
  state: string;
  coordinates: [number, number];
}

const normaliseSuburbName = (name: string) => name.trim().toLocaleLowerCase("en-AU");

export default function ServiceAreaMap({ locations, variant = "directory" }: ServiceAreaMapProps) {
  const isSingleArea = variant === "single-area";
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const mapOnlyLayerRef = useRef<LeafletLayerGroup | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedMapOnlyArea, setSelectedMapOnlyArea] = useState<MapOnlyArea | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">("loading");

  const mapOnlyAreas = useMemo<MapOnlyArea[]>(() => {
    if (isSingleArea) return [];

    const nearbyNames = new Set(locations.map((location) => normaliseSuburbName(location.name)));
    return (mapOnlySuburbs as MapOnlySuburbRecord[])
      .filter(({ suburb, role, latitude, longitude }) => (
        role === "map_pin_only"
        && !nearbyNames.has(normaliseSuburbName(suburb))
        && Number.isFinite(latitude)
        && Number.isFinite(longitude)
      ))
      .map(({ suburb, state, latitude, longitude }) => ({
        name: suburb,
        state,
        coordinates: [latitude, longitude] as [number, number]
      }));
  }, [isSingleArea, locations]);

  const allCoordinates = useMemo(
    () => [...locations.map(({ coordinates }) => coordinates), ...mapOnlyAreas.map(({ coordinates }) => coordinates), WORKSHOP.coordinates],
    [locations, mapOnlyAreas]
  );
  const selectedArea = isSingleArea ? null : locations.find(({ slug }) => slug === selectedSlug) ?? null;

  useEffect(() => {
    let active = true;
    const markers = markersRef.current;

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

        const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const iconFor = (kind: "area" | "coverage" | "workshop") => L.divIcon({
          className: "service-area-map__leaflet-icon",
          html: `<span class="service-area-map__pin service-area-map__pin--${kind}" aria-hidden="true"></span>`,
          iconSize: kind === "coverage" ? [16, 16] : [24, 24],
          iconAnchor: kind === "coverage" ? [8, 8] : [12, 12],
          tooltipAnchor: [0, -14]
        });

        const mapOnlyLayer = L.layerGroup().addTo(map);
        mapOnlyLayerRef.current = mapOnlyLayer;
        const focusMapOnlyArea = (area: MapOnlyArea) => {
          setSelectedSlug(null);
          setHoveredSlug(null);
          setSelectedMapOnlyArea(area);
          map.flyTo(area.coordinates, 13, { animate: !reducedMotion(), duration: reducedMotion() ? 0 : 0.55 });
        };
        const addMapOnlyMarker = (area: MapOnlyArea) => {
          L.marker(area.coordinates, {
            icon: iconFor("coverage"),
            title: `${area.name}, ${area.state} service area`,
            keyboard: true
          })
            .addTo(mapOnlyLayer)
            .bindTooltip(`${area.name}, ${area.state}`, { direction: "top", offset: [0, -8] })
            .on("click", () => focusMapOnlyArea(area));
        };
        const renderMapOnlyMarkers = () => {
          mapOnlyLayer.clearLayers();
          if (map.getZoom() >= 12) {
            mapOnlyAreas.forEach(addMapOnlyMarker);
            return;
          }

          const cellSize = map.getZoom() <= 8 ? 0.32 : map.getZoom() <= 10 ? 0.14 : 0.065;
          const clusters = new Map<string, MapOnlyArea[]>();
          mapOnlyAreas.forEach((area) => {
            const [latitude, longitude] = area.coordinates;
            const key = `${Math.floor(latitude / cellSize)}:${Math.floor(longitude / cellSize)}`;
            clusters.set(key, [...(clusters.get(key) ?? []), area]);
          });

          clusters.forEach((areas) => {
            if (areas.length === 1) {
              addMapOnlyMarker(areas[0]);
              return;
            }

            const center: [number, number] = [
              areas.reduce((total, area) => total + area.coordinates[0], 0) / areas.length,
              areas.reduce((total, area) => total + area.coordinates[1], 0) / areas.length
            ];
            const bounds = L.latLngBounds(areas.map((area) => area.coordinates));
            L.marker(center, {
              icon: L.divIcon({
                className: "service-area-map__leaflet-icon",
                html: `<span class="service-area-map__cluster" aria-hidden="true">${areas.length}</span>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
                tooltipAnchor: [0, -18]
              }),
              title: `${areas.length} Melbourne service suburbs`,
              keyboard: true
            })
              .addTo(mapOnlyLayer)
              .bindTooltip(`${areas.length} Melbourne service suburbs. Zoom in to view each suburb.`, { direction: "top", offset: [0, -12] })
              .on("click", () => map.fitBounds(bounds, { padding: [48, 48], animate: !reducedMotion() }));
          });
        };

        locations.forEach((location) => {
          const marker = L.marker(location.coordinates, {
            icon: iconFor("area"),
            title: `${location.name} service area`,
            keyboard: true
          })
            .addTo(map)
            .bindTooltip(location.name, { direction: "top", offset: [0, -10] })
            .on("click", () => {
              if (!isSingleArea) {
                setSelectedSlug(location.slug);
                setSelectedMapOnlyArea(null);
              }
              map.flyTo(location.coordinates, 13, { animate: !reducedMotion(), duration: reducedMotion() ? 0 : 0.55 });
            });
          markers.set(location.slug, marker);
        });

        L.marker(WORKSHOP.coordinates, {
          icon: iconFor("workshop"),
          title: "CA Autobody workshop",
          keyboard: true
        })
          .addTo(map)
          .bindTooltip("CA Autobody workshop", { direction: "top", offset: [0, -10] });

        renderMapOnlyMarkers();
        map.on("zoomend", renderMapOnlyMarkers);
        map.fitBounds(allCoordinates, { padding: [48, 48], maxZoom: 10 });
        setMapState("ready");
      } catch {
        if (active) setMapState("unavailable");
      }
    };

    void initialiseMap();
    return () => {
      active = false;
      markers.clear();
      mapOnlyLayerRef.current?.clearLayers();
      mapOnlyLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [allCoordinates, isSingleArea, locations, mapOnlyAreas]);

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
    setSelectedMapOnlyArea(null);
    setHoveredSlug(null);

    const map = mapRef.current;
    if (!map) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (slug) {
      const area = locations.find((location) => location.slug === slug);
      if (area) map.flyTo(area.coordinates, 13, { animate: !reducedMotion, duration: reducedMotion ? 0 : 0.55 });
      return;
    }
    map.fitBounds(allCoordinates, { padding: [48, 48], maxZoom: 10, animate: !reducedMotion });
  }, [allCoordinates, locations]);

  return (
    <section className="service-area-map-section" id="service-map" aria-labelledby={isSingleArea ? undefined : "service-area-map-title"} aria-label={isSingleArea ? "Your local repair route" : undefined}>
      <div className={`hp-shell service-area-map ${isSingleArea ? "service-area-map--single" : ""}`}>
        <div className="service-area-map__directory">
          {!isSingleArea ? <>
            <p className="hp-eyebrow">Find your suburb</p>
            <h2 id="service-area-map-title">Local Support, Melbourne-Wide</h2>
            <p className="service-area-map__intro">We service all Melbourne suburbs, with tow truck assistance available to get your vehicle to our Chelsea workshop for repairs.</p>
            <div className="service-area-map__nearby-head">
              <h3>Our Nearby Service Areas ({locations.length})</h3>
              <button
                className={`service-area-map__all ${selectedSlug === null ? "is-active" : ""}`}
                type="button"
                onClick={() => focusArea(null)}
                onMouseEnter={() => setHoveredSlug(null)}
                aria-pressed={selectedSlug === null}
              >
                <span>Show all</span><b>{locations.length}</b>
              </button>
            </div>

            <ul className="service-area-map__areas" aria-label="Our nearby service areas">
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
          </> : null}

          <div className="service-area-map__selection" aria-live="polite">
            {selectedArea ? (
              <>
                <span>Selected area</span>
                <strong>{selectedArea.name}</strong>
                <p>{selectedArea.mapDescription}</p>
                <Link href={`/areas-we-serve/${selectedArea.slug}`}>View {selectedArea.name} repair support <ActionIcon /></Link>
              </>
            ) : selectedMapOnlyArea ? (
              <>
                <span>Melbourne-wide service area</span>
                <strong>{selectedMapOnlyArea.name}, {selectedMapOnlyArea.state}</strong>
                <p>We service this suburb. Tow truck assistance is available to our Chelsea Heights workshop for repairs.</p>
              </>
            ) : (
              <>
                <span>Your local repair route</span>
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
            <span><i className="service-area-map__legend-pin" />Nearby area</span>
            {!isSingleArea ? <span><i className="service-area-map__legend-pin service-area-map__legend-pin--coverage" />Melbourne-wide coverage</span> : null}
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
