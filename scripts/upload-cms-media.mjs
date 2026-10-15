import { readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const sourceDirectory = join(root, "public/images");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Run this locally with server-only environment variables.");
}

const mimeTypes = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const files = walk(sourceDirectory);
let uploaded = 0;

for (const file of files) {
  const extension = extname(file).toLowerCase();
  const contentType = mimeTypes[extension];
  if (!contentType) throw new Error(`Unsupported CMS media type: ${relative(root, file)}`);

  const legacyPath = `/${relative(join(root, "public"), file).replaceAll("\\", "/")}`;
  const storagePath = `legacy/${basename(file)}`;
  const { error: uploadError } = await supabase.storage.from("cms-public").upload(storagePath, readFileSync(file), {
    contentType,
    cacheControl: "31536000",
    upsert: true,
  });
  if (uploadError) throw new Error(`Upload failed for ${legacyPath}: ${uploadError.message}`);

  const { data: updated, error: recordError } = await supabase
    .from("cms_media_assets")
    .update({ storage_ready: true, storage_path: storagePath })
    .eq("legacy_path", legacyPath)
    .select("id");
  if (recordError) throw new Error(`Database update failed for ${legacyPath}: ${recordError.message}`);
  if (!updated?.length) throw new Error(`No manifest record found for ${legacyPath}. Regenerate and apply the seed before uploading.`);
  uploaded += 1;
}

console.log(`Uploaded and marked ${uploaded} CMS media assets.`);
