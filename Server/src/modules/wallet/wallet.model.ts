export interface Wallet {
  shopId: string;
  smsCredits: number;
  whatsappCredits: number;
  updatedAt: Date;
}

export interface CreditPack {
  id?: string;
  type: "sms" | "whatsapp";
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id?: string;
  shopId: string;
  type: "sms" | "whatsapp";
  amount: number; // positive for purchase, negative for usage
  description: string;
  referenceId?: string; // payment id or campaign id
  createdAt: Date;
}
