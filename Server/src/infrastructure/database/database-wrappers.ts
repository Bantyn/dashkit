import { recordDbOperation } from "./database-operation-context";
import { DbOperation } from "./database-operation-types";

// ==========================================
// 1. SUPABASE CLIENT WRAPPER
// ==========================================
export function wrapSupabaseClient(client: any): any {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (table: string) => {
          const queryBuilder = target.from(table);
          return wrapSupabaseQueryBuilder(queryBuilder, table);
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });
}

function wrapSupabaseQueryBuilder(builder: any, table: string, operation: DbOperation = 'read') {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (['select', 'insert', 'upsert', 'update', 'delete'].includes(prop as string)) {
         return (...args: any[]) => {
            const nextBuilder = target[prop](...args);
            const nextOp: DbOperation = (prop === 'select') ? 'read' : (prop === 'delete' ? 'delete' : (prop === 'update' ? 'update' : 'write'));
            return wrapSupabaseQueryBuilder(nextBuilder, table, nextOp);
         }
      }

      if (prop === 'then') {
        return (resolve: any, reject: any) => {
           const startTime = Date.now();
           return target.then((res: any) => {
              const success = !res?.error;
              const durationMs = Date.now() - startTime;

              // Count actual rows affected — like Firestore's per-document billing model
              // For reads: count rows returned; for writes/updates/deletes: count affected rows
              let rowCount = 1;
              if (success) {
                if (operation === 'read') {
                  // data is array for list queries, object for .single()
                  rowCount = Array.isArray(res?.data) ? (res.data.length || 1) : 1;
                } else {
                  // For writes/updates/deletes, count affected rows from response
                  rowCount = Array.isArray(res?.data) ? (res.data.length || 1) : 1;
                }
              }

              // Record one entry per actual row (mirrors Firestore per-document tracking)
              for (let i = 0; i < rowCount; i++) {
                recordDbOperation('supabase', table, operation, i === 0 ? durationMs : 0, success);
              }

              if (resolve) resolve(res);
           }, (err: any) => {
              recordDbOperation('supabase', table, operation, Date.now() - startTime, false);
              if (reject) reject(err);
           });
        }
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
         return (...args: any[]) => {
            const result = val.apply(target, args);
            if (result && typeof result === 'object' && typeof result.then === 'function') {
               return wrapSupabaseQueryBuilder(result, table, operation);
            }
            return result;
         }
      }
      return val;
    }
  });
}


// ==========================================
// 2. MONGODB DB WRAPPER (For future use)
// ==========================================
export function wrapMongoDb(db: any): any {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'collection') {
         return (colName: string) => {
            const collection = target.collection(colName);
            return wrapMongoCollection(collection, colName);
         }
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });
}

function wrapMongoCollection(collection: any, colName: string) {
   return new Proxy(collection, {
      get(target, prop, receiver) {
         if (['find', 'findOne', 'aggregate', 'countDocuments'].includes(prop as string)) {
             return (...args: any[]) => {
                 const cursor = target[prop](...args);
                 if (cursor instanceof Promise) {
                     const start = Date.now();
                     return cursor.then((res: any) => {
                         // Count actual documents returned (per-document like Firestore)
                         const count = Array.isArray(res) ? res.length : (res ? 1 : 0);
                         for (let i = 0; i < Math.max(count, 1); i++) {
                           recordDbOperation('mongodb', colName, 'read', i === 0 ? Date.now() - start : 0, true);
                         }
                         return res;
                     }).catch((e: any) => {
                         recordDbOperation('mongodb', colName, 'read', Date.now() - start, false);
                         throw e;
                     });
                 }
                 return wrapMongoCursor(cursor, colName, 'read');
             }
         }
         if (['insertOne', 'insertMany'].includes(prop as string)) {
             return async (...args: any[]) => {
                 const start = Date.now();
                 try {
                    const res = await target[prop](...args);
                    // insertMany returns { insertedCount }, insertOne returns insertedId
                    const count = res?.insertedCount ?? 1;
                    for (let i = 0; i < count; i++) {
                      recordDbOperation('mongodb', colName, 'write', i === 0 ? Date.now() - start : 0, true);
                    }
                    return res;
                 } catch(e) {
                    recordDbOperation('mongodb', colName, 'write', Date.now() - start, false);
                    throw e;
                 }
             }
         }
         if (['updateOne', 'updateMany', 'findOneAndUpdate'].includes(prop as string)) {
             return async (...args: any[]) => {
                 const start = Date.now();
                 try {
                    const res = await target[prop](...args);
                    // modifiedCount for updateMany, 1 for updateOne/findOneAndUpdate
                    const count = res?.modifiedCount ?? res?.matchedCount ?? 1;
                    for (let i = 0; i < Math.max(count, 1); i++) {
                      recordDbOperation('mongodb', colName, 'update', i === 0 ? Date.now() - start : 0, true);
                    }
                    return res;
                 } catch(e) {
                    recordDbOperation('mongodb', colName, 'update', Date.now() - start, false);
                    throw e;
                 }
             }
         }
         if (['deleteOne', 'deleteMany', 'findOneAndDelete'].includes(prop as string)) {
             return async (...args: any[]) => {
                 const start = Date.now();
                 try {
                    const res = await target[prop](...args);
                    // deletedCount for deleteMany, 1 for deleteOne/findOneAndDelete
                    const count = res?.deletedCount ?? 1;
                    for (let i = 0; i < Math.max(count, 1); i++) {
                      recordDbOperation('mongodb', colName, 'delete', i === 0 ? Date.now() - start : 0, true);
                    }
                    return res;
                 } catch(e) {
                    recordDbOperation('mongodb', colName, 'delete', Date.now() - start, false);
                    throw e;
                 }
             }
         }

         const val = Reflect.get(target, prop, receiver);
         return typeof val === 'function' ? val.bind(target) : val;
      }
   });
}


function wrapMongoCursor(cursor: any, colName: string, operation: DbOperation) {
   return new Proxy(cursor, {
       get(target, prop, receiver) {
          if (['toArray', 'next', 'forEach'].includes(prop as string)) {
             return async (...args: any[]) => {
                 const start = Date.now();
                 try {
                    const res = await target[prop](...args);
                    recordDbOperation('mongodb', colName, operation, Date.now() - start, true);
                    return res;
                 } catch(e) {
                    recordDbOperation('mongodb', colName, operation, Date.now() - start, false);
                    throw e;
                 }
             }
          }
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === 'function') {
             return (...args: any[]) => {
                const result = val.apply(target, args);
                if (result && typeof result === 'object' && typeof result.toArray) {
                   return wrapMongoCursor(result, colName, operation); // Re-wrap chained cursor
                }
                return result;
             }
          }
          return val;
       }
   });
}

// ==========================================
// 3. SQL SERVER WRAPPER (For future use)
// ==========================================
export function wrapSqlServerClient(client: any): any {
  // Can be implemented similarly via Proxy when mssql or sequelize is fully introduced
  return client;
}
