# Supabase Query Report — Clothify ERP Backend
**Date:** 2026-07-18

---

## Anti-Patterns Found

### 1. N+1 Query — `supabase-invoice.repository.ts::getTransactionInventoryItems`

**Severity: CRITICAL**

```typescript
// File: supabase-invoice.repository.ts, Line 104
// ❌ Current Implementation — N queries for N items
for (const item of items) {
  const { data } = await supabase.from('inventory')
    .select('data')
    .eq('shopId', shopId)
    .eq('productId', item.productId)
    .eq('variantSku', item.variantSku)
    .single();
  results.push(...);
}
```

A 10-item invoice runs **10 sequential Supabase round trips** to fetch inventory.
Each query waits for the previous one before starting (sequential, not parallel).

**Fix (Batch Query):**
```typescript
// ✅ Optimized — 1 query using OR filter or .in()
// Option A: Using array of productIds and in-memory matching
const productIds = items.map(i => i.productId);
const { data } = await supabase.from('inventory')
  .select('id, productId, variantSku, data')
  .eq('shopId', shopId)
  .in('productId', productIds);

// Then match in memory:
const invMap = new Map(data.map(d => [`${d.productId}:${d.variantSku}`, d]));
const results = items.map(item => invMap.get(`${item.productId}:${item.variantSku}`));
```
Impact: **10 queries → 1 query = 90% Supabase query reduction for POS**

---

### 2. Read-Before-Write (Double Round Trip) Pattern

**Severity: HIGH** — Affects 7 repository methods

**Affected Methods:**
- `supabase-product.repository.ts::updateProduct` (L74)
- `supabase-product.repository.ts::updateCategory` (L224)
- `supabase-product.repository.ts::updateBrand` (L262)
- `supabase-invoice.repository.ts::updateTransactionCustomer` (L136)
- `supabase-invoice.repository.ts::updateTransactionInventory` (L156)
- `supabase-invoice.repository.ts::updateTransactionProduct` (L172)
- `supabase-inventory.repository.ts::saveStockUpdate` (L99 when productUpdate)

**Root Cause:** Because the schema stores everything in a `data` JSONB column, partial updates require a read-merge-write pattern.

```typescript
// ❌ Current — 1 read + 1 write = 2 round trips
const product = await this.getProduct(id);       // READ
const updated = { ...product, ...payload };
await supabase.from('products').update({ data: updated }).eq('id', id); // WRITE
```

**Fix (Postgres JSONB merge operator via RPC):**
```sql
-- Create a Supabase RPC function:
CREATE OR REPLACE FUNCTION merge_jsonb_data(
  table_name text, record_id text, patch jsonb
) RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET data = data || $1 WHERE id = $2', table_name)
  USING patch, record_id;
END;
$$ LANGUAGE plpgsql;
```
```typescript
// ✅ Optimized — 1 round trip
await supabase.rpc('merge_jsonb_data', {
  table_name: 'products',
  record_id: id,
  patch: { ...payload, updatedAt: new Date().toISOString() }
});
```
Impact: **Eliminates 1 extra read per every update = 50% reduction in update round trips**

---

### 3. Full Table Scan + Client-Side Filtering

#### 3a. `getLowStockItems` — `supabase-inventory.repository.ts` (L131)

```typescript
// ❌ Current — Load all inventory, filter in Node.js
const { data } = await supabase.from('inventory').select('data').eq('shopId', shopId);
return data.map(d => d.data).filter(item => item.currentStock <= item.lowStockThreshold);
```

For a shop with 5,000 inventory records, all 5,000 rows are transferred over the network and filtered in Node.js.

