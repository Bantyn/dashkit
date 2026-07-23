import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class PlatformSettingSeeder implements ISeeder {
  name = 'PlatformSettingSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPlatformSettings();
      const settings = { Currency: 'INR', Timezone: 'Asia/Kolkata', Language: 'English', TaxEnabled: true, GSTEnabled: true, InventoryEnabled: true, NotificationEnabled: true, CloudinaryEnabled: true, StorageProvider: 'Cloudinary', DatabaseProvider: 'Firestore', CacheProvider: 'Memory', MaintenanceMode: false, DebugMode: false };
      if (!existing) {
        await this.repo.createPlatformSettings(settings);
        result.totalCreated++;
      } else {
        result.totalSkipped++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
