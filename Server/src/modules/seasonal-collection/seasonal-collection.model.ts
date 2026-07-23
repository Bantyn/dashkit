export interface SeasonalCollection {
  id: string;
  shopId: string;
  name: string;
  season: "summer" | "winter" | "festive" | "other";
  description?: string;
  active: boolean;
  productIds: string[]; // List of product IDs in this collection
  createdAt: Date;
  updatedAt: Date;
}
