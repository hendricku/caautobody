/** Public navigation/slider order stored as a single atomic settings row. */
export const SERVICE_ARRANGEMENT_KEY = "service_arrangement";
export const PRESTIGE_SLIDE = "prestige-brands";
export type ArrangementArea = "menu" | "slider";
export type ServiceArrangement = { menu: string[]; slider: string[] };

export function asServiceArrangement(value: unknown): ServiceArrangement | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (!(["menu", "slider"] as const).every((key) =>
    Array.isArray(data[key]) && data[key].length <= 100 &&
    data[key].every((slug: unknown) => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) &&
    new Set(data[key]).size === data[key].length
  )) return null;
  return { menu: [...data.menu as string[]], slider: [...data.slider as string[]] };
}

export function orderByPreference<T>(items: T[], preference: string[] | undefined, slug: (item: T) => string): T[] {
  if (!preference) return items;
  const priority = new Map(preference.map((id, index) => [id, index]));
  // Visibility is configured by the arrangement when present. Preserve the
  // relative order of published services explicitly selected by editors.
  return items.filter((item) => priority.has(slug(item)))
    .sort((a, b) => (priority.get(slug(a)) ?? 0) - (priority.get(slug(b)) ?? 0));
}
