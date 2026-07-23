export const getQuickActionsForStaff = (permissions: string[]) => {
  const actions = [];

  if (permissions.includes("invoices.create")) {
    actions.push({
      title: "New Sale",
      caption: "Create a new invoice",
      target: "pos",
    });
  }

  if (permissions.includes("inventory.view")) {
    actions.push({
      title: "Stock Check",
      caption: "View current inventory",
      target: "inventory",
    });
  }

  if (permissions.includes("products.create")) {
    actions.push({
      title: "Add Product",
      caption: "Add a new product",
      target: "products",
    });
  }

  if (permissions.includes("customers.view")) {
    actions.push({
      title: "Find Customer",
      caption: "Search for a customer",
      target: "customers",
    });
  }

  return actions;
};
