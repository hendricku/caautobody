"use client";

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import Icon from "@/components/UI/Icon";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { ContactServiceOption } from "@/lib/contact-options";

const otherSuburb = "Other / outside listed area";

export default function ContactForm({ suburbs, serviceOptions }: { suburbs: string[]; serviceOptions: ContactServiceOption[] }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [suburbQuery, setSuburbQuery] = useState("");
  const [selectedSuburb, setSelectedSuburb] = useState("");
  const [suburbListOpen, setSuburbListOpen] = useState(false);
  const [activeSuburbIndex, setActiveSuburbIndex] = useState(0);
  const suburbInput = useRef<HTMLInputElement>(null);
  const matchingSuburbs = useMemo(() => {
    const query = suburbQuery.trim().toLocaleLowerCase("en-AU");
    return query ? suburbs.filter((suburb) => suburb.toLocaleLowerCase("en-AU").startsWith(query)) : suburbs;
  }, [suburbQuery, suburbs]);
  const suburbOptions = useMemo(() => [...matchingSuburbs, otherSuburb], [matchingSuburbs]);
  const serviceGroups = useMemo(() => ({
    services: serviceOptions.filter((option) => option.group === "Services"),
    brands: serviceOptions.filter((option) => option.group === "Brand repairs"),
  }), [serviceOptions]);

  const selectSuburb = (suburb: string) => {
    setSelectedSuburb(suburb);
    setSuburbQuery(suburb);
    setSuburbListOpen(false);
    setActiveSuburbIndex(0);
  };

  const handleSuburbKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuburbListOpen(true);
      setActiveSuburbIndex((current) => Math.min(current + 1, suburbOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuburbListOpen(true);
      setActiveSuburbIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && suburbListOpen) {
      event.preventDefault();
      selectSuburb(suburbOptions[activeSuburbIndex]);
    } else if (event.key === "Escape") {
      setSuburbListOpen(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("submissionId", submissionId); data.set("enquiryType", "contact"); data.set("vehicle", ""); data.set("claimStatus", ""); data.set("company", "");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send your enquiry");
      trackAnalyticsEvent("generate_lead", { form_name: "contact_enquiry" });
      setSent(true); setSubmissionId(crypto.randomUUID()); setSuburbQuery(""); setSelectedSuburb(""); setSuburbListOpen(false); event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send your enquiry"); }
    finally { setBusy(false); }
  };

  if (sent) return <div className="form-success"><span>Thank you</span><h3>Thank you for contacting us.</h3><p>We will get back to you as soon as possible. Alternatively, in case of urgency, please feel free to contact us on 03 9772 7411.</p><button type="button" className="btn btn-dark" onClick={() => setSent(false)}>Send another enquiry</button></div>;

  return (
    <form className="contact-form" onSubmit={(event) => void submit(event)}>
      <div className="form-row"><label>Full name<input required name="name" /></label><label>Phone<input required name="phone" /></label></div>
      <div className="form-row"><label>Email<input required type="email" name="email" /></label><div className="contact-suburb-field"><label htmlFor="contact-suburb-search">Suburb <span>(optional)</span></label><div className="contact-suburb-picker" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSuburbListOpen(false); }}><input ref={suburbInput} id="contact-suburb-search" type="search" value={suburbQuery} onChange={(event) => { setSuburbQuery(event.target.value); setSelectedSuburb(""); setSuburbListOpen(true); setActiveSuburbIndex(0); }} onFocus={() => setSuburbListOpen(true)} onKeyDown={handleSuburbKeys} autoComplete="address-level2" placeholder="Start typing your suburb" role="combobox" aria-autocomplete="list" aria-expanded={suburbListOpen} aria-controls="contact-suburb-options" aria-activedescendant={suburbListOpen ? `contact-suburb-option-${activeSuburbIndex}` : undefined} /><input type="hidden" name="suburb" value={selectedSuburb} />{selectedSuburb ? <button className="contact-suburb-picker__clear" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSuburbQuery(""); setSelectedSuburb(""); setSuburbListOpen(true); suburbInput.current?.focus(); }}>Clear</button> : null}{suburbListOpen ? <div id="contact-suburb-options" className="contact-suburb-picker__menu" role="listbox" aria-label="Melbourne suburbs">{!matchingSuburbs.length ? <p className="contact-suburb-picker__empty">No matching suburb. You can select outside listed area below.</p> : null}{suburbOptions.map((suburb, index) => <button id={`contact-suburb-option-${index}`} className={`contact-suburb-picker__option${index === activeSuburbIndex ? " is-active" : ""}${suburb === otherSuburb ? " is-other" : ""}`} type="button" role="option" aria-selected={suburb === selectedSuburb} key={suburb} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveSuburbIndex(index)} onClick={() => selectSuburb(suburb)}>{suburb}</button>)}</div> : null}</div></div></div>
      <label>How can we help?<select name="service">{serviceGroups.services.length ? <optgroup label="Services">{serviceGroups.services.map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}</optgroup> : null}{serviceGroups.brands.length ? <optgroup label="Brand repairs">{serviceGroups.brands.map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}</optgroup> : null}<option value="Other / not sure">Other / not sure</option></select></label>
      <label>Message<textarea required name="message" rows={6} /></label>
      <input name="company" autoComplete="off" tabIndex={-1} aria-hidden="true" className="form-honeypot" />
      {error ? <p className="brand-assessment-form__error" role="alert">{error}</p> : null}
      <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "Sending…" : <>Send Enquiry <Icon name="arrow-forward" /></>}</button>
    </form>
  );
}
