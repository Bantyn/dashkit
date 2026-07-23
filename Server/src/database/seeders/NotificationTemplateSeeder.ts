import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class NotificationTemplateSeeder implements ISeeder {
  name = 'NotificationTemplateSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getTemplates();
      const templates = ['Welcome', 'Password Reset', 'Invoice Generated', 'Purchase Order', 'Payment Received', 'Subscription Expiry', 'Trial Ending'];
      for (const t of templates) {
        const type = t.toLowerCase().replace(/\s+/g, '_');
        if (!existing.find((e: any) => e.type === type)) {
          await this.repo.createTemplate({ type, name: t, subject: t, body: 'Template content' });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
