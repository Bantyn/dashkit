export type TailoringJobType = 'alteration' | 'custom_stitching';
export type TailoringJobStatus = 'measurement_taken' | 'cutting' | 'stitching' | 'trial' | 'ready' | 'delivered';

export interface TailoringJob {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  phoneNumber?: string;
  
  type: TailoringJobType;
  status: TailoringJobStatus;
  
  tailorId?: string;
  tailorName?: string;
  
  deadline: string; // ISO date string
  
  // Dynamic measurement keys based on item (Shirt, Trouser, Suit)
  measurements?: Record<string, any>;
  
  notes?: string;
  amount: number;
  paidAmount: number;
  
  // For custom stitching where fabric is issued from inventory
  fabricIssued?: string;
  fabricLength?: number;
  
  createdAt: any;
  updatedAt: any;
}
