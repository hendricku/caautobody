"use client";
import { announceCmsChange, CMS_SYNC_STORAGE_KEY, readCmsSyncNotice } from "@/lib/cms/cms-sync";
import { FormEvent,useEffect,useRef,useState } from "react";
import Swal from "sweetalert2";
import { site } from "@/lib/siteContent";
import HomeHeroEditor from "@/components/Admin/HomeHeroEditor";
export default function SettingsPage(){
  const [form,setForm]=useState(site);const [role,setRole]=useState("editor");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [remoteUpdate,setRemoteUpdate]=useState(false);const dirtyRef=useRef(false);const snapshotRef=useRef("");
  useEffect(() => {
    let alive = true;
    async function load(silent = false) {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Settings unavailable");
        if (!alive) return;
        const nextSnapshot = JSON.stringify(data.site);
        if (!dirtyRef.current) { setForm(data.site); setRole(data.role); setRemoteUpdate(false); snapshotRef.current=nextSnapshot; }
        else if (snapshotRef.current && snapshotRef.current !== nextSnapshot) setRemoteUpdate(true);
      } catch (reason) { if (!silent && alive) setError(reason instanceof Error ? reason.message : "Settings unavailable"); }
    }
    void load();
    const sync = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(sync, 20_000);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CMS_SYNC_STORAGE_KEY && readCmsSyncNotice(event.newValue)?.collection === "settings") sync();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", sync);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("storage", onStorage); document.removeEventListener("visibilitychange", sync); };
  }, []);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Save failed");dirtyRef.current=false;snapshotRef.current=JSON.stringify(form);setRemoteUpdate(false);announceCmsChange("settings");void Swal.fire({icon:"success",title:"Settings saved",timer:1600,showConfirmButton:false});}catch(err){setError(err instanceof Error?err.message:"Save failed");}finally{setBusy(false);}}
  return <><div className="admin-page-head"><div><span>Configuration</span><h1>Settings</h1><p>Site identity saved in Supabase CMS settings.</p></div></div><div className="admin-two-col settings-grid"><section className="admin-panel"><div className="panel-head"><h2>General settings</h2></div>{error?<p role="alert" className="admin-note">{error}</p>:null}{remoteUpdate?<p className="admin-note" role="status">Remote settings may have changed. Finish your unsaved edits or reopen this page to review the latest values.</p>:null}<form className="admin-form embedded" onChangeCapture={()=>{dirtyRef.current=true;}} onSubmit={event=>void submit(event)}><label>Site name<input value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></label><label>Primary phone<input value={form.phone} onChange={event=>setForm({...form,phone:event.target.value})}/></label><label>Telephone number (international format)<input value={form.phoneHref} onChange={event=>setForm({...form,phoneHref:event.target.value})}/></label><label>Email<input type="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></label><label>Address<textarea rows={3} value={form.address} onChange={event=>setForm({...form,address:event.target.value})}/></label><button className="admin-primary" type="submit" disabled={busy||role==="editor"}>{busy?"Saving…":"Save website settings"}</button></form></section><section className="admin-panel"><div className="panel-head"><h2>Integrations</h2></div><div className="integration-list"><div><b>Google Tag Manager</b><span>Set in environment</span><small>NEXT_PUBLIC_GTM_ID</small></div><div><b>GA4</b><span>Set in environment</span><small>NEXT_PUBLIC_GA4_ID</small></div><div><b>Supabase</b><span>Secured CMS</span><small>Auth + RLS</small></div></div></section></div><HomeHeroEditor /></>;
}
