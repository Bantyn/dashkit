import { User, TabKey } from "../types";

export const hasPermission = (user: User | null, permissionPath: string): boolean => {
  if (!user) return false;

  const roleLower = (user.role || "").toLowerCase().trim();

  // Shop Owner and Platform Admin have 100% full permissions across all modules
  if (roleLower.includes("owner") || roleLower.includes("admin")) {
    return true;
  }

  const permissions = user.permissions;
  if (!permissions) return false;

  // Handle Array-based permissions (Calculated Effective Permissions Engine)
  if (Array.isArray(permissions)) {
    if (permissions.includes("*") || permissions.includes("admin.access")) {
      return true;
    }
    if (permissions.includes(permissionPath)) {
      return true;
    }

    const [category] = permissionPath.split(".");
    if (permissions.includes(`${category}.*`)) {
      return true;
    }

    // Map common aliases (e.g. analytics.view, returns.view, delivery.view)
    if (permissionPath === "delivery.view" && (
      permissions.includes("delivery.*") ||
      roleLower.includes("delivery")
    )) {
      return true;
    }

    if (permissionPath === "analytics.view" && (
      permissions.includes("reports.view") || 
      permissions.includes("reports.*") || 
      permissions.includes("sales.view") || 
      permissions.includes("sales.*")
    )) {
      return true;
    }

    if (permissionPath.startsWith("returns.") && (
      permissions.includes("sales.view") || 
      permissions.includes("sales.*") || 
      permissions.includes("invoices.view") || 
      permissions.includes("invoices.*")
    )) {
      return true;
    }

    if (category === "invoices" && (permissions.includes("sales.view") || permissions.includes("sales.*"))) {
      return true;
    }

    return false;
  }

  // Handle Legacy Object-based permissions
  const parts = permissionPath.split(".");
  let current: any = permissions;

  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }

  return current === true;
};

export const getAvailableTabs = (user: User): { key: TabKey; label: string }[] => {
  const isDeliveryStaff = (user.role || "").toLowerCase().includes("delivery");

  const allTabs: { key: TabKey; label: string; permission?: string }[] = [
    { key: "dashboard", label: "Home" },
    { key: "delivery", label: "Route", permission: "delivery.view" },
    { key: "pos", label: "POS", permission: "invoices.view" },
    { key: "orders", label: "Orders", permission: "invoices.view" },
    { key: "products", label: "Products", permission: "products.view" },
    { key: "inventory", label: "Inventory", permission: "inventory.view" },
    { key: "customers", label: "Customers", permission: "customers.view" },
    { key: "staff", label: "Staff", permission: "staff.view" },
  ];

  return allTabs.filter((tab) => {
    if (isDeliveryStaff && (tab.key === "pos" || tab.key === "staff" || tab.key === "products")) {
      return false;
    }

    if ((user.role === "Manager" || user.role === "Store Manager") && (tab.key === "staff" || tab.key === "products")) {
      return false;
    }

    if (!tab.permission) return true;
    return hasPermission(user, tab.permission);
  });
};
