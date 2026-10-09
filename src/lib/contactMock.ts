export type EnquiryStatus = "new" | "in-progress" | "resolved";

export type ContactEnquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  service: string;
  message: string;
  status: EnquiryStatus;
  notificationRead: boolean;
  createdAt: string;
  brand?: "BYD" | "Lexus";
  vehicle?: string;
  claimStatus?: string;
  attachments?: string[];
  enquiryType?: "contact" | "brand-assessment";
};

const enquiryKey = "ca-admin-contact-enquiries";
export const contactMockEvent = "ca-admin-contact-updated";

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(contactMockEvent));
}

export function getContactEnquiries(): ContactEnquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(enquiryKey);
    return stored ? JSON.parse(stored) as ContactEnquiry[] : [];
  } catch {
    return [];
  }
}

export function saveContactEnquiries(items: ContactEnquiry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(enquiryKey, JSON.stringify(items));
  notify();
}

export function createContactEnquiry(input: Omit<ContactEnquiry, "id" | "status" | "notificationRead" | "createdAt">) {
  const enquiry: ContactEnquiry = {
    ...input,
    id: `enquiry-${Date.now()}`,
    status: "new",
    notificationRead: false,
    createdAt: new Date().toISOString(),
  };
  saveContactEnquiries([enquiry, ...getContactEnquiries()]);
  return enquiry;
}

export function markContactNotificationsRead() {
  const items = getContactEnquiries();
  if (items.some((item) => !item.notificationRead)) {
    saveContactEnquiries(items.map((item) => ({ ...item, notificationRead: true })));
  }
}
