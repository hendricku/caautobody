import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocationPage from "@/components/Public/LocationPage";
import { locations } from "@/lib/siteContent";
export async function generateStaticParams(){return locations.map((location)=>({slug:location.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const location=locations.find((item)=>item.slug===slug);return location?{title:location.seoTitle,description:location.intro}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const location=locations.find((item)=>item.slug===slug);if(!location)notFound();return <LocationPage location={location!}/>;}
