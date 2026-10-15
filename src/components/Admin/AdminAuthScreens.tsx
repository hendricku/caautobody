"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { media } from "@/lib/media";

function AuthFrame({ title, children, detail }: { title: string; detail: string; children: React.ReactNode }) {
  return <main className="admin-auth"><section className="admin-auth__panel" aria-labelledby="admin-auth-title"><img src={media.logo} alt="CA Chelsea Autobody" /><div><p>CA Autobody administration</p><h1 id="admin-auth-title">{title}</h1><span>{detail}</span></div>{children}</section></main>;
}

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send code");
      router.push(`/caautobodyadmin/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in unavailable"); }
    finally { setBusy(false); }
  }

  return <AuthFrame title="Admin sign in" detail="Authorized staff can request a one-time email code."><form className="admin-auth__form" onSubmit={(event) => void submit(event)}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} /></label>{error ? <p role="alert" className="admin-auth__notice">{error}</p> : null}<button className="admin-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send one-time code"}</button></form></AuthFrame>;
}

export function AdminVerify() {
  const router = useRouter();
  const query = useSearchParams();
  const email = useMemo(() => query.get("email") || "", [query]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Code verification failed");
      router.replace("/caautobodyadmin/dashboard"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Code verification unavailable"); }
    finally { setBusy(false); }
  }

  return <AuthFrame title="Enter your code" detail={email ? `Check the inbox for the six-digit code sent to ${email}.` : "Return to sign in and enter an authorized email."}><form className="admin-auth__form" onSubmit={(event) => void submit(event)}><label>Six-digit one-time code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required disabled={busy || !email} /></label>{error ? <p role="alert" className="admin-auth__notice">{error}</p> : null}<button className="admin-primary" type="submit" disabled={busy || !email || code.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}</button><button className="admin-auth__link" type="button" onClick={() => router.push("/caautobodyadmin/login")}>Use a different email</button></form></AuthFrame>;
}
