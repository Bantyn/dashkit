import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class RoleSeeder implements ISeeder {
  name = 'RoleSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getRoles();
      const roles = ['Super Admin', 'Admin', 'Manager', 'Staff', 'Cashier', 'Inventory Manager', 'Accountant', 'Viewer'];
      for (const r of roles) {
        const id = r.toLowerCase().replace(/\s+/g, '_');
        if (!existing.find((e: any) => e.id === id)) {
          await this.repo.createRole({ id, name: r });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
