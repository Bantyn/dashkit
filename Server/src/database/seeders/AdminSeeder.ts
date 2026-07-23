import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';
// import { auth } from '../../config/firebase.config'; // uncomment if utilizing auth sdk

export class AdminSeeder implements ISeeder {
  name = 'AdminSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const email = 'admin@gmail.com';
      let admin = await this.repo.getAdminByEmail(email);
      if (!admin) {
        // Normally create in Firebase Auth as well
        await this.repo.createAdmin({ email, Name: 'System Administrator', Role: 'Super Admin', Status: 'Active', Verified: true, FirstLoginRequired: false, ProfileImage: 'Default Avatar' });
        result.totalCreated++;
      } else {
        await this.repo.updateAdmin(admin.id, { Role: 'Super Admin' });
        result.totalUpdated++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
