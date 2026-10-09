import Button from "@/components/UI/Button";
import Link from "next/link";
export default function NotFound(){return <main className="thank-you"><div><span className="eyebrow">404</span><h1>That page isn't here.</h1><p>The route may have changed during the rebuild. Use the website navigation or return to the homepage.</p><div className="hero-actions"><Button href="/" variant="gold">Return home</Button><Button href="/sitemap" variant="outline">View sitemap</Button></div></div></main>}
