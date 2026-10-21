import "server-only";
import { Resend } from "resend";
import { z } from "zod";

export type EnquiryAttachment = { filename: string; content: Buffer; contentType: string };

type EnquiryEmail = {
  enquiryId: string;
  enquiryType: "contact" | "brand-assessment";
  brand?: string;
  name: string;
  phone: string;
  email?: string;
  suburb?: string;
  service: string;
  vehicle?: string;
  claimStatus?: string;
  message?: string;
  attachments: EnquiryAttachment[];
};

type MailConfiguration = { apiKey: string; from: string; recipient: string };

let resend: Resend | undefined;

function readConfiguration(): MailConfiguration {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim();
  const email = z.string().email().max(254);

  if (!apiKey || !fromEmail || !recipient || !email.safeParse(fromEmail).success || !email.safeParse(recipient).success) {
    throw new Error("Email delivery is not configured");
  }

  return { apiKey, from: `CA Autobody <${fromEmail}>`, recipient };
}

function client() {
  if (resend) return resend;
  resend = new Resend(readConfiguration().apiKey);
  return resend;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function field(label: string, value: string) {
  return `<tr><th align="left" style="padding:0 18px 12px 0;color:#665f55;font-size:12px;font-weight:700;vertical-align:top">${escapeHtml(label)}</th><td style="padding:0 0 12px;color:#1a1917;font-size:14px;line-height:1.55">${escapeHtml(value)}</td></tr>`;
}

function textBody(input: EnquiryEmail) {
  const lines = [
    `Enquiry type: ${input.enquiryType === "brand-assessment" ? `${input.brand} repair assessment` : "Contact enquiry"}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email || "Not provided"}`,
    `Suburb: ${input.suburb || "Not provided"}`,
    `Service: ${input.service}`,
  ];
  if (input.enquiryType === "brand-assessment") {
    lines.push(`Vehicle: ${input.vehicle || "Not provided"}`, `Claim status: ${input.claimStatus || "Not provided"}`);
  }
  lines.push("", "Message:", input.message || "No additional message supplied.");
  if (input.attachments.length) lines.push("", `Attached damage photos: ${input.attachments.map((file) => file.filename).join(", ")}`);
  return lines.join("\n");
}

function htmlBody(input: EnquiryEmail) {
  const type = input.enquiryType === "brand-assessment" ? `${input.brand} repair assessment` : "Contact enquiry";
  const attachmentNote = input.attachments.length ? `<p style="margin:22px 0 0;color:#665f55;font-size:13px;line-height:1.6">${input.attachments.length} damage photo${input.attachments.length === 1 ? "" : "s"} attached.</p>` : "";
  const assessmentFields = input.enquiryType === "brand-assessment"
    ? `${field("Vehicle", input.vehicle || "Not provided")}${field("Claim status", input.claimStatus || "Not provided")}`
    : "";
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f4f1eb;font-family:Arial,sans-serif;color:#1a1917"><main style="max-width:640px;margin:0 auto;padding:28px 16px"><section style="overflow:hidden;background:#fff;border:1px solid #ddd5c9"><header style="padding:28px 30px;background:#151513;color:#fff"><p style="margin:0 0 10px;color:#d4a957;font-size:11px;font-weight:700;letter-spacing:1.4px">CA AUTOBODY</p><h1 style="margin:0;font-size:25px;line-height:1.2">New website enquiry</h1></header><section style="padding:30px"><p style="margin:0 0 24px;color:#665f55;font-size:14px;line-height:1.65">A customer has submitted a ${escapeHtml(type.toLowerCase())}.</p><table role="presentation" style="width:100%;border-collapse:collapse">${field("Name", input.name)}${field("Phone", input.phone)}${field("Email", input.email || "Not provided")}${field("Suburb", input.suburb || "Not provided")}${field("Service", input.service)}${assessmentFields}</table><div style="margin-top:14px;padding-top:20px;border-top:1px solid #ddd5c9"><p style="margin:0 0 8px;color:#665f55;font-size:12px;font-weight:700">MESSAGE</p><p style="margin:0;color:#1a1917;font-size:14px;line-height:1.65;white-space:pre-wrap">${escapeHtml(input.message || "No additional message supplied.")}</p></div>${attachmentNote}</section><footer style="padding:17px 30px;border-top:1px solid #ddd5c9;color:#776f64;font-size:11px;line-height:1.5">This notification was sent from the CA Autobody website.</footer></section></main></body></html>`;
}

export function assertEmailConfiguration() {
  readConfiguration();
}

export async function sendEnquiryEmail(input: EnquiryEmail) {
  const config = readConfiguration();
  const subject = input.enquiryType === "brand-assessment" ? `New ${input.brand} repair assessment` : "New website enquiry";
  const { data, error } = await client().emails.send({
    from: config.from,
    to: [config.recipient],
    replyTo: input.email || undefined,
    subject,
    text: textBody(input),
    html: htmlBody(input),
    attachments: input.attachments.map((file) => ({ filename: file.filename, content: file.content, contentType: file.contentType })),
  }, { idempotencyKey: `enquiry/${input.enquiryId}/business` });

  if (error) throw new Error("Email delivery failed");
  return data;
}
