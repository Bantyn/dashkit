import { ISeeder, SeederResult } from './interfaces/Seeder.interface';

export class RepositorySeeder implements ISeeder {
  name = 'RepositorySeeder';
  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    // Logic for setting up repositories if needed in DB
    result.totalSkipped++;
    result.durationMs = Date.now() - start;
    return result;
  }
}
