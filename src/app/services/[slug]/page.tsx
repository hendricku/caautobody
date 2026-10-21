import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicePage from "@/components/Public/ServicePage";
import { services } from "@/lib/siteContent";
import { getApprovedBrandServiceCopy, getEditorialServiceCopy } from "@/lib/originalServiceCopy";
import { brandRepairContent } from "@/lib/brandRepairContent";
import { getPublishedServiceBySlug, getPublishedServices } from "@/lib/cms/public-content";
export async function generateStaticParams(){return services.map((service)=>({slug:service.slug}));}
export const revalidate = 60;
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const service=await getPublishedServiceBySlug(slug);const presentation="presentation" in (service ?? {}) ? service?.presentation : undefined;const sourceCopy=presentation?.variant === "editorial" ? presentation.data : getApprovedBrandServiceCopy(slug) ?? getEditorialServiceCopy(slug);const sourceIntro=sourceCopy?.introParagraphs.join(" ");const brandDescription=presentation?.variant === "brand" ? presentation.data.seoDescription : sourceCopy?.seoDescription ?? brandRepairContent[slug]?.seoDescription;return service?{title:{absolute:service.seoTitle},description:brandDescription ?? (sourceIntro || service.intro).slice(0,160), alternates:{canonical:`/services/${slug}`}}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const [service, relatedServices]=await Promise.all([getPublishedServiceBySlug(slug),getPublishedServices()]);if(!service)notFound();return <ServicePage service={service} relatedServices={relatedServices}/>;}
