export interface OnlineCustomer {
  id: string; // Firebase Auth UID
  email: string;
  mobile: string;
  displayName: string;
  role: 'online_customer';
  shopId?: string;
  createdAt: Date;
  addresses?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    type: 'home' | 'work' | 'other';
  }[];
}
