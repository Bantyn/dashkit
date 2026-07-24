import { User, TabKey } from "../types";

export const hasPermission = (user: User | null, permissionPath: string): boolean => {
  if (!user || !user.permissions) return false;

  const permissions = user.permissions;

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

    // Map common aliases (e.g. invoices.view -> sales.view or invoices.view)
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
  const allTabs: { key: TabKey; label: string; permission?: string }[] = [
    { key: "dashboard", label: "Home" },
    { key: "pos", label: "POS", permission: "invoices.view" },
    { key: "orders", label: "Orders", permission: "invoices.view" },
    { key: "products", label: "Products", permission: "products.view" },
    { key: "inventory", label: "Inventory", permission: "inventory.view" },
    { key: "customers", label: "Customers", permission: "customers.view" },
    { key: "staff", label: "Staff", permission: "staff.view" },
  ];

  return allTabs.filter((tab) => {
    // Role-based layout optimization: hide extra tabs for manager templates
    if ((user.role === "Manager" || user.role === "Store Manager") && (tab.key === "staff" || tab.key === "products")) {
      return false;
    }

    if (!tab.permission) return true;
    return hasPermission(user, tab.permission);
  });
};
