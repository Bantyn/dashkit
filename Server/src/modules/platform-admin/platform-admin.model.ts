export interface PlatformAdmin {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  userId: string;
  primaryRoleId?: string;
  linkedShopId?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
