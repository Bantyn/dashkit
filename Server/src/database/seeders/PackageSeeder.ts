import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class PackageSeeder implements ISeeder {
  name = 'PackageSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPackages();
      const packages = [
        { id: 'retail-package', name: 'Retail Package', features: ['inventory_management', 'billing'] }
      ];
      for (const p of packages) {
        if (!existing.find((e: any) => e.id === p.id)) {
          await this.repo.createPackage(p);
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
