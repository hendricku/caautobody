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
  await client.auth.getClaims();
  if (migrateLegacySession) {
    response.cookies.set(ACCESS_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  matcher: ["/caautobodyadmin/:path*", "/api/admin/:path*"],
};
