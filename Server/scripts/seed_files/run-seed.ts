import * as path from 'path';
import * as fs from 'fs';

// Initialize env and firebase before running the seeder
import '../../src/config/firebase.config'; 
import { MasterSeeder } from '../../src/database/seeders/MasterSeeder';

async function main() {
  const args = process.argv.slice(2);
  const master = new MasterSeeder();
  
  let target = 'all';
  if (args.includes('--fresh')) {
    console.warn('WARNING: --fresh flag provided. In a real environment, this might wipe the DB first. Currently only running idempotent seeders.');
  }

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      target = arg.split('=')[1];
    }
  }

  console.log(`=========================================`);
  console.log(` CLOTHIFY MASTER SEEDER SYSTEM`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Target: ${target}`);
  console.log(`=========================================`);
  
  const startTime = Date.now();
  let results: any[] = [];
  
  if (target === 'all') {
    results = await master.executeAll();
  } else {
    // Map CLI targets to specific Seeder Names
    const targetMap: Record<string, string> = {
      'admin': 'AdminSeeder',
      'features': 'FeatureSeeder',
      'plans': 'PlanSeeder',
      'settings': 'PlatformSettingSeeder',
      'roles': 'RoleSeeder',
      'notifications': 'NotificationTemplateSeeder'
    };
    
    const seederName = targetMap[target] || target;
    const res = await master.executeSpecific(seederName);
    if (res) results.push(res);
  }
  
  const duration = Date.now() - startTime;
  console.log(`=========================================`);
  console.log(` SEEDING COMPLETED in ${duration}ms`);
  console.log(`=========================================`);
  
  // Generate Report
  generateReport(results, duration);
  
  process.exit(0);
}

function generateReport(results: any[], duration: number) {
  let report = `# Seeder Execution Report
**Date:** ${new Date().toISOString()}
**Execution Time:** ${duration}ms
**Database Provider:** Firestore
**Seeder Version:** 1.0.0

## Results
`;

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const r of results) {
    report += `### ${r.seederName}\n`;
    report += `- Created: ${r.totalCreated}\n`;
    report += `- Updated: ${r.totalUpdated}\n`;
    report += `- Skipped: ${r.totalSkipped}\n`;
    report += `- Errors: ${r.errors.length > 0 ? r.errors.join(', ') : 'None'}\n\n`;
    totalCreated += r.totalCreated;
    totalUpdated += r.totalUpdated;
    totalSkipped += r.totalSkipped;
  }

  report += `## Summary\n`;
  report += `- Total Records Created: ${totalCreated}\n`;
  report += `- Total Records Updated: ${totalUpdated}\n`;
  report += `- Total Records Skipped: ${totalSkipped}\n`;

  const reportPath = path.join(__dirname, '..', '..', 'Seeder_Report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Detailed report generated at ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
