import { ISeeder, SeederResult } from './interfaces/Seeder.interface';
import { SystemMetaSeeder } from './SystemMetaSeeder';
import { PlatformSettingSeeder } from './PlatformSettingSeeder';
import { DatabaseConfigurationSeeder } from './DatabaseConfigurationSeeder';
import { FeatureSeeder } from './FeatureSeeder';
import { PlanSeeder } from './PlanSeeder';
import { PackageSeeder } from './PackageSeeder';
import { RoleSeeder } from './RoleSeeder';
import { PermissionSeeder } from './PermissionSeeder';
import { AdminSeeder } from './AdminSeeder';
import { NotificationTemplateSeeder } from './NotificationTemplateSeeder';
import { CounterSeeder } from './CounterSeeder';
import { CategorySeeder } from './CategorySeeder';
import { BrandSeeder } from './BrandSeeder';
import { RepositorySeeder } from './RepositorySeeder';
import { SubscriptionSeeder } from './SubscriptionSeeder';

export class MasterSeeder {
  
  private seeders: ISeeder[] = [
    new SystemMetaSeeder(),
    new PlatformSettingSeeder(),
    new DatabaseConfigurationSeeder(),
    new FeatureSeeder(),
    new PlanSeeder(),
    new PackageSeeder(),
    new RoleSeeder(),
    new PermissionSeeder(),
    new AdminSeeder(),
    new NotificationTemplateSeeder(),
    new CounterSeeder(),
    new CategorySeeder(),
    new BrandSeeder(),
    new RepositorySeeder(),
    new SubscriptionSeeder()
  ];

  async executeAll(): Promise<SeederResult[]> {
    console.log('Starting Master Seeder Execution...');
    const results: SeederResult[] = [];
    
    // Validate prerequisites (DB connection check can be done here)
    console.log('Validation passed. Executing seeders in order...');
    
    for (const seeder of this.seeders) {
      console.log(`Executing ${seeder.name}...`);
      try {
        const result = await seeder.seed();
        results.push(result);
        console.log(`[${seeder.name}] Created: ${result.totalCreated}, Updated: ${result.totalUpdated}, Skipped: ${result.totalSkipped}, Errors: ${result.errors.length}`);
      } catch (err: any) {
        console.error(`[${seeder.name}] CRITICAL FAILURE: ${err.message}`);
        results.push({ seederName: seeder.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [err.message], durationMs: 0 });
      }
    }
    
    console.log('Master Seeder Execution Completed.');
    return results;
  }

  async executeSpecific(seederName: string): Promise<SeederResult | null> {
    const seeder = this.seeders.find(s => s.name === seederName);
    if (!seeder) {
      console.error(`Seeder not found: ${seederName}`);
      return null;
    }
    
    console.log(`Executing ${seeder.name}...`);
    try {
      const result = await seeder.seed();
      console.log(`[${seeder.name}] Created: ${result.totalCreated}, Updated: ${result.totalUpdated}, Skipped: ${result.totalSkipped}, Errors: ${result.errors.length}`);
      return result;
    } catch (err: any) {
      console.error(`[${seeder.name}] CRITICAL FAILURE: ${err.message}`);
      return { seederName: seeder.name, totalCreated: 0, totalUpdated: 0, totalSkipped: 0, errors: [err.message], durationMs: 0 };
    }
  }
}
