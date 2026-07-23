import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { db } from '../../config/firebase.config';

export class BrandSeeder implements ISeeder {
  name = 'BrandSeeder';
  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const snap = await db.collection('brands').limit(1).get();
      if (snap.empty) {
        const brands = ['Local Brand', 'Premium Brand', 'Imported Brand'];
        for (const b of brands) {
          await db.collection('brands').add({ name: b });
          result.totalCreated++;
        }
      } else { result.totalSkipped++; }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
