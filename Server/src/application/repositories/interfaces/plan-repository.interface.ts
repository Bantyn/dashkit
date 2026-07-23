export interface IPlanRepository {
  getPlans(): Promise<any[]>;
  createPlan(plan: any): Promise<void>;
  updatePlan(id: string, plan: any): Promise<void>;
  createPackage(pkg: any): Promise<void>;
  getPackages(): Promise<any[]>;
}
