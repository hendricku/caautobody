import Image from "next/image";
interface PageHeroProps {
  eyebrow?: string;
  title: string;
  image: string;
  intro?: string;
  variant?: "default" | "service";
  imagePosition?: string;
}

export default function PageHero({ eyebrow, title, image, intro, variant = "default", imagePosition }: PageHeroProps) {
  return (
    <section className={`page-hero page-hero--${variant}`}>
      <Image src={image} alt="" aria-hidden="true" style={imagePosition ? { objectPosition: imagePosition } : undefined}  width={1600} height={900} unoptimized />
      <div className="page-hero__shade" />
      <div className="page-hero__topfade" aria-hidden="true" />
      <div className="page-hero__content shell">
        <div className="page-hero__copy">
          {eyebrow ? <span className="hp-eyebrow hp-eyebrow--light">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {intro ? <p>{intro}</p> : null}
        </div>
        <div className="page-hero__folio" aria-hidden="true">
          <span>CA Autobody</span>
          <i />
          <span>Melbourne</span>
        </div>
      </div>
    </section>
  );
}
