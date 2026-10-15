"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryContent } from "@/types/content";
import Icon from "@/components/UI/Icon";

const BENTO_CLASSES = [
  "bento-wide-tall",
  "bento-standard",
  "bento-tall",
  "bento-standard",
  "bento-wide",
  "bento-standard",
  "bento-tall",
  "bento-standard",
] as const;

export default function GalleryGrid({ items }: { items: GalleryContent[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pointerStart = useRef<number | null>(null);

  const visible = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [category, items],
  );

  const active = activeIndex === null ? null : visible[activeIndex] ?? null;

  const close = () => setActiveIndex(null);
  const previous = () => {
    if (!visible.length || activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + visible.length) % visible.length);
  };
  const next = () => {
    if (!visible.length || activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % visible.length);
  };

  useEffect(() => {
    if (activeIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeIndex, visible.length]);

  useEffect(() => {
    setActiveIndex(null);
  }, [category]);

  return (
    <>
      <div className="gallery-toolbar" aria-label="Gallery filters">
        <div className="gallery-filter">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="gallery-count">
          <strong>{visible.length}</strong> {visible.length === 1 ? "image" : "images"}
        </p>
      </div>

      <div className="gallery-bento-grid">
        {visible.map((item, index) => (
          <button
            type="button"
            className={`gallery-bento-card ${BENTO_CLASSES[index % BENTO_CLASSES.length]}`}
            key={item.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`Open ${item.caption}`}
          >
            <img src={item.image} alt={item.caption} loading="lazy" decoding="async" />
            <span className="gallery-bento-shade" />
            <span className="gallery-bento-copy">
              <small>{item.category}</small>
              <strong>{item.caption}</strong>
              <em>View image</em>
            </span>
            <span className="gallery-bento-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={active.caption} onMouseDown={close}>
          <div className="gallery-lightbox__topbar">
            <div>
              <small>{active.category}</small>
              <strong>{active.caption}</strong>
            </div>
            <span>
              {activeIndex! + 1} / {visible.length}
            </span>
          </div>

          <button className="gallery-lightbox__close" type="button" onClick={close} aria-label="Close image viewer">
            <Icon name="close" />
          </button>

          {visible.length > 1 ? (
            <button
              className="gallery-lightbox__nav gallery-lightbox__nav--prev"
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={previous}
              aria-label="Previous image"
            >
              <Icon name="arrow-back" />
            </button>
          ) : null}

          <figure
            className="gallery-lightbox__figure"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => { pointerStart.current = event.clientX; }}
            onPointerUp={(event) => {
              if (pointerStart.current === null) return;
              const delta = event.clientX - pointerStart.current;
              pointerStart.current = null;
              if (Math.abs(delta) < 55) return;
              if (delta < 0) next(); else previous();
            }}
          >
            <img src={active.image} alt={active.caption} />
            <figcaption>{active.caption}</figcaption>
          </figure>

          {visible.length > 1 ? (
            <button
              className="gallery-lightbox__nav gallery-lightbox__nav--next"
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={next}
              aria-label="Next image"
            >
              <Icon name="arrow-forward" />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
