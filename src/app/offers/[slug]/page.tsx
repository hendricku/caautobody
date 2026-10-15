import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfferPage from "@/components/Public/OfferPage";
import { getPublishedOfferBySlug } from "@/lib/cms/public-content";
export async function generateStaticParams(){return [];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const offer=await getPublishedOfferBySlug(slug);return offer?{title:offer.seoTitle,description:offer.intro}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const offer=await getPublishedOfferBySlug(slug);if(!offer)notFound();return <OfferPage offer={offer}/>;}