**Fix (Database-level filter via column promotion):**
```sql
-- Add computed columns to the inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_stock int GENERATED ALWAYS AS ((data->>'currentStock')::int) STORED;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS low_stock_threshold int GENERATED ALWAYS AS ((data->>'lowStockThreshold')::int) STORED;
CREATE INDEX idx_inventory_low_stock ON inventory(shopId, current_stock, low_stock_threshold);
```
```typescript
// ✅ Optimized — Filter in database
const { data } = await supabase.from('inventory')
  .select('data')
  .eq('shopId', shopId)
  .lte('current_stock', supabase.rpc('get_low_stock_threshold'));
```

Or short-term fix using RPC:
```sql
CREATE OR REPLACE FUNCTION get_low_stock_items(shop_id text) RETURNS TABLE(data jsonb) AS $$
  SELECT data FROM inventory
  WHERE shopId = shop_id
    AND (data->>'currentStock')::int <= COALESCE((data->>'lowStockThreshold')::int, 10);
$$ LANGUAGE sql;
```

#### 3b. `getInventoryHistory` Date Filter — `supabase-inventory.repository.ts` (L122)

```typescript
// ❌ Current — Load all history, filter by date in Node.js
const { data } = await query;
if (filters?.date) {
  history = history.filter(h => h.createdAt?.startsWith(filters.date));
}
```

**Fix (Add `created_date` column or use PostgreSQL `::date` cast):**
```typescript
// ✅ Optimized — Filter in database using PostgreSQL date cast
let query = supabase.from('inventory_history')
  .select('data')
  .eq('shopId', shopId);

if (filters?.date) {
  // Using PostgreSQL cast on jsonb field — requires a generated column or RPC
  query = query.gte('created_at_col', filters.date).lt('created_at_col', nextDay);
}
```

---

### 4. `getInvoicesByShop` — Employee Filter in Node.js (L53)

```typescript
// ❌ Current
let invoices = data.map(d => d.data as Invoice);
if (employeeId) {
  invoices = invoices.filter(inv => inv.employeeId === employeeId);
}
```

Fetches all invoices then filters by employee in Node.js.

**Fix:** Promote `employeeId` as a real column:
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS employee_id text GENERATED ALWAYS AS (data->>'employeeId') STORED;
CREATE INDEX idx_invoices_employee ON invoices(shopId, employee_id);
```
```typescript
// ✅ Optimized
if (employeeId) query = query.eq('employee_id', employeeId);
```

---

### 5. `getInvoicesByCustomer` — JSONB Contains Scan (L62)

```typescript
// ❌ Current — Uses contains which does a full table scan on jsonb
.contains('data', { customerId })
```

`contains` on a `jsonb` column without a GIN index is a sequential scan.

**Fix (Add GIN index + promote column):**
```sql
CREATE INDEX idx_invoices_customer_id ON invoices USING GIN (data);
-- OR better: promote to real column
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id text GENERATED ALWAYS AS (data->>'customerId') STORED;
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
```

---

### 6. `supabase-product.repository.ts::getProducts()` — No Shop Filter (L58)

```typescript
// ❌ DANGEROUS — Returns ALL products across ALL shops
const { data } = await supabase.from('products').select('data');
```

This is a global unbounded query with no pagination and no shop scope.

**Fix:** This method should either be removed or require mandatory shopId + pagination.

---

### 7. All Repositories — Missing Pagination

Every list query has no pagination:
- `getProducts()` — unbounded
- `getCustomers()` — unbounded (if called globally)
- `getInvoices()` — unbounded
- `getOrders()` — unbounded

**Fix:** Add `.range(offset, offset+limit-1).order('created_at', { ascending: false })` to all list queries.

---

## Supabase Index Recommendations (see Index_Recommendations.md)

Missing indexes on current tables:
- `inventory(shopId, productId, variantSku)` — Composite for inventory lookup
- `invoices(shopId, branchId)` — Branch-scoped invoice queries
- `invoices(shopId, employee_id)` — Employee filtering
- `orders(shopId)` — Order listing
- `products(shopId, branchId)` — Shop+branch queries
- `inventory_history(shopId, movementType)` — History filtering
- GIN index on `invoices(data)` — JSONB search
