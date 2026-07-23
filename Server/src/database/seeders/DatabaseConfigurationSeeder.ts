import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class DatabaseConfigurationSeeder implements ISeeder {
  name = 'DatabaseConfigurationSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPlatformSettings();
      const dbConfig = { CurrentProvider: 'Firestore', SupportedProviders: ['Firestore', 'Supabase', 'MongoDB', 'SQL Server'], RepositoryMode: true, TransactionMode: true, CacheMode: 'Memory' };
      if (!existing || !existing.CurrentProvider) {
        await this.repo.updatePlatformSettings(dbConfig);
        result.totalUpdated++;
      } else {
        result.totalSkipped++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
