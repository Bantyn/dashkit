export interface SeederResult {
  seederName: string;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
  durationMs: number;
}

export interface ISeeder {
  /**
   * Name of the seeder (e.g. 'AdminSeeder')
   */
  name: string;

  /**
   * Executes the seeding process for this specific domain.
   * Must be idempotent (skip existing records, insert missing).
   */
  seed(): Promise<SeederResult>;
}
