"use client";

import { FormEvent, useState } from "react";
import { createContactEnquiry } from "@/lib/contactMock";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createContactEnquiry({
      name: String(data.get("name") || ""),
      phone: String(data.get("phone") || ""),
      email: String(data.get("email") || ""),
      suburb: String(data.get("suburb") || ""),
      service: String(data.get("service") || ""),
      message: String(data.get("message") || ""),
    });
    setSent(true);
  };

  if (sent) return <div className="form-success"><span>Thank you</span><h3>Thank you for contacting us.</h3><p>We will get back to you as soon as possible. Alternatively, in case of urgency, please feel free to contact us on 03 9772 7411.</p><button type="button" className="btn btn-dark" onClick={() => setSent(false)}>Send another enquiry</button></div>;

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-row"><label>Full name<input required name="name" /></label><label>Phone<input required name="phone" /></label></div>
      <div className="form-row"><label>Email<input required type="email" name="email" /></label><label>Suburb<input name="suburb" /></label></div>
      <label>How can we help?<select name="service"><option>Accident Assistance</option><option>Panel Beating</option><option>Paintless Dent Removal</option><option>Spray Painting</option><option>Tesla Repair</option><option>Zeekr Repair</option><option>Other</option></select></label>
      <label>Message<textarea required name="message" rows={6} /></label>
      <button className="btn btn-gold" type="submit">Send Enquiry <span aria-hidden="true">→</span></button>
    </form>
  );
}
