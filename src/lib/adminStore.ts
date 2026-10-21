"use client";
import { useCallback, useEffect, useState } from "react";

export function useLocalCollection<T>(key:string, seed:T[], options?: { mergeSeedById?: boolean; legacyKey?: string; legacyFilter?: (item: T) => boolean }){
  const [items,setItems]=useState<T[]>(seed);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    try{
      const current=window.localStorage.getItem(key);
      const stored=current ?? (options?.legacyKey ? window.localStorage.getItem(options.legacyKey) : null);
      if(stored) {
        const loaded = JSON.parse(stored) as T[];
        const parsed = current === null && options?.legacyFilter ? loaded.filter(options.legacyFilter) : loaded;
        if (options?.mergeSeedById) {
          const id = (item: T) => (item as { id?: string }).id;
          const storedById = new Map(parsed.map((item) => [id(item), item]));
          const merged = seed.map((item) => storedById.get(id(item)) || item);
          const additions = parsed.filter((item) => !seed.some((seedItem) => id(seedItem) === id(item)));
          setItems([...merged, ...additions]);
        } else setItems(parsed);
      }
    }catch{}
    setReady(true);
  },[key,options?.mergeSeedById,options?.legacyKey,options?.legacyFilter,seed]);
  useEffect(()=>{
    if(!ready) return;
    window.localStorage.setItem(key,JSON.stringify(items));
  },[items,key,ready]);
  const reset=useCallback(()=>setItems(seed),[seed]);
  return {items,setItems,ready,reset};
}
