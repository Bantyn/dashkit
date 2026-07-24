export type TabKey = "dashboard" | "pos" | "orders" | "products" | "inventory" | "customers" | "profile" | "analytics" | "staff";

export interface PermissionActions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface StaffPermissionsObject {
  invoices?: PermissionActions;
  products?: PermissionActions;
  inventory?: PermissionActions;
  customers?: PermissionActions;
  staff?: PermissionActions;
  analytics?: { view: boolean };
  settings?: { view: boolean; edit: boolean };
}

export type StaffPermissions = string[] | StaffPermissionsObject;

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  shopId: string;
  shopName: string;
  branch?: string;
  permissions: StaffPermissions;
  totalOrders?: number;
  totalSales?: number;
  commissionEarned?: number;
  efficiency?: number;
  rank?: number;
  token?: string;
}

export type InvoiceStatus = "Paid" | "Pending" | "Overdue";

export type Invoice = {
  id: string;
  customer: string;
  amount: string;
  status: InvoiceStatus;
  date: string;
};

export type Product = {
  id: string;
  name: string;
  stock: number;
  price: string;
  category: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  tier: string;
  openInvoices: number;
};

export type QuickAction = {
  title: string;
  caption: string;
  target: TabKey;
};
