export interface ISystemMetaRepository {
  getSystemMeta(): Promise<any>;
  createSystemMeta(meta: any): Promise<void>;
  updateSystemMeta(meta: any): Promise<void>;
}
