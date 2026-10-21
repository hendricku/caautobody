/**
 * Downloadable, self-contained PDF report. Uses only already-fetched GA4 / Search
 * Console values. No new API, browser dependency, script, or service is required.
 */
export type PdfMetric = { name: string; value: number };
export type PdfSearchMetric = { name: string; clicks: number; impressions: number; ctr: number; position: number };
export type PdfAnalyticsReport = {
  period: { start: string; end: string };
  overview: { sessions: number; users: number; pageViews: number; engagementRate: number };
  daily: { date: string; sessions: number; users: number; pageViews: number }[];
  trafficSources: PdfMetric[];
  devices: PdfMetric[];
  topPages: PdfMetric[];
  search: { status: string; overview: { clicks: number; impressions: number; ctr: number; position: number }; topQueries: PdfSearchMetric[]; topPages: PdfSearchMetric[] };
};

const f = new Intl.NumberFormat("en-AU");
const p = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 });
const ascii = (text: string) => text.normalize("NFKD").replace(/[\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7E]/g, "?");
const pdfEscape = (text: string) => ascii(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const safe = (n: number) => Number.isFinite(n) ? n : 0;

/** Pure function, also used by offline PDF validity checks. */
export function createAnalyticsPdf(report: PdfAnalyticsReport): Uint8Array {
  const width = 595.28, height = 841.89;
  const margin = 45, usable = width - 2 * margin;
  const pages: string[] = [];
  let commands: string[] = [];
  let y = height - 52;
  let pageNumber = 0;

  function line(x1: number, yy: number, x2: number, color = "0.89 0.91 0.93", weight = 0.7) {
    commands.push(`${color} RG ${weight} w ${x1.toFixed(1)} ${yy.toFixed(1)} m ${x2.toFixed(1)} ${yy.toFixed(1)} l S`);
  }
  function text(value: string, x: number, yy: number, size = 10, bold = false, color = "0.19 0.22 0.26") {
    commands.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${yy.toFixed(1)} Tm (${pdfEscape(value)}) Tj ET`);
  }
  function finishPage() {
    if (!commands.length) return;
    text(`CA AUTOBODY  |  ANALYTICS REPORT`, margin, 24, 8, true, "0.44 0.48 0.53");
    text(`Page ${pageNumber}`, width - margin - 40, 24, 8, false, "0.44 0.48 0.53");
    line(margin, 37, width - margin);
    pages.push(commands.join("\n"));
    commands = [];
  }
  function startPage() {
    if (pageNumber) finishPage();
    pageNumber++;
    y = height - 60;
  }
  function room(required = 30) { if (y < 52 + required) startPage(); }
  function section(title: string) {
    room(45); y -= 15;
    text(title, margin, y, 13, true, "0.22 0.26 0.31");
    y -= 12; line(margin, y, width - margin); y -= 16;
  }
  function rows(entries: [string, string][], limit = 22) {
    const listed = entries.slice(0, limit);
    if (!listed.length) { room(18); text("No data reported for this period.", margin, y, 10, false, "0.49 0.52 0.55"); y -= 20; return; }
    for (const [name, value] of listed) {
      room(19);
      const maxChars = 80;
      const display = name.length > maxChars ? name.slice(0, maxChars - 3) + "..." : name;
      text(display, margin, y, 9);
      const px = width - margin - Math.max(30, value.length * 5.1);
      text(value, px, y, 9, true, "0.26 0.3 0.34");
      y -= 18;
    }
  }
  startPage();
  text("CA AUTOBODY", margin, y, 10, true, "0.58 0.41 0.2"); y -= 31;
  text("Website analytics report", margin, y, 23, true); y -= 20;
  text(`${report.period.start} to ${report.period.end}  |  GA4 & Search Console`, margin, y, 10, false, "0.43 0.49 0.54");
  y -= 24; line(margin, y, margin + usable, "0.6 0.43 0.22", 2); y -= 24;
  section("Website overview - Google Analytics 4");
  rows([
    ["Sessions", f.format(safe(report.overview.sessions))],
    ["Users", f.format(safe(report.overview.users))],
    ["Page views", f.format(safe(report.overview.pageViews))],
    ["Engagement rate", `${p.format(safe(report.overview.engagementRate))}%`],
  ]);
  section("Traffic channels");
  rows(report.trafficSources.map(row => [row.name, f.format(safe(row.value))]));
  section("Visitor devices");
  rows(report.devices.map(row => [row.name, f.format(safe(row.value))]));
  section("Most viewed pages");
  rows(report.topPages.map(row => [row.name, f.format(safe(row.value))]));
  section("Google Search Console");
  text(`Connection status: ${report.search.status.replace(/_/g, " ")}`, margin, y, 9); y -= 20;
  rows([
    ["Search clicks", f.format(safe(report.search.overview.clicks))],
    ["Search impressions", f.format(safe(report.search.overview.impressions))],
    ["Click-through rate", `${p.format(safe(report.search.overview.ctr))}%`],
    ["Average search position", p.format(safe(report.search.overview.position))],
  ]);
  section("Top search queries (clicks | impressions | CTR | position)");
  rows(report.search.topQueries.map(r => [r.name, `${f.format(safe(r.clicks))} | ${f.format(safe(r.impressions))} | ${p.format(safe(r.ctr))}% | ${p.format(safe(r.position))}`]));
  section("Top search pages (clicks | impressions | CTR | position)");
  rows(report.search.topPages.map(r => [r.name, `${f.format(safe(r.clicks))} | ${f.format(safe(r.impressions))} | ${p.format(safe(r.ctr))}% | ${p.format(safe(r.position))}`]));
  section("Daily sessions");
  rows(report.daily.map(r => [r.date, `${f.format(safe(r.sessions))} sessions | ${f.format(safe(r.users))} users | ${f.format(safe(r.pageViews))} views`]), 370);
  room(34); y -= 8;
  text("Source: Authorized GA4 and Google Search Console reporting.", margin, y, 8, false, "0.47 0.52 0.57"); y -= 13;
  text("Numbers reflect the selected reporting period; do not treat missing data as zero traffic.", margin, y, 8, false, "0.47 0.52 0.57");
  finishPage();

  // PDF 1.4 with standard Base14 fonts. ASCII-only streams make xref offsets exact.
  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  const catalogId = add("placeholder");
  const pagesId = add("placeholder");
  const normalId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const ids: number[] = [];
  for (const content of pages) {
    const contentsId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    ids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${normalId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentsId} 0 R >>`));
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(id => `${id} 0 R`).join(" ")}] >>`;
  let pdf = "%PDF-1.4\n%CA REPORT\n";
  const offsets = [0];
  objects.forEach((obj, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function downloadAnalyticsPdf(report: PdfAnalyticsReport) {
  const pdf = createAnalyticsPdf(report);
  const blob = new Blob([new Uint8Array(pdf).buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caautobody-analytics-${report.period.start}-to-${report.period.end}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
