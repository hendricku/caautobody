import "server-only";
import { Resend } from "resend";
import { z } from "zod";

export async function sendAdminOtpEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !z.string().email().safeParse(from).success || !/^\d{6}$/.test(code)) throw new Error("Admin email delivery is unavailable");
  const { error } = await new Resend(apiKey).emails.send({
    from: `CA Autobody <${from}>`,
    to: [email],
    subject: "Your CA Autobody admin sign-in code",
    text: `Your CA Autobody admin sign-in code is ${code}.\n\nEnter this code on the admin sign-in page. Use the latest code only.\nIf you did not request it, you can ignore this email. Do not share this code.`,
    html: `<html lang="en"><body style="margin:0;padding:32px 16px;background:#f4f1eb;font-family:Arial,sans-serif;color:#171614"><main style="max-width:500px;margin:auto;border:1px solid #d7cdbd;background:#fff;padding:32px"><p style="color:#8a6428;font-size:12px;font-weight:700">CA AUTOBODY ADMINISTRATION</p><h1 style="font-size:28px;line-height:1.2">Your sign-in code</h1><p style="line-height:1.6">Enter this one-time code on the admin sign-in page.</p><p style="padding:20px;background:#f4f1eb;font-size:34px;letter-spacing:8px;font-weight:700;text-align:center">${code}</p><p style="font-size:13px;line-height:1.6;color:#655d51">Use the latest code only. If you did not request it, you can ignore this email. Do not share this code.</p></main></body></html>`,
  });
  if (error) throw new Error("Admin email delivery is unavailable");
}
