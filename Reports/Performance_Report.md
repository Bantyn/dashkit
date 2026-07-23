# Performance Report — Clothify ERP Backend
**Date:** 2026-07-18 | **Scope:** Full Backend | **Type:** Baseline Audit

---

## Executive Summary

| Metric | Current State | Target |
|--------|--------------|--------|
| Firestore Reads per request | 4–9 | ≤1 (config only) |
| Supabase queries per request | 2–6 | 1–2 |
| N+1 Queries Detected | **YES** | None |
| Duplicate Reads | **YES** | None |
| Analytics DB (live queries) | **Firestore** | Supabase |
| Dashboard Load Time | ~800–1500ms | <300ms |
| POS Invoice Creation | ~600–1200ms | <100ms |

**Overall Grade: D** — Functional but critically under-optimized.

---

## STEP 1 — Database Access Map

### Modules Using Supabase (via RepositoryFactory)
| Module | Read | Write | Delete |
|--------|------|-------|--------|
| Products | ✅ Supabase | ✅ Supabase | ✅ Supabase |
| Inventory | ✅ Supabase | ✅ Supabase | ✅ Supabase |
| Invoices | ✅ Supabase | ✅ Supabase | ✅ Supabase |
| Orders | ✅ Supabase | ✅ Supabase | ✅ Supabase |
| Customers | ✅ Supabase | ✅ Supabase | ✅ Supabase |
| Purchases | ✅ Supabase | ✅ Supabase | ✅ Supabase |

### Modules STILL Using Firestore (Hardcoded `db.collection`)
| Module | Reads | Writes | Notes |
|--------|-------|--------|-------|
| Analytics (`analytics.service.ts`) | `invoices`, `orders`, `expenses`, `products`, `customers`, `staff`, `inventory`, `branches` collections | ❌ | **8 full collection scans per dashboard load** |
| Subscriptions (`subscription.service.ts`) | `features`, `plans`, `usage_tracking`, `shops` | `usage_tracking`, `shops` | Called on every product/order create |
| Shop Service (`shop.service.ts`) | `shops`, `user_roles` | `shops` | Every request hits this |
| Staff Service (`staff.service.ts`) | `staff`, `staff_activities` | `staff_activities` | Logs every action synchronously |
| ShopCounters (`shop-counters.service.ts`) | `shop_counters` | `shop_counters` | Fire-and-forget but still Firestore |
| DB Config (`db-config.service.ts`) | `platform_settings` | `platform_settings` | **On every cold start + cache miss** |
| CostAnalytics (`cost-analytics.service.ts`) | `platform_cost_analytics`, `platform_costs_pricing`, `shops`, `storage_usage`, `api_usage_aggregation`, `firestore_operations_metrics` | `platform_cost_analytics`, `platform_costs_alerts` | Snapshot-based, well-cached |
| DB Management (`db-management.controller.ts`) | **7 full collection count queries** per `/overview` call | — | Admin panel calls |
| assertLimitAvailable (`subscription.service.ts`) | `products.count()` or `branches.count()` per entity create | — | **Firestore count on every product create** |

---

## STEP 3 — Unnecessary & Repeated Reads

### Critical N+1 Found

#### 1. `getTransactionInventoryItems` in `supabase-invoice.repository.ts` (Line 104)
```typescript
// ❌ CURRENT — N sequential Supabase queries for N invoice items
for (const item of items) {
  const { data } = await supabase.from('inventory')
    .select('data')
    .eq('shopId', shopId)
    .eq('productId', item.productId)
    .eq('variantSku', item.variantSku)
    .single();
}
// For a 10-item invoice = 10 separate DB round trips
```
**Impact:** A 10-item invoice creates 10 sequential Supabase queries instead of 1.

#### 2. `analytics.service.ts` — 8 Firestore Full Collection Reads per Dashboard Load
```
queryCollection("invoices")  → Full collection scan
queryCollection("orders")    → Full collection scan
queryCollection("expenses")  → Full collection scan
queryCollection("products")  → Full collection scan
queryCollection("customers") → Full collection scan
queryCollection("staff")     → Full collection scan
queryCollection("inventory") → Full collection scan
queryCollection("branches")  → Full collection scan
```
**Total: 8 full Firestore collection scans per cold dashboard load.**
Cached for 15 minutes after first load, but cache is per-key and invalidated on any write.

#### 3. `subscription.service.ts::assertLimitAvailable` — Firestore Count on Every Product Create
```typescript
// products_count check:
const snap = await db.collection("products").where("shopId", "==", shopId).count().get();
```
Every `createProduct` → Firestore count query on `products` collection.
Every `createBranch` → Firestore count query on `branches` collection.

#### 4. `incrementUsage` Chain on Every Entity Create
`createProduct` triggers:
1. `subscriptionService.incrementUsage` → `resolveAccessContext` → Firestore `shops` read + `plans` read + `features` read (if not cached)
2. `shopCountersService.incrementCounter` → Firestore `shop_counters` write
3. `costAnalyticsService.invalidateSnapshot` → Firestore `platform_cost_analytics` write
4. `logActivity` → Firestore `staff_activities` write (synchronous)

