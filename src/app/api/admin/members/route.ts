import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/cms/admin-server";
export async function GET(){
  const admin=await getAdmin(); if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(admin.role!=="admin")return NextResponse.json({error:"Admin role required"},{status:403});
  const {data,error}=await admin.client.from("cms_admin_members").select("user_id,role,active,created_at").order("created_at",{ascending:false});
  if(error){console.error("CMS members read failure",{code:error.code});return NextResponse.json({error:"Team members are temporarily unavailable"},{status:503});}
  return NextResponse.json({members:data},{headers:{"Cache-Control":"no-store"}});
}
