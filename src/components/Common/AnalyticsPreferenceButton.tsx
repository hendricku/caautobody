"use client";

export default function AnalyticsPreferenceButton() {
  return <button type="button" className="hp-footer__privacy-choice" onClick={() => window.dispatchEvent(new Event("caautobody:analytics-preferences"))}>Privacy choices</button>;
}
