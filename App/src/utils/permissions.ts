import { User, StaffPermissions, TabKey } from "../types";

export const hasPermission = (user: User | null, permissionPath: string): boolean => {
  if (!user || !user.permissions) return false;

  const parts = permissionPath.split(".");
  let current: any = user.permissions;

  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }

  return current === true;
};

export const getAvailableTabs = (user: User): { key: TabKey; label: string }[] => {
  const permissions = user.permissions;
  const allTabs: { key: TabKey; label: string; permission?: string }[] = [
    { key: "dashboard", label: "Home" },
    { key: "pos", label: "POS", permission: "invoices.view" },
    { key: "orders", label: "Orders", permission: "invoices.view" },
    { key: "products", label: "Products", permission: "products.view" },
    { key: "inventory", label: "Inventory", permission: "inventory.view" },
    { key: "customers", label: "Customers", permission: "customers.view" },
    { key: "staff", label: "Staff", permission: "staff.view" },
    // Profile removed from bottom navigation as requested
  ];

  return allTabs.filter((tab) => {
    // For Managers, hide Product and Staff tabs from the bottom bar (they'll use Dashboard buttons)
    if (user.role === "Manager" && (tab.key === "staff" || tab.key === "products")) {
      return false;
    }

    if (!tab.permission) return true;

    const parts = tab.permission.split(".");
    let current: any = permissions;
    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    return current === true;
  });
};
