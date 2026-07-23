import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class CounterSeeder implements ISeeder {
  name = 'CounterSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getCounters();
      const counters = ['Invoice', 'Purchase Order', 'Customer', 'Supplier', 'Product', 'Branch', 'Expense', 'Transaction', 'Credit Note'];
      for (const c of counters) {
        const type = c.toLowerCase().replace(/\s+/g, '_');
        if (!existing.find((e: any) => e.type === type)) {
          await this.repo.createCounter({ type, count: 0 });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
