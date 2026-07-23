# Query Audit — Prioritized Fix List
**Clothify ERP Backend | Date:** 2026-07-18

---

## Priority Matrix

| Priority | Impact | Effort | Fix |
|----------|--------|--------|-----|
| P0 — CRITICAL | POS broken/slow | Low | Fix N+1 in invoice inventory lookup |
| P1 — HIGH | Analytics Firestore reads | Medium | Migrate analytics queries to Supabase |
| P2 — HIGH | Every entity create → Firestore reads | Low | Async log + cache subscription longer |
| P3 — MEDIUM | Update read-before-write | Medium | Postgres RPC for JSONB merge |
| P4 — MEDIUM | Client-side filtering | Low–Medium | Promote columns, add indexes |
| P5 — LOW | Analytics cache thrashing | Low | Version-key invalidation |

---

## P0 — Fix Invoice Inventory N+1

**File:** `supabase-invoice.repository.ts`
**Method:** `getTransactionInventoryItems` (Line 99–120)
**Impact:** -90% Supabase queries per invoice, POS from ~1200ms → ~200ms

**Current (N queries):**
```typescript
for (const item of items) {
  const { data } = await supabase.from('inventory')
    .select('data')
    .eq('shopId', shopId)
    .eq('productId', item.productId)
    .eq('variantSku', item.variantSku)
    .single();
  results.push(data ? { empty: false, docs: [...] } : { empty: true, docs: [] });
}
```

**Optimized (1 batch query):**
```typescript
async getTransactionInventoryItems(_tx: any, shopId: string, items: {productId: string; variantSku: string}[]): Promise<any[]> {
  if (!items.length) return [];
  const supabase = await this.getClient();
  const productIds = [...new Set(items.map(i => i.productId))];
  
  const { data } = await supabase.from('inventory')
    .select('id, productId, variantSku, data')
    .eq('shopId', shopId)
    .in('productId', productIds);
  
  const invMap = new Map<string, any>();
  (data || []).forEach(d => {
    const key = `${d.productId}:${d.variantSku || ''}`;
    invMap.set(key, d);
  });
  
  return items.map(item => {
    const key = `${item.productId}:${item.variantSku || ''}`;
    const found = invMap.get(key);
    return found
      ? { empty: false, docs: [{ data: () => found.data, ref: { id: found.id } }] }
      : { empty: true, docs: [] };
  });
}
```

---

## P1 — Migrate `analytics.service.ts` to Supabase Repository

**File:** `analytics.service.ts`
**Method:** `queryCollection()` (Line 131–158)
**Impact:** -40,000 Firestore reads/day (at 50 shops)

**Current:** Direct `db.collection(collection).where(...).get()` for `invoices`, `orders`, `expenses`, `products`, `customers`, `staff`, `inventory`, `branches`.

**Fix:** Route each collection through the appropriate repository:
```typescript
// Instead of:
let query = db.collection(collection).where("shopId", "==", shopId);

// Use:
switch(collection) {
  case 'invoices':
    return RepositoryFactory.getInvoiceRepository().getInvoicesByShop(shopId, undefined, branchId);
  case 'orders':
    return RepositoryFactory.getOrderRepository().getOrdersByShop(shopId, branchId);
  case 'products':
    return RepositoryFactory.getProductRepository().getProductsByShop(shopId, branchId);
  case 'inventory':
    return RepositoryFactory.getInventoryRepository().getInventoryByShop(shopId);
  case 'customers':
    return RepositoryFactory.getCustomerRepository().getCustomersByShop(shopId);
  // expenses, staff, branches → still Firestore until migrated
}
```

---

## P2a — Make `logActivity` Truly Async (Non-Blocking)

**File:** `staff.service.ts`
**Method:** `logActivity()` (Line 58–74)
**Impact:** -50 to -200ms per POS transaction

**Current:**
```typescript
async logActivity(data) {
  try {
    await db.collection(LOGS_COLLECTION).add({ ...data, timestamp: new Date() });
    this.invalidateLogsCache(data.shopId);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
```

**Fix (fire-and-forget, non-blocking):**
```typescript
logActivity(data: {...}): void {  // Note: void return, no async/await in caller
  setImmediate(async () => {
    try {
      await db.collection(LOGS_COLLECTION).add({ ...data, timestamp: new Date() });
      this.invalidateLogsCache(data.shopId);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  });
}
```

**Callers to update** (remove `await`):
- `product.service.ts` line 47: `await logActivity(...)` → `logActivity(...)`
- `invoice.service.ts` wherever called
- `order.service.ts` wherever called

---

## P2b — Remove Firestore Count in `assertLimitAvailable`

**File:** `subscription.service.ts`
**Method:** `assertLimitAvailable()` (Line 754–766)
**Impact:** -1,000 Firestore reads/day

**Current:**
```typescript
if (input.limitKey === "products_count" && input.shopId) {
  const snap = await db.collection("products").where("shopId", "==", input.shopId).count().get();
  currentUsed = snap.data().count;
}
```

