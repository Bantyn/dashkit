const fs = require('fs');
const path = require('path');
const basePath = 'd:/Working/Pending/Clothify/clothify_backend/src/database/seeders';

const boilerplates = {
  'SystemMetaSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class SystemMetaSeeder implements ISeeder {
  name = 'SystemMetaSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getSystemMeta();
      const meta = { DatabaseVersion: '1.0', ApplicationVersion: '1.0', SeederVersion: '1.0', CreatedDate: new Date().toISOString(), UpdatedDate: new Date().toISOString(), Environment: 'production', RepositoryVersion: '1.0', SchemaVersion: '1.0' };
      if (!existing) {
        await this.repo.createSystemMeta(meta);
        result.totalCreated++;
      } else {
        await this.repo.updateSystemMeta({ UpdatedDate: new Date().toISOString() });
        result.totalUpdated++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'PlatformSettingSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class PlatformSettingSeeder implements ISeeder {
  name = 'PlatformSettingSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPlatformSettings();
      const settings = { Currency: 'INR', Timezone: 'Asia/Kolkata', Language: 'English', TaxEnabled: true, GSTEnabled: true, InventoryEnabled: true, NotificationEnabled: true, CloudinaryEnabled: true, StorageProvider: 'Cloudinary', DatabaseProvider: 'Firestore', CacheProvider: 'Memory', MaintenanceMode: false, DebugMode: false };
      if (!existing) {
        await this.repo.createPlatformSettings(settings);
        result.totalCreated++;
      } else {
        result.totalSkipped++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'DatabaseConfigurationSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class DatabaseConfigurationSeeder implements ISeeder {
  name = 'DatabaseConfigurationSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPlatformSettings();
      const dbConfig = { CurrentProvider: 'Firestore', SupportedProviders: ['Firestore', 'Supabase', 'MongoDB', 'SQL Server'], RepositoryMode: true, TransactionMode: true, CacheMode: 'Memory' };
      if (!existing || !existing.CurrentProvider) {
        await this.repo.updatePlatformSettings(dbConfig);
        result.totalUpdated++;
      } else {
        result.totalSkipped++;
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'FeatureSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
        if (!existing.find(e => e.key === f.key)) {
          await this.repo.createFeature(f);
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'PlanSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { FirestoreSeederRepository } from '../../application/repositories/firestore/firestore-seeder.repository';

export class PlanSeeder implements ISeeder {
  name = 'PlanSeeder';
  private repo = new FirestoreSeederRepository();

  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    try {
      const existing = await this.repo.getPlans();
      const plans = [
        { id: 'free-trial', name: 'Free Trial', Pricing: 0, Storage: '5GB', Users: 1, Branches: 1, Features: [], Status: 'Active' },
        { id: 'starter', name: 'Starter', Pricing: 999, Storage: '10GB', Users: 3, Branches: 1, Features: [], Status: 'Active' },
        { id: 'growth', name: 'Growth', Pricing: 1999, Storage: '50GB', Users: 10, Branches: 3, Features: [], Status: 'Active' },
        { id: 'professional', name: 'Professional', Pricing: 4999, Storage: 'Unlimited', Users: 'Unlimited', Branches: 10, Features: [], Status: 'Active' },
        { id: 'enterprise', name: 'Enterprise', Pricing: 9999, Storage: 'Unlimited', Users: 'Unlimited', Branches: 'Unlimited', Features: [], Status: 'Active' }
      ];
      for (const p of plans) {
        if (!existing.find(e => e.id === p.id)) {
          await this.repo.createPlan(p);
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'PackageSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
        if (!existing.find(e => e.id === p.id)) {
          await this.repo.createPackage(p);
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'RoleSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
        const id = r.toLowerCase().replace(/\\s+/g, '_');
        if (!existing.find(e => e.id === id)) {
          await this.repo.createRole({ id, name: r });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'PermissionSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
`,
  'AdminSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
`,
  'NotificationTemplateSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
        const type = t.toLowerCase().replace(/\\s+/g, '_');
        if (!existing.find(e => e.type === type)) {
          await this.repo.createTemplate({ type, name: t, subject: t, body: 'Template content' });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'CounterSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
        const type = c.toLowerCase().replace(/\\s+/g, '_');
        if (!existing.find(e => e.type === type)) {
          await this.repo.createCounter({ type, count: 0 });
          result.totalCreated++;
        } else { result.totalSkipped++; }
      }
    } catch (e: any) { result.errors.push(e.message); }
    result.durationMs = Date.now() - start;
    return result;
  }
}
`,
  'CategorySeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
`,
  'BrandSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
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
`,
  'RepositorySeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';

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
`,
  'SubscriptionSeeder.ts': `import { ISeeder, SeederResult } from './interfaces/Seeder.interface';

export class SubscriptionSeeder implements ISeeder {
  name = 'SubscriptionSeeder';
  async seed(): Promise<SeederResult> {
    const result: SeederResult = { seederName: this.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [], durationMs: 0 };
    const start = Date.now();
    // Logic for default subscription configs
    result.totalSkipped++;
    result.durationMs = Date.now() - start;
    return result;
  }
}
`
};

for (const [name, content] of Object.entries(boilerplates)) {
  fs.writeFileSync(path.join(basePath, name), content);
}
console.log('Seeders created.');
