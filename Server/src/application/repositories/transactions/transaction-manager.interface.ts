import { db } from "../../../config/firebase.config";

export interface ITransactionManager {
  runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T>;
}

export class FirestoreTransactionManager implements ITransactionManager {
  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    return db.runTransaction(updateFunction);
  }
}

/**
 * Supabase Pseudo-Transaction Manager
 *
 * The Supabase REST client does not support multi-statement client-side
 * transactions. This executor runs the callback sequentially with a null
 * transaction token. Each write is awaited in order.
 *
 * Atomicity guarantee: PARTIAL — if a write fails, subsequent writes are
 * skipped and the error propagates, but already-completed writes are not
 * rolled back. Full atomicity requires a PostgreSQL stored procedure (RPC).
 *
 * All Supabase repository transaction methods accept `_transaction: any`
 * and ignore the token, so passing null is safe.
 */
export class SupabaseTransactionManager implements ITransactionManager {
  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    return updateFunction(null);
  }
}

