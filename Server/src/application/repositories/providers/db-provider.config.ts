import { DatabaseConfigService } from '../../../modules/db-management/db-config.service';

export type DatabaseProvider = 'firestore' | 'supabase' | 'mongodb' | 'sqlserver';

/**
 * getSyncProvider()
 *
 * Returns the currently active DB provider synchronously by reading from
 * DatabaseConfigService's in-memory cache (activeProviderCache).
 *
 * Priority:
 *  1. In-memory cache set by setActiveProvider() — updated immediately when
 *     admin switches DB via the DB Management panel (no restart needed)
 *  2. process.env.DB_PROVIDER
 *  3. 'firestore' (default fallback)
 *
 * This is safe to call synchronously because DatabaseConfigService.setActiveProvider()
 * always keeps activeProviderCache in sync when the admin makes a change.
 *
 * NOTE: On cold start (first ever request before any admin action), the cache may be
 * null. In that case it falls back to DB_PROVIDER env or 'firestore'.
 * The first actual async call to getActiveProvider() (made at server startup in
 * db-config.service) will warm the cache from Firestore for all subsequent calls.
 */
export function getSyncProvider(): DatabaseProvider {
  // Access the private static cache via bracket notation — avoids adding a public getter
  const cached = (DatabaseConfigService as any).activeProviderCache as string | null;
  return (cached || process.env.DB_PROVIDER || 'firestore') as DatabaseProvider;
}

/**
 * getProvider() — async version.
 * Use this in contexts where the cache may not be warmed yet (e.g., startup scripts).
 */
export async function getProvider(): Promise<DatabaseProvider> {
  const provider = await DatabaseConfigService.getActiveProvider();
  return provider as DatabaseProvider;
}

/**
 * @deprecated Use getSyncProvider() instead.
 * Kept for backward compatibility. Does NOT reflect admin panel changes.
 */
export const DB_CONFIG = {
  PROVIDER: (process.env.DB_PROVIDER || 'firestore') as DatabaseProvider,
};

