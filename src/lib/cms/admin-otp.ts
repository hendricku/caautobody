import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/cms/service-client";
import { supabaseForToken } from "@/lib/cms/admin-server";
import { sendAdminOtpEmail } from "@/lib/email/admin-otp";

/** No code, link, token, or provider response may leave this server-only helper. */
export async function deliverAdminOtp(email: string, database: SupabaseClient = serviceClient()) {
  const { data: authorized, error: lookupError } = await database.rpc("cms_can_request_admin_otp", { p_email: email });
  // Preserve the existing hosted-Auth login during the migration/deployment window.
  // Only a missing new RPC uses this path; authorization or connection errors fail closed.
  if (lookupError?.code === "PGRST202") {
    const { error } = await supabaseForToken().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) throw new Error("Admin login is unavailable");
    return;
  }
  if (lookupError) throw new Error("Admin login is unavailable");
  if (authorized !== true) return;
  const { data, error } = await database.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.email_otp || !/^\d{6}$/.test(data.properties.email_otp)) throw new Error("Admin login is unavailable");
  await sendAdminOtpEmail(email, data.properties.email_otp);
}
