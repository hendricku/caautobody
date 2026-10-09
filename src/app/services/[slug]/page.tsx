import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicePage from "@/components/Public/ServicePage";
import { services } from "@/lib/siteContent";
import { originalServiceCopy } from "@/lib/originalServiceCopy";
export async function generateStaticParams(){return services.map((service)=>({slug:service.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const service=services.find((item)=>item.slug===slug);return service?{title:{absolute:service.seoTitle},description:(originalServiceCopy[slug]?.introParagraphs.join(" ") || service.intro).slice(0,160), alternates:{canonical:`/services/${slug}`}}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const service=services.find((item)=>item.slug===slug);if(!service)notFound();return <ServicePage service={service!}/>;}
