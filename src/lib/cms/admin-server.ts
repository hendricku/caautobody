import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, EXPIRED_ADMIN_COOKIE_OPTIONS, REFRESH_COOKIE } from "@/lib/cms/admin-session";

export type AdminRole = "admin" | "editor" | "publisher";
export { ACCESS_COOKIE, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, REFRESH_COOKIE };

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return { url, key };
}

export function supabaseForToken(token?: string) {
  const { url, key } = supabaseConfig();
  return createClient(url, key, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function createAdminServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookieOptions: ADMIN_COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Server Components cannot persist a refreshed cookie. Middleware does
      // that work; this catch keeps protected rendering read-only.
      setAll: (updates) => { try { updates.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
    },
  });
}

export function createAdminRouteClient(request: NextRequest, response: NextResponse) {
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookieOptions: ADMIN_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates) => updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
}

export async function getAdmin() {
  const client = await createAdminServerClient();
  // getClaims verifies the token signature against Supabase Auth. Roles come
  // from the membership table, never from user-editable JWT metadata.
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const { data: role, error: roleError } = await client.rpc("cms_staff_role");
  if (roleError || !["admin", "editor", "publisher"].includes(role)) return null;
  return { client, user: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined }, role: role as AdminRole };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host && new URL(origin).protocol === new URL(request.url).protocol; }
  catch { return false; }
}

export function clearLegacyAdminCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
  response.cookies.set(REFRESH_COOKIE, "", EXPIRED_ADMIN_COOKIE_OPTIONS);
}
