"use client";
import { FormEvent,useEffect,useState } from "react";
import Swal from "sweetalert2";
type Hero={eyebrow:string;title:string;accent:string;description:string};
export default function HomeHeroEditor(){const [hero,setHero]=useState<Hero|null>(null);const [role,setRole]=useState("editor");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
useEffect(()=>{let active=true;fetch("/api/admin/settings/hero",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d;}).then(d=>{if(active){setHero(d.hero);setRole(d.role);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
async function submit(event:FormEvent){event.preventDefault();setBusy(true);try{const r=await fetch("/api/admin/settings/hero",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(hero)});const d=await r.json();if(!r.ok)throw Error(d.error);void Swal.fire({icon:"success",title:"Homepage updated",timer:1500,showConfirmButton:false});}catch(e){setError(e instanceof Error?e.message:"Unable to save");}finally{setBusy(false);}}
return <section className="admin-panel"><div className="panel-head"><h2>Homepage hero copy</h2></div>{error?<p role="alert" className="admin-note">{error}</p>:null}{hero?<form className="admin-form embedded" onSubmit={e=>void submit(e)}>{(["eyebrow","title","accent","description"] as const).map(key=><label key={key}>{key}<textarea rows={key==="description"?4:2} value={hero[key]} onChange={e=>setHero({...hero,[key]:e.target.value})}/></label>)}<button className="admin-primary" type="submit" disabled={busy||role==="editor"}>{busy?"Publishing…":"Publish hero copy"}</button></form>:<p>Loading homepage content…</p>}</section>;
}
