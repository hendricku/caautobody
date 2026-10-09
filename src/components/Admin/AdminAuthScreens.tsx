"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthFrame({ title, children, detail }: { title: string; detail: string; children: React.ReactNode }) {
  return <main className="admin-auth"><section className="admin-auth__panel" aria-labelledby="admin-auth-title"><img src="https://caautobody.com.au/wp-content/uploads/2021/05/logo.png" alt="CA Chelsea Autobody" /><div><p>CA Autobody administration</p><h1 id="admin-auth-title">{title}</h1><span>{detail}</span></div>{children}</section></main>;
}

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    window.setTimeout(() => router.push(`/caautobodyadmin/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`), 450);
  }
  return <AuthFrame title="Admin sign in" detail="Demo-only passwordless entry. The email and code are not sent or verified yet."><form className="admin-auth__form" onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} /></label><p className="admin-auth__notice">Mockup mode: continue to preview the one-time-code screen.</p><button className="admin-primary" type="submit" disabled={busy}>{busy ? "Preparing code…" : "Send one-time code"}</button></form></AuthFrame>;
}

export function AdminVerify() {
  const router = useRouter();
  const query = useSearchParams();
  const email = useMemo(() => query.get("email") || "", [query]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    window.setTimeout(() => router.replace("/caautobodyadmin/dashboard"), 500);
  }
  return <AuthFrame title="Enter your code" detail={email ? `A demo code would be sent to ${email}.` : "Return to sign in to enter an email address."}><form className="admin-auth__form" onSubmit={submit}><label>One-time code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required disabled={busy || !email} /></label><p className="admin-auth__notice">Mockup mode: any six digits continue to the dashboard. No email or session is created.</p><button className="admin-primary" type="submit" disabled={busy || !email || code.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}</button><button className="admin-auth__link" type="button" onClick={() => router.push("/caautobodyadmin/login")}>Use a different email</button></form></AuthFrame>;
}
