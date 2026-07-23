export interface IAdminRepository {
  getAdminByEmail(email: string): Promise<any>;
  createAdmin(admin: any): Promise<void>;
  updateAdmin(id: string, admin: any): Promise<void>;
}
