import type { Customer, Invoice, Product, QuickAction, TabKey } from "../types";

export const tabs: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Home" },
  { key: "pos", label: "POS" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "customers", label: "Customers" },
  { key: "profile", label: "Profile" },
];

export const invoices: Invoice[] = [
  {
    id: "INV-2401",
    customer: "Aarav Textiles",
    amount: "Rs 18,400",
    status: "Pending",
    date: "12 Mar",
  },
  {
    id: "INV-2398",
    customer: "Mira Boutique",
    amount: "Rs 9,750",
    status: "Paid",
    date: "11 Mar",
  },
  {
    id: "INV-2391",
    customer: "Urban Threads",
    amount: "Rs 22,190",
    status: "Overdue",
    date: "09 Mar",
  },
  {
    id: "INV-2385",
    customer: "Saanvi Studio",
    amount: "Rs 13,220",
    status: "Paid",
    date: "08 Mar",
  },
];

export const products: Product[] = [
  {
    id: "PR-102",
    name: "Cotton Kurti",
    stock: 26,
    price: "Rs 899",
    category: "Women",
  },
  {
    id: "PR-118",
    name: "Denim Jacket",
    stock: 8,
    price: "Rs 1,899",
    category: "Outerwear",
  },
  {
    id: "PR-126",
    name: "Office Shirt",
    stock: 41,
    price: "Rs 1,099",
    category: "Men",
  },
  {
    id: "PR-135",
    name: "Kids Hoodie",
    stock: 12,
    price: "Rs 799",
    category: "Kids",
  },
  {
    id: "PR-147",
    name: "Festival Saree",
    stock: 5,
    price: "Rs 2,699",
    category: "Ethnic",
  },
];

export const customers: Customer[] = [
  {
    id: "CU-77",
    name: "Ritika Sharma",
    phone: "+91 98765 22110",
    tier: "Gold",
    openInvoices: 2,
  },
  {
    id: "CU-81",
    name: "Karan Fashion Hub",
    phone: "+91 98322 55114",
    tier: "Wholesale",
    openInvoices: 1,
  },
  {
    id: "CU-88",
    name: "Sana Collections",
    phone: "+91 98113 44667",
    tier: "Silver",
    openInvoices: 0,
  },
  {
    id: "CU-90",
    name: "Drape House",
    phone: "+91 98919 11332",
    tier: "Wholesale",
    openInvoices: 3,
  },
];

export const quickActions: QuickAction[] = [
  { title: "New Sale", caption: "Open POS billing screen", target: "pos" },
  { title: "Check Stock", caption: "View inventory and stock alerts", target: "inventory" },
  { title: "Add Customer", caption: "Register new customer profile", target: "customers" }
];
