"use client";

import { useEffect } from "react";

/** Presentation-only textarea sizing. Never touches React form values or handlers. */
export default function AdminAutoGrow({ route }: { route: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".admin-root");
    if (!root) return;
    const fit = (target: HTMLTextAreaElement) => {
      if (!target.isConnected || target.offsetParent === null) return;
      target.style.height = "auto";
      target.style.height = `${Math.max(target.scrollHeight + 2, 90)}px`;
    };
    const visit = (node: ParentNode) => node.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(fit);
    const input = (event: Event) => {
      if (event.target instanceof HTMLTextAreaElement && root.contains(event.target)) fit(event.target);
    };
    visit(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") for (const node of mutation.addedNodes) {
          if (node instanceof HTMLTextAreaElement) fit(node);
          else if (node instanceof HTMLElement) visit(node);
        }
        if (mutation.type === "attributes" && mutation.target instanceof HTMLTextAreaElement) fit(mutation.target);
      }
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "rows"] });
    root.addEventListener("input", input);
    const start = requestAnimationFrame(() => visit(root));
    return () => { cancelAnimationFrame(start); root.removeEventListener("input", input); observer.disconnect(); };
  }, [route]);
  return null;
}
