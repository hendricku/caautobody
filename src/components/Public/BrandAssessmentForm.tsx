"use client";

import { FormEvent, useState } from "react";
import { createContactEnquiry } from "@/lib/contactMock";

type BrandAssessmentFormProps = {
  brand: "BYD" | "Lexus";
  cta: string;
  assessmentNote: string;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);

export default function BrandAssessmentForm({ brand, cta, assessmentNote }: BrandAssessmentFormProps) {
  const [photoNames, setPhotoNames] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function choosePhoto(index: number, file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    const hasAcceptedExtension = /\.(jpe?g|png|heic|heif)$/i.test(file.name);
    if ((!acceptedTypes.has(file.type) && !hasAcceptedExtension) || file.size > MAX_FILE_SIZE) {
      setError("Choose a JPG, PNG or HEIC image up to 8 MB.");
      input.value = "";
      return;
    }
    setError("");
    setPhotoNames((current) => current.map((name, itemIndex) => itemIndex === index ? file.name : name));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createContactEnquiry({
      name: String(data.get("name") || ""),
      phone: String(data.get("phone") || ""),
      email: "",
      suburb: "",
      service: `${brand} Repair Assessment`,
      message: `Brand assessment request for ${brand}.`,
      brand,
      vehicle: String(data.get("vehicle") || ""),
      claimStatus: String(data.get("claimStatus") || ""),
      attachments: photoNames.filter(Boolean),
      enquiryType: "brand-assessment",
    });
    setSent(true);
  }

  if (sent) return <div className="brand-assessment-form brand-assessment-form--success" role="status"><h2>Assessment request received.</h2><p>Thank you. The CA Autobody team will review the details provided in this browser preview.</p><button type="button" onClick={() => setSent(false)}>Send another request</button></div>;

  return <form className="brand-assessment-form" onSubmit={submit}>
    <div className="brand-assessment-form__heading"><h2>Tell Us What Happened</h2><p>A short assessment helps us triage safety, claim and repair requirements.</p></div>
    <div className="brand-assessment-form__fields">
      <label>Full name<input required name="name" autoComplete="name" placeholder="First and last name" /></label>
      <label>Mobile<input required name="phone" autoComplete="tel" inputMode="tel" placeholder="04__ ___ ___" /></label>
      <label>Vehicle<input required name="vehicle" placeholder={`${brand} model`} /></label>
      <label>Claim status<select required name="claimStatus" defaultValue=""><option value="" disabled>Select claim status</option><option>Not lodged yet</option><option>Claim lodged</option><option>Not sure</option></select></label>
    </div>
    <fieldset className="brand-assessment-form__uploads"><legend>Photos of the damage <span>(optional)</span></legend><div>{photoNames.map((name, index) => <label className={name ? "has-file" : ""} key={index} htmlFor={`brand-photo-${brand}-${index}`}><span>{name || "Choose photo"}</span><input id={`brand-photo-${brand}-${index}`} type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={(event) => choosePhoto(index, event.currentTarget.files?.[0], event.currentTarget)} /></label>)}</div><p>Up to three photos, 8 MB each. JPG, PNG or HEIC.</p></fieldset>
    {error ? <p className="brand-assessment-form__error" role="alert">{error}</p> : null}
    <button className="brand-assessment-form__submit" type="submit">{cta}</button>
    <p className="brand-assessment-form__note">{assessmentNote}</p>
  </form>;
}
