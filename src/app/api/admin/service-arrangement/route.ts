import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { asServiceArrangement, PRESTIGE_SLIDE, SERVICE_ARRANGEMENT_KEY } from "@/lib/cms/service-arrangement";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const defaultMenu = ["accident-assistance", "panel-beating", "spray-painting", "paintless-dent-removal", "replacement-vehicles"];
const defaultSlider = ["tesla-approved-repair-centre", "services-zeekr-approved-repairer-melbourne", "byd-approved-repairer-melbourne", "lexus-approved-body-shop-melbourne", PRESTIGE_SLIDE, "panel-beating", "spray-painting", "replacement-vehicles", "paintless-dent-removal", "accident-assistance"];

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const [services, saved] = await Promise.all([
    admin.client.from("cms_services").select("slug,title,status,content_json,sort_order").eq("status", "published").order("sort_order").limit(200),
    admin.client.from("cms_site_settings").select("value,updated_at").eq("key", SERVICE_ARRANGEMENT_KEY).maybeSingle(),
  ]);
  if (services.error || saved.error) return NextResponse.json({ error: "Unable to load menu arrangement" }, { status: 503 });
  const eligible = (services.data || []).map((service) => {
    const raw = service.content_json && typeof service.content_json === "object" && !Array.isArray(service.content_json) ? service.content_json as Record<string, unknown> : {};
    const placement = raw.placement && typeof raw.placement === "object" && !Array.isArray(raw.placement) ? raw.placement as Record<string, unknown> : {};
    const slug = service.slug as string;
    return { slug, title: service.title as string,
      menu: typeof placement.navigation === "boolean" ? placement.navigation : defaultMenu.includes(slug),
      slider: typeof placement.homeSlider === "boolean" ? placement.homeSlider : defaultSlider.includes(slug) };
  });
  // Service placement flags remain authoritative. Arrangement controls the
  // order and optional visibility among items already enabled in each module.
  const rows = [...eligible, { slug: PRESTIGE_SLIDE, title: "Prestige Brands (directory link)", menu: false, slider: true }];
  const savedOrder = asServiceArrangement(saved.data?.value);
  const available = (area: "menu" | "slider") => rows.filter((row) => row[area]).map((row) => row.slug);
  const arrangement = { menu: savedOrder?.menu || defaultMenu, slider: savedOrder?.slider || defaultSlider };
  return NextResponse.json({
    services: rows,
    menu: arrangement.menu.filter((slug) => available("menu").includes(slug)),
    slider: arrangement.slider.filter((slug) => available("slider").includes(slug)),
    availableMenu: available("menu"), availableSlider: available("slider"),
    revision: saved.data?.updated_at ?? null, role: admin.role,
  }, { headers: noStore });
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "editor") return NextResponse.json({ error: "Publisher or Admin permission required" }, { status: 403 });
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      !Object.prototype.hasOwnProperty.call(input, "revision") ||
      !(typeof input.revision === "string" || input.revision === null))
    return NextResponse.json({ error: "Invalid save request" }, { status: 400 });
  const value = asServiceArrangement(input);
  if (!value) return NextResponse.json({ error: "Invalid or duplicate service IDs" }, { status: 400 });
  const { data: services, error: servicesError } = await admin.client.from("cms_services")
    .select("slug,content_json").eq("status", "published").limit(201);
  if (servicesError || !services || services.length > 200) return NextResponse.json({ error: "Unable to verify published services" }, { status: 503 });
  const defaults = new Map<string, {menu:boolean;slider:boolean}>();
  for (const service of services) {
    const content = service.content_json && typeof service.content_json === "object" && !Array.isArray(service.content_json) ? service.content_json as Record<string, unknown> : {};
    const raw = content.placement && typeof content.placement === "object" && !Array.isArray(content.placement) ? content.placement as Record<string, unknown> : {};
    defaults.set(service.slug, {
      menu: typeof raw.navigation === "boolean" ? raw.navigation : defaultMenu.includes(service.slug),
      slider: typeof raw.homeSlider === "boolean" ? raw.homeSlider : defaultSlider.includes(service.slug),
    });
  }
  if (value.menu.some((slug) => !defaults.get(slug)?.menu) ||
      value.slider.some((slug) => slug !== PRESTIGE_SLIDE && !defaults.get(slug)?.slider)) {
    return NextResponse.json({ error: "A selected service is no longer published or enabled. Reload the arrangement." }, { status: 409 });
  }
  const { data: current, error: readError } = await admin.client.from("cms_site_settings")
    .select("updated_at").eq("key", SERVICE_ARRANGEMENT_KEY).maybeSingle();
  if (readError) return NextResponse.json({ error: "Unable to check current menu order" }, { status: 503 });
  if ((current?.updated_at ?? null) !== input.revision) {
    return NextResponse.json({ error: "Another administrator changed the arrangement. Reload before saving." }, { status: 409 });
  }
  const result = current
    ? await admin.client.from("cms_site_settings").update({ value, is_public: true })
        .eq("key", SERVICE_ARRANGEMENT_KEY).eq("updated_at", current.updated_at).select("updated_at").maybeSingle()
    : await admin.client.from("cms_site_settings").insert({ key: SERVICE_ARRANGEMENT_KEY, value, is_public: true }).select("updated_at").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.code === "23505" ? "Arrangement was saved by another administrator. Reload." : "Could not save arrangement" }, { status: result.error.code === "23505" ? 409 : 503 });
  if (!result.data) return NextResponse.json({ error: "Arrangement changed during save. Reload." }, { status: 409 });
  revalidatePath("/", "layout");
  revalidatePath("/services");
  return NextResponse.json({ ok: true, revision: result.data.updated_at }, { headers: noStore });
}
