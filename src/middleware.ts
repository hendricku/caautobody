import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, EXPIRED_ADMIN_COOKIE_OPTIONS, REFRESH_COOKIE } from "@/lib/cms/admin-session";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookieOptions: ADMIN_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates) => {
        updates.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Migrate a valid legacy two-cookie login once. New sessions are stored by
  // @supabase/ssr in one rotating, chunk-safe cookie.
  const legacyAccess = request.cookies.get(ACCESS_COOKIE)?.value;
  const legacyRefresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const migrateLegacySession = !request.cookies.get(ADMIN_COOKIE)?.value && Boolean(legacyAccess && legacyRefresh);
  if (migrateLegacySession && legacyAccess && legacyRefresh) {
    await client.auth.setSession({ access_token: legacyAccess, refresh_token: legacyRefresh });
  }

  // getClaims refreshes expired access tokens through the SSR cookie adapter.
  // Do not redirect here; protected layouts and APIs make that decision.
  const { data: claimData } = await client.auth.getClaims();
  const section = request.nextUrl.pathname.split("/")[2];
  const moduleBySection: Record<string, string> = {
    blogs: "blogs", services: "services", brands: "brands", offers: "offers",
    areas: "areas", gallery: "gallery", faq: "faq", contacts: "contacts",
    settings: "settings", "menu-arrangement": "settings",
  };
  if (request.nextUrl.pathname.startsWith("/caautobodyadmin/") && claimData?.claims?.sub &&
      (moduleBySection[section] || ["team", "analytics", "audit"].includes(section))) {
    const { data: member, error } = await client.from("cms_admin_members")
      .select("role,modules").eq("user_id", claimData.claims.sub).maybeSingle();
    const permitted = !error && member && (member.role === "admin" ||
      (!["team", "analytics", "audit"].includes(section) &&
       (member.modules === null || (Array.isArray(member.modules) && member.modules.includes(moduleBySection[section])))));
    if (!permitted) {
      const denied = NextResponse.redirect(new URL("/caautobodyadmin/dashboard", request.url));
      response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
      return denied;
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/admin/") && claimData?.claims?.sub) {
    const parts = request.nextUrl.pathname.split("/");
    const apiSection = parts[3];
    const collectionModules: Record<string, string> = {
      blogs: "blogs", services: "services", faqs: "faq", gallery: "gallery", offers: "offers", areas: "areas",
    };
    const moduleName = apiSection === "cms" ? collectionModules[parts[4]] :
      apiSection === "enquiries" ? "contacts" :
      apiSection === "settings" || apiSection === "service-arrangement" ? "settings" : undefined;
    if (moduleName) {
      const { data: member, error } = await client.from("cms_admin_members")
        .select("role,modules").eq("user_id", claimData.claims.sub).maybeSingle();
      const modules = Array.isArray(member?.modules) ? member.modules : null;
      const permitted = !error && member && (member.role === "admin" || member.modules === null ||
        (modules && (modules.includes(moduleName) || (moduleName === "services" && modules.includes("brands")))));
      if (!permitted) {
        const denied = NextResponse.json({ error: "You do not have access to this module." }, { status: 403 });
        response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
        return denied;
      }
    }
  }
  if (migrateLegacySession) {
    response.cookies.set(ACCESS_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  matcher: ["/caautobodyadmin/:path*", "/api/admin/:path*"],
};
