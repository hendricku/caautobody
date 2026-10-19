import Link from "next/link";

export default function ServiceBreadcrumbs({ current, className = "" }: { current: string; className?: string }) {
  return (
    <nav className={`service-breadcrumbs ${className}`.trim()} aria-label="Breadcrumb">
      <Link href="/services">Services</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
