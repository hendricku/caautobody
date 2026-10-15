"use client";
import Icon from "@/components/UI/Icon";
export default function AdminModal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
  return <div className="admin-modal" role="dialog" aria-modal="true"><button className="admin-modal__backdrop" onClick={onClose} aria-label="Close"/><div className="admin-modal__panel"><div className="admin-modal__head"><div><small>CA Autobody Admin</small><h2>{title}</h2></div><button onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</div></div>
}
