"use client";

import { FormEvent, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AdsLandingPage } from "@/lib/ads-landing-pages";

const maxFileSize = 8 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export default function AdsAssessmentForm({ page }: { page: AdsLandingPage }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [photos, setPhotos] = useState(["", "", ""]);
  const fleet = page.kind === "fleet";
  const accident = page.kind === "accident";

  function selectPhoto(index: number, file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    if (!acceptedTypes.has(file.type) || file.size > maxFileSize) {
      setError("Choose a JPG, PNG, WebP or HEIC image up to 8 MB.");
      input.value = "";
      return;
    }
    setError("");
    setPhotos((current) => current.map((name, currentIndex) => currentIndex === index ? file.name : name));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("submissionId", submissionId);
    data.set("enquiryType", "landing-assessment");
    data.set("landingPage", page.slug);
    data.set("brand", page.brand || "");
    data.set("service", page.title);
    data.set("message", fleet ? "Fleet repair support request." : `Repair assessment request from ${page.title}.`);
    if (!fleet) data.set("companyName", "");
    if (fleet) {
      data.set("vehicle", "");
      data.set("claimStatus", "");
      data.set("accidentDate", "");
    }
    if (accident) data.set("vehicle", "");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send your assessment request");
      trackAnalyticsEvent("generate_lead", { form_name: "ads_landing_assessment", landing_page: page.slug, ...(page.brand ? { vehicle_brand: page.brand } : {}) });
      form.reset();
      setPhotos(["", "", ""]);
      setSent(true);
      setSubmissionId(crypto.randomUUID());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send your assessment request");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <div className="ads-form__success" role="status"><h2>Assessment request received.</h2><p>Thank you. The CA Autobody team will review your details and contact you shortly.</p><button type="button" onClick={() => setSent(false)}>Send another request</button></div>;

  return <form className="ads-form" onSubmit={submit}>
    <div className="ads-form__head"><h2>{page.formTitle}</h2><p>{page.formIntro}</p></div>
    <div className="ads-form__fields">
      {fleet ? <label>Company<input name="companyName" required autoComplete="organization" placeholder="Business name" /></label> : null}
      <label>{fleet ? "Contact name" : "Full name"}<input name="name" required autoComplete="name" placeholder="First and last name" /></label>
      <label>Mobile<input name="phone" required autoComplete="tel" inputMode="tel" placeholder="04__ ___ ___" /></label>
      {fleet ? <label>Fleet size<select name="fleetSize" required defaultValue=""><option value="" disabled>Select fleet size</option><option>1–10 vehicles</option><option>11–50 vehicles</option><option>51–200 vehicles</option><option>200+ vehicles</option></select></label> : accident ? <><label>Accident date<input name="accidentDate" required type="date" /></label><label>Claim status<select name="claimStatus" required defaultValue=""><option value="" disabled>Select claim status</option><option>Not lodged yet</option><option>Claim lodged</option><option>Not going through insurance</option><option>Not sure</option></select></label></> : <><label>Vehicle<select name="vehicle" required defaultValue=""><option value="" disabled>Select your model</option>{page.models?.map((model) => <option key={model}>{model}</option>)}</select></label><label>Claim status<select name="claimStatus" required defaultValue=""><option value="" disabled>Select claim status</option><option>Not lodged yet</option><option>Claim lodged</option><option>Not going through insurance</option><option>Not sure</option></select></label></>}
    </div>
    <fieldset className="ads-form__uploads">
      <legend>{fleet ? "Photos of the vehicles or damage" : "Photos of the damage"} <span>(optional)</span></legend>
      <div>{photos.map((name, index) => <label key={index} className={name ? "has-file" : ""} htmlFor={`${page.slug}-photo-${index}`}><span>{name || "Choose File"}</span><input id={`${page.slug}-photo-${index}`} name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => selectPhoto(index, event.currentTarget.files?.[0], event.currentTarget)} /></label>)}</div>
      <p>Up to three photos, 8 MB each. JPG, PNG, WebP or HEIC.</p>
    </fieldset>
    <input className="form-honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    {error ? <p className="ads-form__error" role="alert">{error}</p> : null}
    <button type="submit" disabled={busy}>{busy ? "Sending…" : page.primaryCta}</button>
    <p className="ads-form__note">{page.formNote}</p>
  </form>;
}
