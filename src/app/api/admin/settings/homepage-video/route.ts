import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { youtubeVideoId } from "@/lib/homepage-video";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await admin.client.from("cms_page_sections").select("section_key,content").eq("page_key", "home").in("section_key", ["about-video", "about-video-draft"]);
  if (error) return NextResponse.json({ error: "Video settings unavailable." }, { status: 503 });
  const findId = (key: string) => youtubeVideoId(data?.find((row) => row.section_key === key)?.content?.videoId);
  return NextResponse.json({ published: findId("about-video") || "", draft: findId("about-video-draft"), role: admin.role }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const allowed = await consumePublicRateLimit({ request, scope: "homepage-video-save", limit: 30, windowSeconds: 60, identity: admin.user.id, identityOnly: true });
    if (!allowed) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  } catch { return NextResponse.json({ error: "Video settings are temporarily unavailable." }, { status: 503 }); }
  const body = await request.json().catch(() => null);
  if (!body || !["draft", "publish"].includes(body.action)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (body.action === "publish" && admin.role === "editor") return NextResponse.json({ error: "Publisher role required" }, { status: 403 });
  let videoId: string | null = null;
  if (body.action === "draft") videoId = youtubeVideoId(body.url);
  else {
    const { data, error } = await admin.client.from("cms_page_sections").select("content").eq("page_key", "home").eq("section_key", "about-video-draft").eq("status", "draft").maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to read the saved draft." }, { status: 503 });
    videoId = youtubeVideoId(data?.content?.videoId);
  }
  if (!videoId) return NextResponse.json({ error: "Enter a valid YouTube link and save the draft first." }, { status: 400 });
  const { error } = await admin.client.from("cms_page_sections").upsert({ page_key: "home", section_key: body.action === "draft" ? "about-video-draft" : "about-video", content: { videoId }, status: body.action === "draft" ? "draft" : "published" }, { onConflict: "page_key,section_key" });
  if (error) return NextResponse.json({ error: "Video could not be saved. Please try again." }, { status: 503 });
  if (body.action === "publish") revalidatePath("/");
  return NextResponse.json({ ok: true, videoId }, { headers: { "Cache-Control": "no-store" } });
}
