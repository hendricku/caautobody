"use client";

import Link from "next/link";

// Keep a malformed historical record from stranding an editor on a blank page.
// The API hydrates known legacy layouts; this is the safe final fallback.
export default function ServiceEditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-empty"><strong>We could not open this service editor.</strong><p>No content was changed. Try again, or return to Services and choose another page.</p><div className="table-actions"><button type="button" onClick={reset}>Try again</button><Link href="/caautobodyadmin/services">Back to Services</Link></div></div>;
}
