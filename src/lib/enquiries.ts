export type EnquiryStatus = "new" | "in-progress" | "resolved" | "archived";
export type EnquiryType = "contact" | "brand-assessment";

export type ContactEnquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  service: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  brand?: string;
  vehicle?: string;
  claimStatus?: string;
  attachments?: string[];
  enquiryType: EnquiryType;
  deliveryStatus?: "pending" | "sent" | "failed";
};
