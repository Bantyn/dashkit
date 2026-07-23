import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class FeatureSeeder implements ISeeder {
  name = 'FeatureSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getFeatures();
      const features = [
        { key: 'inventory_management', name: 'Inventory Management', description: 'Manage stock', category: 'Inventory', DefaultEnabledStatus: true, FeatureType: 'Core', Dependencies: [], Visibility: 'Public' },
        { key: 'billing', name: 'Billing', description: 'Invoicing and billing', category: 'Sales', DefaultEnabledStatus: true, FeatureType: 'Core', Dependencies: [], Visibility: 'Public' }
      ];
      for (const f of features) {
        if (!existing.find((e: any) => e.key === f.key)) {
          await this.repo.createFeature(f);
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
