// Read-only against real staff. Creates and removes a unique, unprivileged test identity.
// Usage: node --env-file=.env.local scripts/verify-admin-otp.mjs
// No emails are sent. Never print codes, credentials, tokens or provider responses.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !publicKey) throw new Error("Supabase environment is incomplete");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, key, options);
const visitor = createClient(url, publicKey, options);
const email = `cms-otp-check-${randomUUID()}@example.com`;
let testUserId;
try {
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error || !created.data.user) throw new Error("Test identity provisioning failed");
  testUserId = created.data.user.id;
  const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (generated.error || !/^\d{6}$/.test(generated.data.properties?.email_otp || "")) throw new Error("Six-digit OTP generation failed");
  const code = generated.data.properties.email_otp;
  const verified = await visitor.auth.verifyOtp({ email, token: code, type: "email" });
  if (verified.error || !verified.data.session) throw new Error("OTP verification failed");
  const membership = await visitor.rpc("cms_staff_role");
  if (membership.error || membership.data !== null) throw new Error("Unprivileged identity must not gain CMS access");
  const reused = await visitor.auth.verifyOtp({ email, token: code, type: "email" });
  if (!reused.error) throw new Error("A used OTP was incorrectly accepted twice");
  console.log("Live Supabase check: account creation, six-digit OTP verification, replay rejection and CMS access denial passed. No email was sent.");
} finally {
  await visitor.auth.signOut();
  if (testUserId) {
    const removed = await admin.auth.admin.deleteUser(testUserId);
    if (removed.error) throw new Error("The temporary OTP test identity could not be cleaned up");
    console.log("Temporary test identity removed.");
  }
}
