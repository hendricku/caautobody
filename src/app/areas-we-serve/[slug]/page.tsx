import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocationPage from "@/components/Public/LocationPage";
import { getPublishedLocationBySlug } from "@/lib/cms/public-content";
export async function generateStaticParams(){return [];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const location=await getPublishedLocationBySlug(slug);return location?{title:location.seoTitle,description:location.intro}:{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const location=await getPublishedLocationBySlug(slug);if(!location)notFound();return <LocationPage location={location}/>;}
