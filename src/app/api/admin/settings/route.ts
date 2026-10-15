import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { site } from "@/lib/siteContent";
export async function GET() {
  const admin = await getAdmin(); if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data,error} = await admin.client.from("cms_site_settings").select("value").eq("key","site").maybeSingle();
  if (error) { console.error("CMS settings read failure", { code: error.code }); return NextResponse.json({error:"Settings are temporarily unavailable"},{status:503}); }
  return NextResponse.json({site: data?.value || site,role:admin.role},{headers:{"Cache-Control":"no-store"}});
}
export async function PATCH(request:NextRequest) {
  if(!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  const admin=await getAdmin();if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(admin.role==="editor")return NextResponse.json({error:"Publishing permissions required"},{status:403});
  const body=await request.json().catch(()=>null);
  if(!body || !["name","phone","phoneHref","email","address"].every((key)=>typeof body[key]==="string" && body[key].length<500))return NextResponse.json({error:"Invalid site settings"},{status:400});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))return NextResponse.json({error:"Invalid email"},{status:400});
  const {error}=await admin.client.from("cms_site_settings").upsert({key:"site",value:{name:body.name,phone:body.phone,phoneHref:body.phoneHref,email:body.email,address:body.address},is_public:true},{onConflict:"key"});
  if(error){ console.error("CMS settings save failure", { code: error.code }); return NextResponse.json({error:"Settings could not be saved. Please try again."},{status:503}); }
  revalidatePath("/");revalidatePath("/contact");
  return NextResponse.json({ok:true});
}
