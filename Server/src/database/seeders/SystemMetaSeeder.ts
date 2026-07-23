import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class SystemMetaSeeder implements ISeeder {
  name = 'SystemMetaSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getSystemMeta();
      const meta = { DatabaseVersion: '1.0', ApplicationVersion: '1.0', SeederVersion: '1.0', CreatedDate: new Date().toISOString(), UpdatedDate: new Date().toISOString(), Environment: 'production', RepositoryVersion: '1.0', SchemaVersion: '1.0' };
      if (!existing) {
        await this.repo.createSystemMeta(meta);
        result.totalCreated++;
      } else {
        await this.repo.updateSystemMeta({ UpdatedDate: new Date().toISOString() });
        result.totalUpdated++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
