export const DOMAIN_EVENTS = {
  productCreated: "product.created",
  productUpdated: "product.updated",
  shopUpdated: "shop.updated",
  offerUpdated: "offer.updated",
  orderCreated: "order.created",
  invoiceCreated: "invoice.created",
  inventoryUpdated: "inventory.updated",
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
