import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfferPage from "@/components/Public/OfferPage";
import { offers } from "@/lib/siteContent";
export async function generateStaticParams(){return offers.map((offer)=>({slug:offer.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const offer=offers.find((item)=>item.slug===slug);return offer?{title:offer.seoTitle,description:offer.intro}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const offer=offers.find((item)=>item.slug===slug);if(!offer)notFound();return <OfferPage offer={offer!}/>;}
