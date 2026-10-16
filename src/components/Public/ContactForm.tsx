"use client";

import { FormEvent, useState } from "react";
import Icon from "@/components/UI/Icon";

export default function ContactForm({ suburbs }: { suburbs: string[] }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("submissionId", submissionId); data.set("enquiryType", "contact"); data.set("vehicle", ""); data.set("claimStatus", ""); data.set("company", "");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send your enquiry");
      setSent(true); setSubmissionId(crypto.randomUUID()); event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send your enquiry"); }
    finally { setBusy(false); }
  };

  if (sent) return <div className="form-success"><span>Thank you</span><h3>Thank you for contacting us.</h3><p>We will get back to you as soon as possible. Alternatively, in case of urgency, please feel free to contact us on 03 9772 7411.</p><button type="button" className="btn btn-dark" onClick={() => setSent(false)}>Send another enquiry</button></div>;

  return (
    <form className="contact-form" onSubmit={(event) => void submit(event)}>
      <div className="form-row"><label>Full name<input required name="name" /></label><label>Phone<input required name="phone" /></label></div>
      <div className="form-row"><label>Email<input required type="email" name="email" /></label><label>Suburb<select name="suburb" autoComplete="address-level2" defaultValue=""><option value="">Select your suburb (optional)</option>{suburbs.map((suburb) => <option key={suburb} value={suburb}>{suburb}</option>)}<option value="Other / outside listed area">Other / outside listed area</option></select></label></div>
      <label>How can we help?<select name="service"><option>Accident Assistance</option><option>Panel Beating</option><option>Paintless Dent Removal</option><option>Spray Painting</option><option>Tesla Repair</option><option>Zeekr Repair</option><option>Other</option></select></label>
      <label>Message<textarea required name="message" rows={6} /></label>
      <input name="company" autoComplete="off" tabIndex={-1} aria-hidden="true" className="form-honeypot" />
      {error ? <p className="brand-assessment-form__error" role="alert">{error}</p> : null}
      <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "Sending…" : <>Send Enquiry <Icon name="arrow-forward" /></>}</button>
    </form>
  );
}
