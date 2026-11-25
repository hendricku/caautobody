// Updates only CA Autobody's call links when Google supplies a forwarding number.
const BUSINESS_NUMBERS = new Set(["0397727411", "61397727411"]);
const DISPLAY_NUMBER = /03\s*9772\s*7411/g;

export function createCallForwardingController(doc: Document) {
  let formatted = "";
  let dialNumber = "";
  let previousFormatted = "";
  let observer: MutationObserver | undefined;
  let running = false;
  let scheduled = false;
  const changedLinks = new WeakMap<HTMLAnchorElement, string>();

  function replaceNumber(text: string): string {
    let result = text.replace(DISPLAY_NUMBER, formatted);
    if (previousFormatted && previousFormatted !== formatted) {
      result = result.split(previousFormatted).join(formatted);
    }
    return result;
  }

  function sync() {
    scheduled = false;
    if (!running || !dialNumber) return;
    for (const link of doc.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')) {
      const href = link.getAttribute("href") || "";
      const digits = href.slice(4).replace(/\D/g, "");
      // Leave links repurposed by the application for another number untouched.
      if (!BUSINESS_NUMBERS.has(digits) && href !== changedLinks.get(link)) continue;
      const target = "tel:" + dialNumber;
      if (href !== target) link.setAttribute("href", target);
      changedLinks.set(link, target);

      const walker = doc.createTreeWalker(link, 4);
      const textNodes: Text[] = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
      for (const node of textNodes) {
        const updated = replaceNumber(node.data);
        if (node.data !== updated) node.data = updated;
      }
      for (const attribute of ["aria-label", "title"]) {
        const value = link.getAttribute(attribute);
        if (value) {
          const updated = replaceNumber(value);
          if (updated !== value) link.setAttribute(attribute, updated);
        }
      }
    }
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(sync);
  }

  function observe() {
    if (!running || !dialNumber || observer || !doc.defaultView) return;
    observer = new doc.defaultView.MutationObserver((records) => {
      if (records.some((record) => {
        if (record.type === "attributes") return true;
        const parent = record.target.nodeType === 1 ? record.target as Element : record.target.parentElement;
        if (parent?.closest('a[href^="tel:"]')) return true;
        return Array.from(record.addedNodes).some((node) =>
          node.nodeType === 1 && ((node as Element).matches('a[href^="tel:"]') || Boolean((node as Element).querySelector('a[href^="tel:"]')))
        );
      })) scheduleSync();
    });
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href", "aria-label", "title"] });
  }

  return {
    start() {
      running = true;
      sync();
      observe();
    },
    stop() {
      running = false;
      observer?.disconnect();
      observer = undefined;
    },
    setForwardingNumber(display: string, dial: string) {
      if (typeof display !== "string" || typeof dial !== "string") return;
      const safeDisplay = display.trim();
      const safeDial = dial.trim();
      if (!/^[+()\d\s-]{6,32}$/.test(safeDisplay) || !/^\+?\d{8,15}$/.test(safeDial)) return;
      previousFormatted = formatted;
      formatted = safeDisplay;
      dialNumber = safeDial;
      sync();
      observe();
    },
  };
}
