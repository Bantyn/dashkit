export type FeatureCategory =
  | "core"
  | "website"
  | "selling"
  | "inventory"
  | "analytics"
  | "marketing"
  | "integrations"
  | "enterprise"
  | "accounting"
  | "crm"
  | "customers"
  | "staff"
  | "finance"
  | "shipping";

export interface FeatureDefinition {
  key: string;
  label: string;
  category: FeatureCategory;
  description?: string;
  active: boolean;
  status?: "active" | "inactive" | "maintenance" | "deprecated";
  createdAt: Date;
  updatedAt: Date;
}
