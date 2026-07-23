export interface Staff {
  id: string;
  shopId: string;
  userId?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  role:
    | "Manager"
    | "Cashier"
    | "Sales Staff"
    | "Inventory Staff"
    | "Other"
    | "Admin"
    | "Other";
  branch: string;
  commissionType: "None" | "Percentage" | "Fixed";
  commissionRate: number;
  status: "Active" | "Inactive";
  joiningDate: Date | string;
  permissions: StaffPermissions;
  totalSales: number;
  totalOrders: number;
  commissionEarned: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  authProvider?: "firebase";
  authMigratedAt?: Date | string;
}

export interface StaffPermissions {
  invoices: PermissionSet;
  products: PermissionSet;
  inventory: PermissionSet;
  customers: PermissionSet;
  staff: PermissionSet;
  returns: PermissionSet;
  analytics: { view: boolean };
  settings: { view: boolean; edit: boolean };
}

export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}
