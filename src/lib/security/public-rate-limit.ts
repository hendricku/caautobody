import "server-only";
import { createHash } from "node:crypto";
import { serviceClient } from "@/lib/cms/service-client";

function requestKey(request: Request, identity?: string, identityOnly = false) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const salt = process.env.CAAUTOBODY_RATE_LIMIT_SALT || request.headers.get("host") || "caautobody";
  return createHash("sha256").update(`${salt}:${identityOnly && identity ? "identity" : forwardedFor}:${identity?.trim().toLowerCase() || ""}`).digest("hex");
}

export async function consumePublicRateLimit(input: { request: Request; scope: string; limit: number; windowSeconds: number; identity?: string; identityOnly?: boolean }) {
  const database = serviceClient();
  const { data, error } = await database.rpc("cms_consume_public_rate_limit", {
    p_scope: input.scope,
    p_request_key: requestKey(input.request, input.identity, input.identityOnly),
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });
  if (error) throw new Error("Rate limiting is unavailable");
  return data === true;
}