**Fix (use ShopCounters which is already cached):**
```typescript
if (input.limitKey === "products_count" && input.shopId) {
  const counters = await shopCountersService.getCounters(input.shopId);
  currentUsed = counters?.products || 0;
} else if (input.limitKey === "branch_count" && input.shopId) {
  const counters = await shopCountersService.getCounters(input.shopId);
  currentUsed = counters?.branches || 0;
}
```

---

## P2c — Increase Subscription Access Cache TTL

**File:** `subscription.service.ts`
**Line 44:**
```typescript
// Current:
private readonly ttlMs = 15 * 60 * 1000; // 15 minutes

// Recommended (for access context and usage — lower mutation rate):
private readonly accessTtlMs = 30 * 60 * 1000; // 30 minutes
private readonly usageTtlMs = 5 * 60 * 1000;   // 5 minutes (usage changes more often)
```

---

## P3 — JSONB Merge RPC (Eliminate Read-Before-Write)

**Files:** All 7 methods listed in Supabase Query Report.
**Impact:** -50% round trips for every update operation.

Create Supabase RPC function:
```sql
CREATE OR REPLACE FUNCTION merge_jsonb_data(
  p_table text,
  p_id text,
  p_patch jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE %I SET data = data || $1 WHERE id = $2', p_table)
  USING p_patch, p_id;
END;
$$;
```

Then in `supabase-product.repository.ts::updateProduct`:
```typescript
async updateProduct(id: string, payload: any): Promise<void> {
  const supabase = await this.getClient();
  const patch = { ...payload, updatedAt: new Date().toISOString() };
  const { error } = await supabase.rpc('merge_jsonb_data', {
    p_table: 'products',
    p_id: id,
    p_patch: patch
  });
  if (error) throw new Error(error.message);
}
```

Apply same pattern to all other update methods.

---

## P4 — Add Generated Columns + Indexes (Supabase)

**Priority:** Run as a one-time database migration.

```sql
-- Enable filtering without loading full JSONB:

-- invoices: employee filter
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS employee_id text
  GENERATED ALWAYS AS (data->>'employeeId') STORED;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_employee
  ON invoices (shopId, employee_id);

-- customers: phone search
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone_number text
  GENERATED ALWAYS AS (data->>'phoneNumber') STORED;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone
  ON customers (shopId, phone_number);

-- inventory: low stock filtering
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS current_stock int
  GENERATED ALWAYS AS ((data->>'currentStock')::int) STORED;
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS low_stock_threshold int
  GENERATED ALWAYS AS (COALESCE((data->>'lowStockThreshold')::int, 10)) STORED;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock
  ON inventory (shopId, current_stock)
  WHERE current_stock <= 10;
```

---

## P5 — Stop Cache Stampede on Analytics Invalidation

**Files:** `product.service.ts`, `invoice.service.ts`, `order.service.ts`, `inventory.service.ts`

**Current Pattern:**
```typescript
this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
this.cache.deleteByPrefix(`analytics:report:${shopId}`);
// 4 more deleteByPrefix calls
```

**Fix (version-key based invalidation):**
Add to `AnalyticsService`:
```typescript
private static analyticsVersion = new Map<string, number>();

static incrementVersion(shopId: string): void {
  const v = AnalyticsService.analyticsVersion.get(shopId) || 0;
  AnalyticsService.analyticsVersion.set(shopId, v + 1);
}

private getDashboardCacheKey(shopId: string, staffId?: string, period = 'this_month') {
  const v = AnalyticsService.analyticsVersion.get(shopId) || 0;
  return `analytics:dashboard:${shopId}:${staffId||'all'}:${period}:v${v}`;
}
```

Then in `product.service.ts::invalidateShopCache`:
```typescript
// Replace 4 deleteByPrefix calls with:
const { analyticsService } = require('../analytics/analytics.service');
analyticsService.constructor.incrementVersion(shopId);
```

---

## Summary Table

| Fix | Files | DB Impact | Time Impact |
|-----|-------|-----------|-------------|
| P0: Fix N+1 inventory | supabase-invoice.repository.ts | -90% Supabase per invoice | -300–500ms POS |
| P1: Analytics → Supabase | analytics.service.ts | -40,000 FS reads/day | -200–600ms dashboard |
| P2a: Async logActivity | staff.service.ts | 0 reads | -100ms POS |
| P2b: assertLimit → counters | subscription.service.ts | -1,000 FS reads/day | -50ms per create |
| P2c: Cache TTL increase | subscription.service.ts | -5,000 FS reads/day | -100ms per create |
| P3: JSONB merge RPC | All supabase repos | -50% update round trips | -50ms per update |
| P4: Generated columns + indexes | Supabase DB | DB-level filtering | -100ms filtered queries |
| P5: Version-key invalidation | analytics.service.ts | Prevent stampede | Consistent 15min cache |
