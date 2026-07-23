export interface IRoleRepository {
  getRoles(): Promise<any[]>;
  getRole(id: string): Promise<any>;
  createRole(role: any): Promise<void>;
  updateRole(id: string, role: any): Promise<void>;
}
