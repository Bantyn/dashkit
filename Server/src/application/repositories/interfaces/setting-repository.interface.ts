export interface ISettingsRepository {
  getPlatformSettings(): Promise<any>;
  updatePlatformSettings(settings: any): Promise<void>;
  createPlatformSettings(settings: any): Promise<void>;
}
