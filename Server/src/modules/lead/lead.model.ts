export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  message?: string;
  type: 'contact' | 'demo' | 'enterprise';
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
}