**Total Firestore ops per product create (worst case): 5–7 reads + 3 writes**

#### 5. `SupabaseManager.getClient()` called inside every repository method
Every method calls `await SupabaseManager.getClient()` — though it is singleton-cached, the `await` is unnecessary overhead per call.

#### 6. `updateProduct` Reads Before Write (Double Round Trip)
```typescript
// supabase-product.repository.ts line 74
const product = await this.getProduct(id);  // READ
await supabase.from('products').update({ data: updatedData }).eq('id', id); // WRITE
```
Every `update` requires a prior `get` to merge JSONB. Same pattern in `updateCategory`, `updateBrand`, `updateInventory`, `updateTransactionCustomer`, `updateTransactionProduct`, `updateTransactionInventory`.

#### 7. `getLowStockItems` — Full Table Scan + Client-Side Filter
```typescript
// supabase-inventory.repository.ts line 131
const { data } = await supabase.from('inventory').select('data').eq('shopId', shopId);
return data.map(d => d.data).filter(item => item.currentStock <= item.lowStockThreshold);
```
Loads ALL inventory for a shop, then filters in Node.js.

#### 8. `getInventoryHistory` — Client-Side Date Filter on jsonb
```typescript
// supabase-inventory.repository.ts line 122
if (filters?.date) {
  history = history.filter(h => h.createdAt && h.createdAt.startsWith(filters.date));
}
```
Loads full history to filter by date in memory.

---

## STEP 12 — Per-Request Database Count

### `POST /invoices` (Create Invoice, 10-item cart)
| Operation | Database | Count |
|-----------|----------|-------|
| getTransactionShop | Supabase | 1 |
| getTransactionCustomer | Supabase | 1 |
| getTransactionProducts (batch) | Supabase | 1 |
| getTransactionInventoryItems | Supabase | **10 (N+1)** |
| createTransactionInvoice | Supabase | 1 |
| updateTransactionInventory × 10 | Supabase | 10 read + 10 write |
| logActivity | Firestore | 1 write |
| shopCounters.increment | Firestore | 1 write |
| costAnalytics.invalidate | Firestore | 1 write |
| **Total** | | **~14 Supabase + 3 Firestore** |

### `GET /analytics/dashboard`
| Operation | Database | Count |
|-----------|----------|-------|
| queryCollection × 8 (cold) | **Firestore** | **8 full scans** |
| Subscription resolveAccess | Firestore | 1–3 reads |
| **Total** | | **9–11 Firestore reads** |

### `POST /products` (Create Product)
| Operation | Database | Count |
|-----------|----------|-------|
| createProduct (insert) | Supabase | 1 |
| createInventory variants | Supabase | 1 |
| assertLimitAvailable (count query) | Firestore | 1 |
| resolveAccessContext (shop+plan) | Firestore | 1–3 (if miss) |
| incrementUsage (usage_tracking) | Firestore | 1 read + 1 write |
| shopCounters.increment | Firestore | 1 write |
| costAnalytics.invalidate | Firestore | 1 write |
| logActivity | Firestore | 1 write |
| **Total** | | **2 Supabase + 5–9 Firestore** |

---

## STEP 18 — Performance Profiling (Estimated Baselines)

| API Endpoint | Estimated DB Time | Query Count | Status |
|---|---|---|---|
| `POST /invoices` (10 items) | 600–1200ms | 14 Supabase + 3 FS | ❌ FAIL |
| `GET /dashboard` (cold) | 800–1500ms | 9–11 Firestore | ❌ FAIL |
| `GET /products/:shopId` | 100–300ms | 1 Supabase | ✅ PASS |
| `GET /inventory/:shopId` | 150–400ms | 2 Supabase | ⚠️ OK |
| `POST /products` | 500–900ms | 2 Supabase + 7 FS | ❌ FAIL |
| `GET /reports/sales` | 400–800ms | 3–5 Firestore | ❌ FAIL |

---

## Success Criteria Verdict

| Target | Status |
|--------|--------|
| ↓ 80–95% Firestore Reads | ❌ NOT MET |
| ↓ 30–60% Firestore Writes | ❌ NOT MET |
| ↓ 40–70% Supabase Query Count | ❌ NOT MET |
| Dashboard Load <300ms | ❌ NOT MET (~800ms+) |
| POS Invoice <100ms | ❌ NOT MET (~600ms+) |
| No N+1 Queries | ❌ FOUND (invoice inventory loop) |
| No Duplicate Reads | ❌ FOUND (update-before-write pattern) |
| No SELECT * equivalent | ⚠️ All queries use `select('data')` on jsonb |
| No Full Collection Reads | ❌ Analytics reads 8 full collections |
| No Client-side Filtering | ❌ getLowStockItems, getInventoryHistory |
| No Repeated Config Reads | ✅ Cached (15 min TTL) |
| Business Logic Identical | ✅ YES |
