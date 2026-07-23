export interface UsageTracking {
  id: string;
  subjectType: "shop" | "user";
  subjectId: string;
  userId?: string;
  shopId?: string;
  planId: string;
  limitKey: string;
  periodKey: string;
  used: number;
  createdAt: Date;
  updatedAt: Date;
}
