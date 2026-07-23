export interface SupportTicket {
  id?: string;
  shopId: string;
  shopName: string;
  reporterEmail: string;
  subject: string;
  description: string;
  status: "open" | "replied" | "closed";
  adminReply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
