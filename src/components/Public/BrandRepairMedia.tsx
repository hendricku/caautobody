type ImageItem = { image: string; alt: string; label?: string };

export default function BrandRepairMedia({ items }: { items: ImageItem[] }) {
  const [featured, ...supporting] = items;

  if (!featured) {
    return <div className="brand-media brand-media--empty" role="status">Workshop imagery is temporarily unavailable.</div>;
  }

  return <section className="brand-media brand-media--folio" aria-label="Workshop and repair imagery">
    <figure className="brand-media__feature">
      <img src={featured.image} alt={featured.alt} />
      <figcaption>
        <span>Workshop view</span>
        <p>{featured.alt}</p>
      </figcaption>
    </figure>
    <div className="brand-media__supporting">
      {supporting.map((item) => <figure key={item.image}>
        <img src={item.image} alt={item.alt} />
        <figcaption>
          <span>{item.label}</span>
          <p>{item.alt}</p>
        </figcaption>
      </figure>)}
    </div>
  </section>;
}
