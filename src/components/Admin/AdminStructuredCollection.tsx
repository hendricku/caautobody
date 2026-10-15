"use client";
import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection, type CmsCollection } from "@/lib/cms/useCmsCollection";

type StructuredItem = { slug: string; title?: string; name?: string; seoTitle: string; eyebrow?: string; intro: string; body: string[]; image: string; bullets?: string[]; coordinates?: [number,number]; mapDescription?: string; status?: "draft" | "published" };
export default function AdminStructuredCollection({ collection, heading }: { collection: Extract<CmsCollection,"offers"|"areas">; heading: string }) {
  const { items, role, error, save, retire, reload } = useCmsCollection<StructuredItem>(collection);
  const [editing,setEditing] = useState<StructuredItem|null>(null);
  const [draft,setDraft] = useState<StructuredItem|null>(null);
  const [busy,setBusy] = useState(false);
  function edit(item?: StructuredItem) {
    const value = item ? { ...item, body: [...item.body] } : { slug:"",title:"",name:"",seoTitle:"",intro:"",image:"",body:[],bullets:[],coordinates:[0,0] as [number,number],mapDescription:"",status:"draft" as const };
    setEditing(value);setDraft(value);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();if (!draft) return;
    setBusy(true);
    const slug = draft.slug || (draft.title || draft.name || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
    try { await save({ ...draft,slug },editing?.slug);setEditing(null);setDraft(null); void Swal.fire({icon:"success",title:editing?.slug ? `${heading} updated` : `${heading} created`,timer:1700,showConfirmButton:false}); }
    catch (err) { void Swal.fire({icon:"error",text:err instanceof Error ? err.message : "Save failed"}); }
    finally {setBusy(false);}
  }
  async function remove(item: StructuredItem) {
    const confirmation = await Swal.fire({icon:"warning",title:`Retire ${item.title || item.name}?`,text:"The URL will no longer be published. Content remains in the database.",showCancelButton:true,confirmButtonText:"Retire",confirmButtonColor:"#9d3c36"});
    if (confirmation.isConfirmed) {try {await retire(item.slug);void Swal.fire({icon:"success",title:"Page retired",timer:1600,showConfirmButton:false});}catch(err){void Swal.fire({icon:"error",text:err instanceof Error?err.message:"Retirement failed"});}}
  }
  return <><div className="admin-page-head"><div><span>Content</span><h1>{heading}</h1><p>Published pages, drafts and SEO metadata are stored in Supabase.</p></div><button className="admin-primary" type="button" onClick={()=>edit()}>+ New {collection === "offers" ? "offer" : "area"}</button></div>
    {error ? <p role="alert" className="admin-note">{error}</p> : null}<div className="admin-toolbar"><span>{items.length} active and draft pages</span><button type="button" onClick={()=>void reload()}>Refresh CMS</button></div>
    <div className="admin-card-grid">{items.map(item=><article className="admin-content-card" key={item.slug}><img src={item.image || "/images/Banner.webp"} alt=""/><div><span>{item.status}</span><h2>{item.title || item.name}</h2><p>{item.intro}</p><small>/{collection === "offers" ? "offers" : "areas-we-serve"}/{item.slug}</small><div className="table-actions"><button type="button" onClick={()=>edit(item)}>Edit</button><button className="admin-danger" type="button" onClick={()=>void remove(item)}>Retire</button></div></div></article>)}</div>
    {draft ? <AdminModal title={`Edit ${heading}`} onClose={()=>{setDraft(null);setEditing(null);}}><form className="admin-form" onSubmit={event=>void submit(event)}>
      <label>{collection === "offers" ? "Title" : "Area name"}<input required value={collection==="offers" ? draft.title || "" : draft.name || ""} onChange={event=>setDraft({...draft,[collection === "offers" ? "title" : "name"]:event.target.value})}/></label>
      <label>Slug<input value={draft.slug} onChange={event=>setDraft({...draft,slug:event.target.value})}/></label><label>SEO title<input value={draft.seoTitle} onChange={event=>setDraft({...draft,seoTitle:event.target.value})}/></label>
      <CmsImageField id={`${collection}-featured-image`} label="Featured image" value={draft.image} onChange={image=>setDraft({...draft,image})}/><label>Intro<textarea rows={3} required value={draft.intro} onChange={event=>setDraft({...draft,intro:event.target.value})}/></label>
      <label>Body paragraphs (blank line between paragraphs)<textarea rows={6} value={draft.body.join("\n\n")} onChange={event=>setDraft({...draft,body:event.target.value.split(/\n\s*\n/)})}/></label>
      {collection==="offers" ? <><label>Eyebrow<input value={draft.eyebrow || ""} onChange={event=>setDraft({...draft,eyebrow:event.target.value})}/></label><label>Bullets<textarea rows={4} value={(draft.bullets || []).join("\n")} onChange={event=>setDraft({...draft,bullets:event.target.value.split("\n")})}/></label></> : <><label>Map description<textarea rows={3} value={draft.mapDescription || ""} onChange={event=>setDraft({...draft,mapDescription:event.target.value})}/></label><div className="admin-form-row">{([0,1] as const).map((index)=><label key={index}>{index===0 ? "Latitude" : "Longitude"}<input type="number" step="any" value={draft.coordinates?.[index] ?? 0} onChange={event=>{const c=[...(draft.coordinates || [0,0])] as [number,number];c[index]=Number(event.target.value);setDraft({...draft,coordinates:c});}}/></label>)}</div></>}
      <label>Status<select value={draft.status || "draft"} onChange={event=>setDraft({...draft,status:event.target.value as "draft"|"published"})}><option value="draft">Draft</option><option value="published" disabled={role==="editor"}>Published</option></select></label>
      <div className="admin-form-actions"><button type="button" onClick={()=>setDraft(null)}>Cancel</button><button className="admin-primary" type="submit" disabled={busy}>{busy?"Saving…":"Save changes"}</button></div>
    </form></AdminModal> : null}</>;
}
