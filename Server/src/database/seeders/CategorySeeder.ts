import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { db } from '../../config/firebase.config';

export class CategorySeeder implements ISeeder {
  name = 'CategorySeeder';
  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const snap = await db.collection('categories').limit(1).get();
      if (snap.empty) {
        const cats = ['Men', 'Women', 'Kids', 'Accessories', 'Footwear', 'Winter Wear', 'Summer Wear'];
        for (const c of cats) {
          await db.collection('categories').add({ name: c });
          result.totalCreated++;
        }
      } else { result.totalSkipped++; }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
