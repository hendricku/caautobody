import { fetchLiveBlogs } from "@/lib/liveBlogImport";

export async function GET() {
  try {
    const blogs = await fetchLiveBlogs();
    return Response.json(blogs, { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" } });
  } catch {
    return Response.json({ message: "Live blog import is temporarily unavailable." }, { status: 502 });
  }
}
