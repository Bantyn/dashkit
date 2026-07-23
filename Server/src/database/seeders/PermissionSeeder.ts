import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class PermissionSeeder implements ISeeder {
  name = 'PermissionSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const role = await this.repo.getRole('super_admin');
      if (role && !role.permissions) {
        await this.repo.updateRole('super_admin', { permissions: ['*'] });
        result.totalUpdated++;
      } else { result.totalSkipped++; }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
