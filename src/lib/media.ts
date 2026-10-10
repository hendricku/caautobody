/**
 * Local, deployment-safe media used by the public site.
 *
 * Keeping the paths here makes the visual system easy to audit and prevents
 * static pages from silently depending on the legacy WordPress media host.
 */
export const media = {
  logo: "/images/logo.webp",
  favicon: "/images/Fevicon-Icon.webp",
  hero: {
    home: "/images/homepage-Replacement-Vehicles.webp",
    about: "/images/about-centerimg.webp",
    contact: "/images/contactbg.webp",
    services: "/images/services01.webp",
    faq: "/images/View-recent-photos.webp",
    gallery: "/images/Chelsea-Auto-Body-003.webp",
    areas: "/images/Banner.webp",
  },
  service: {
    accident: "/images/ACCIDENT-ASSISTANCE-1.webp",
    accidentCard: "/images/homepage-Accident-Assistance.webp",
    accidentSupport: "/images/ACCIDENT-ASSISTANCE-3.webp",
    paintlessDent: "/images/PAINTLESS-DENT-REMOVAL.webp",
    paintlessDentCard: "/images/homepage-paintless-dent.webp",
    paintlessDentSupport: "/images/PAINTLESS-DENT-REMOVAL-1.webp",
    panelBeating: "/images/PANEL-BEATING.webp",
    panelBeatingSupport: "/images/panel-beatingimg.webp",
    replacementVehicles: "/images/Replacement-Vehicles.webp",
    replacementVehiclesCard: "/images/homepage-Replacement-Vehicles.webp",
    replacementVehiclesSupport: "/images/REPLACEMENT-VEHICLES-3.webp",
    sprayPainting: "/images/SPRAY-PAINTING.webp",
    sprayPaintingCard: "/images/homepage-spray-paint.webp",
    sprayPaintingSupport: "/images/SPRAY-PAINTING-1.webp",
    tesla: "/images/tesla-repair.webp",
    teslaCentre: "/images/tesla-repair-centre.webp",
    teslaRoad: "/images/tesla-road.webp",
    zeekr: "/images/Chelsea-Auto-Body-009.webp",
  },
  brandRepair: {
    bydHero: "/images/close-up-of-electric-car-charging-ecology-transpo-2026-03-10-03-08-40-utc.webp",
    bydPanel: "/images/car-mechanic-working-to-remove-dent-in-workshop-2026-01-09-07-14-08-utc.webp",
    lexusHero: "/images/mechanic-inspects-auto-body-damage-in-automotive-s-2026-01-07-06-40-31-utc.webp",
    lexusFinish: "/images/detailing-film-paint-protection-male-specialist-c-2026-01-08-02-05-46-utc.webp",
    diagnostics: "/images/auto-mechanic-using-laptop-computer-inspecting-car-2026-01-11-10-14-25-utc.webp",
  },
  workshop: {
    exterior: "/images/Chelsea-Auto-Body-031.webp",
    exteriorWide: "/images/Chelsea-Auto-Body-030.webp",
    floor: "/images/Chelsea-Auto-Body-003.webp",
    reception: "/images/Chelsea-Auto-Body-015.webp",
    assessment: "/images/Chelsea-Auto-Body-021.webp",
    structural: "/images/Chelsea-Auto-Body-022.webp",
    diagnostics: "/images/Chelsea-Auto-Body-024.webp",
    equipment: "/images/Chelsea-Auto-Body-025.webp",
    paintMixing: "/images/Chelsea-Auto-Body-026.webp",
    calibration: "/images/Chelsea-Auto-Body-027.webp",
    bodyRepair: "/images/Chelsea-Auto-Body-028.webp",
    alignment: "/images/Chelsea-Auto-Body-029.webp",
  },
} as const;

/**
 * Blog records can arrive from the legacy WordPress feed or browser storage.
 * Resolve their visual treatment locally at render time so an old record can
 * never reintroduce a remote WordPress media URL into the public site.
 */
export function localBlogImageFor(slug: string) {
  const value = slug.toLowerCase();

  if (/(tesla|electric-vehicle|ev-repair)/.test(value)) return media.service.tesla;
  if (/(byd|zeekr)/.test(value)) return media.brandRepair.bydHero;
  if (/(lexus)/.test(value)) return media.brandRepair.lexusHero;
  if (/(dent|hail)/.test(value)) return media.service.paintlessDent;
  if (/(paint|spray|colour|color|refinish)/.test(value)) return media.service.sprayPainting;
  if (/(panel|collision|crash|accident|insurance|claim)/.test(value)) return media.service.panelBeating;
  if (/(replacement|loan-car|courtesy-car)/.test(value)) return media.service.replacementVehicles;
  if (/(calibrat|diagnostic|sensor|adas)/.test(value)) return media.workshop.calibration;

  return media.workshop.assessment;
}

export const vehicleBrandLogos = [
  ["Porsche", "/images/porsche-logo01.webp"],
  ["BMW", "/images/bmw-logo01.webp"],
  ["Volkswagen", "/images/walks-logo01.webp"],
  ["Audi", "/images/audi-logo01.webp"],
  ["Holden", "/images/lion-logo01.webp"],
  ["Skoda", "/images/skoda-logo01.webp"],
  ["Mercedes-Benz", "/images/mercedes-benz-logo01.webp"],
  ["Tesla", "/images/tesla-logo.webp"],
  ["Subaru", "/images/brand-subaru.webp"],
  ["Honda", "/images/honda-logo01.webp"],
  ["Ford", "/images/ford-logos.webp"],
  ["Mazda", "/images/mazda-logo01-hover.webp"],
  ["Hyundai", "/images/hyundai-logo01.webp"],
  ["Kia", "/images/kia-logo.webp"],
] as const;

export const insurerLogos = [
  ["AAMI", "/images/aami-logo.webp"],
  ["AIG", "/images/aig-logo-hover.webp"],
  ["Bingle", "/images/bingle-logo-hover.webp"],
  ["Blue Zebra", "/images/blue-sebra-black.webp"],
  ["CGU", "/images/cgu-logo-hover.webp"],
  ["Famous", "/images/famous-logo.webp"],
  ["One Underwriting", "/images/one-under-logo-hover.webp"],
  ["Allianz", "/images/allianz-logo.webp"],
  ["Hello Claims", "/images/hello-claims-logo.webp"],
  ["RACV", "/images/racv-logo.webp"],
  ["MB Group", "/images/mb-group-logo.webp"],
  ["Youi", "/images/youi-logo.webp"],
  ["Budget Direct", "/images/budget-direct-logo.webp"],
] as const;
