"use client";
import { useEffect,useState } from "react";

type Membership = {user_id:string;role:string;active:boolean;created_at:string};
export default function TeamPage(){
 const [members,setMembers]=useState<Membership[]>([]);const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/admin/members",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error || "Unavailable");return data;}).then(data=>{if(active)setMembers(data.members);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[]);
 return <><div className="admin-page-head"><div><span>Security</span><h1>Team &amp; access</h1><p>Live role memberships from Supabase — never browser-local mock accounts.</p></div></div><section className="admin-panel"><div className="panel-head"><div><span>Active identities</span><h2>Authorized CMS members</h2></div><small>{members.length} records</small></div>{error ? <p role="alert" className="admin-note">{error}</p> : null}<div className="admin-table admin-table--team"><div className="admin-table__row head"><span>User ID</span><span>Role</span><span>Status</span><span>Added</span></div>{members.map(m=><div className="admin-table__row" key={m.user_id}><strong>{m.user_id}</strong><span>{m.role}</span><span>{m.active?"Active":"Suspended"}</span><span>{new Date(m.created_at).toLocaleDateString("en-AU")}</span></div>)}</div></section><section className="admin-panel"><div className="panel-head"><h2>Controlled provisioning</h2></div><p className="admin-note">Provision staff identities in Supabase Auth and assign memberships using reviewed admin SQL. The website intentionally does not allow self-granted roles or mock staff invitations. Only an Admin may view this directory.</p></section></>;
}
