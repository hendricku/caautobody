import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/cms/admin-server";
import { serviceClient } from "@/lib/cms/service-client";
import { assertEmailConfiguration, sendEnquiryEmail } from "@/lib/email/resend";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export const runtime = "nodejs";

const maxFileSize = 8 * 1024 * 1024;
const maxTotalFileSize = 20 * 1024 * 1024;
const valuesSchema = z.object({
  submissionId: z.string().uuid(),
  enquiryType: z.enum(["contact", "brand-assessment"]),
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(5).max(80),
  email: z.string().trim().email().max(254).or(z.literal("")),
  suburb: z.string().trim().max(160),
  service: z.string().trim().min(1).max(160),
  message: z.string().trim().max(10000),
  brand: z.enum(["BYD", "Lexus"]).optional(),
  vehicle: z.string().trim().max(160),
  claimStatus: z.string().trim().max(80),
  company: z.string().max(0),
}).strict().superRefine((value, context) => {
  if (value.enquiryType === "contact" && (!value.email || !value.message)) context.addIssue({ code: "custom", message: "Contact details are incomplete" });
  if (value.enquiryType === "brand-assessment" && !value.brand) context.addIssue({ code: "custom", message: "Brand assessment details are incomplete" });
});

type Upload = { filename: string; content: Buffer; contentType: string };

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  return "jpg";
}

function hasSupportedImageSignature(bytes: Buffer, type: string) {
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const heif = bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp" && /heic|heix|hevc|hevx|mif1|msf1/.test(bytes.subarray(8, 32).toString("ascii"));
  return (type === "image/jpeg" && jpeg) || (type === "image/png" && png) || (type === "image/webp" && webp) || ((type === "image/heic" || type === "image/heif") && heif);
}

async function uploadsFrom(form: FormData): Promise<Upload[] | null> {
  const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 3 || files.some((file) => file.size > maxFileSize) || files.reduce((total, file) => total + file.size, 0) > maxTotalFileSize) return null;
  const uploads: Upload[] = [];
  for (const [index, file] of files.entries()) {
    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) return null;
    const content = Buffer.from(await file.arrayBuffer());
    if (!hasSupportedImageSignature(content, file.type)) return null;
    uploads.push({ filename: `damage-photo-${index + 1}.${extensionFor(file.type)}`, content, contentType: file.type });
  }
  return uploads;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  const parsed = valuesSchema.safeParse({
    submissionId: formValue(form, "submissionId"), enquiryType: formValue(form, "enquiryType"), name: formValue(form, "name"), phone: formValue(form, "phone"), email: formValue(form, "email"),
    suburb: formValue(form, "suburb"), service: formValue(form, "service"), message: formValue(form, "message"), brand: formValue(form, "brand") || undefined,
    vehicle: formValue(form, "vehicle"), claimStatus: formValue(form, "claimStatus"), company: formValue(form, "company"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Please check the required fields and try again." }, { status: 400 });
  const uploads = await uploadsFrom(form);
  if (!uploads) return NextResponse.json({ error: "Photos must be valid images. Upload up to three files, 8 MB each." }, { status: 400 });

  try {
    assertEmailConfiguration();
    const database = serviceClient();
    const values = parsed.data;
    const findSubmission = () => database.from("cms_enquiries").select("id,delivery_status").eq("client_submission_id", values.submissionId).maybeSingle();
    const { data: existing, error: lookupError } = await findSubmission();
    if (lookupError) return NextResponse.json({ error: "Submissions are temporarily unavailable. Please call us instead." }, { status: 503 });
    if (existing?.delivery_status === "sent") return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    let enquiry = existing;
    if (!enquiry) {
      const allowed = await consumePublicRateLimit({ request, scope: "public-enquiry", limit: 5, windowSeconds: 15 * 60 });
      if (!allowed) return NextResponse.json({ error: "Too many submissions. Please wait a few minutes or call us." }, { status: 429 });
      const inserted = await database.from("cms_enquiries").insert({
        client_submission_id: values.submissionId, enquiry_type: values.enquiryType, brand: values.brand || null, full_name: values.name, phone: values.phone, email: values.email, suburb: values.suburb,
        service: values.service, vehicle: values.vehicle, claim_status: values.claimStatus, message: values.message, attachment_names: uploads.map((file) => file.filename),
      }).select("id,delivery_status").single();
      if (inserted.error && inserted.error.code !== "23505") return NextResponse.json({ error: "Submissions are temporarily unavailable. Please call us instead." }, { status: 503 });
      if (inserted.error) {
        const retriedLookup = await findSubmission();
        if (retriedLookup.error || !retriedLookup.data) return NextResponse.json({ error: "Submissions are temporarily unavailable. Please call us instead." }, { status: 503 });
        enquiry = retriedLookup.data;
      } else enquiry = inserted.data;
    }
    if (!enquiry) return NextResponse.json({ error: "Submissions are temporarily unavailable. Please call us instead." }, { status: 503 });

    try {
      await sendEnquiryEmail({
        enquiryId: enquiry.id, enquiryType: values.enquiryType, brand: values.brand, name: values.name, phone: values.phone, email: values.email || undefined,
        suburb: values.suburb || undefined, service: values.service, vehicle: values.vehicle || undefined, claimStatus: values.claimStatus || undefined,
        message: values.message || undefined, attachments: uploads,
      });
      await database.from("cms_enquiries").update({ delivery_status: "sent", updated_at: new Date().toISOString() }).eq("id", enquiry.id);
    } catch {
      console.error("Resend enquiry delivery failed", { enquiryId: enquiry.id, provider: "resend" });
      await database.from("cms_enquiries").update({ delivery_status: "failed", updated_at: new Date().toISOString() }).eq("id", enquiry.id);
      return NextResponse.json({ error: "We could not send your enquiry. Please call us on 03 9772 7411." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Submissions are temporarily unavailable. Please call us instead." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
