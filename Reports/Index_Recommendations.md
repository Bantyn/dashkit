# Index Recommendations — Clothify ERP Backend
**Date:** 2026-07-18 | **Based on:** Actual query patterns in codebase

---

## Supabase (PostgreSQL) Indexes

### Current Schema Design Issue
All Supabase tables store data in a single `data JSONB` column.
Queries filter on `shopId`, `branchId`, `productId`, `variantSku` via **real columns**.
However, many filters (employeeId, customerId, movementType) are **inside JSONB** with no index.

---

### CRITICAL — Missing Composite Indexes (Supabase)

#### 1. `inventory` table

```sql
-- Used in: getInventoryByShop(), getInventoryItem(), saveStockUpdate()
-- Current: shopId is indexed (if exists), productId+variantSku are not composite
CREATE INDEX IF NOT EXISTS idx_inventory_shop_product_sku
  ON inventory (shopId, productId, variantSku);

-- Used in: getLowStockItems() — after column promotion
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
  ON inventory (shopId, current_stock, low_stock_threshold)
  WHERE current_stock <= low_stock_threshold;
-- (requires generated columns: current_stock, low_stock_threshold)
```

#### 2. `inventory_history` table

```sql
-- Used in: getInventoryHistory() filters
CREATE INDEX IF NOT EXISTS idx_inv_history_shop
  ON inventory_history (shopId, movementType);

-- Used in: isMovementDuplicate()
CREATE INDEX IF NOT EXISTS idx_inv_history_dedup
  ON inventory_history (productId, variantSku, movementType);

-- Date filtering (after column promotion)
-- ALTER TABLE inventory_history
--   ADD COLUMN IF NOT EXISTS created_date date
--   GENERATED ALWAYS AS ((data->>'createdAt')::date) STORED;
CREATE INDEX IF NOT EXISTS idx_inv_history_date
  ON inventory_history (shopId, created_date DESC);
```

#### 3. `invoices` table

```sql
-- Used in: getInvoicesByShop() — most common query
CREATE INDEX IF NOT EXISTS idx_invoices_shop_branch
  ON invoices (shopId, branchId);

-- Used in: getInvoicesByShop(employeeId filter) — after column promotion
-- ALTER TABLE invoices
--   ADD COLUMN IF NOT EXISTS employee_id text
--   GENERATED ALWAYS AS (data->>'employeeId') STORED;
CREATE INDEX IF NOT EXISTS idx_invoices_employee
  ON invoices (shopId, employee_id);

-- Used in: getInvoicesByCustomer()
-- ALTER TABLE invoices
--   ADD COLUMN IF NOT EXISTS customer_id text
--   GENERATED ALWAYS AS (data->>'customerId') STORED;
CREATE INDEX IF NOT EXISTS idx_invoices_customer
  ON invoices (customer_id);

-- JSONB GIN index for contains() queries
CREATE INDEX IF NOT EXISTS idx_invoices_data_gin
  ON invoices USING GIN (data);
```

#### 4. `products` table

```sql
-- Used in: getProductsByShop() — primary read path
CREATE INDEX IF NOT EXISTS idx_products_shop_branch
  ON products (shopId, branchId);

-- Used in: bulk import checks
CREATE INDEX IF NOT EXISTS idx_products_shop
  ON products (shopId);
```

#### 5. `orders` table

```sql
-- Used in: getOrdersByShop()
CREATE INDEX IF NOT EXISTS idx_orders_shop
  ON orders (shopId);

-- Used in: getOrdersByCustomer()
-- ALTER TABLE orders
--   ADD COLUMN IF NOT EXISTS customer_id text
--   GENERATED ALWAYS AS (data->>'customerId') STORED;
CREATE INDEX IF NOT EXISTS idx_orders_customer
  ON orders (shopId, customer_id);
```

#### 6. `customers` table

```sql
-- Used in: getCustomersByShop()
CREATE INDEX IF NOT EXISTS idx_customers_shop
  ON customers (shopId);

-- Used in: findByPhone in invoice creation
-- ALTER TABLE customers
--   ADD COLUMN IF NOT EXISTS phone_number text
--   GENERATED ALWAYS AS (data->>'phoneNumber') STORED;
CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers (shopId, phone_number);
```

#### 7. `purchase_orders`, `goods_received`, `supplier_payments`, `purchase_returns`

```sql
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop ON purchase_orders (shopId);
CREATE INDEX IF NOT EXISTS idx_goods_received_shop ON goods_received (shopId);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_shop ON supplier_payments (shopId);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_shop ON purchase_returns (shopId);
CREATE INDEX IF NOT EXISTS idx_suppliers_shop ON suppliers (shopId);
```

---

### Complete Supabase Index Migration Script

```sql
-- Run this once on your Supabase database:

-- 1. Inventory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_product_sku
  ON inventory (shopId, productId, variantSku);

-- 2. Inventory History
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_history_shop_type
  ON inventory_history (shopId, movementType);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_history_dedup
  ON inventory_history (productId, variantSku, movementType);

-- 3. Invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_shop_branch
  ON invoices (shopId, branchId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_data_gin
  ON invoices USING GIN (data jsonb_path_ops);

-- 4. Products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_shop_branch
  ON products (shopId, branchId);

-- 5. Orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shop
  ON orders (shopId);

-- 6. Customers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_shop
  ON customers (shopId);

-- 7. Purchase tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_shop ON purchase_orders (shopId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goods_received_shop ON goods_received (shopId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplier_payments_shop ON supplier_payments (shopId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_returns_shop ON purchase_returns (shopId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_shop ON suppliers (shopId);
```

**Note:** Use `CONCURRENTLY` to avoid table locks on production.

---

## Firestore Composite Indexes (still needed for unmigrated collections)

### `analytics.service.ts` — `queryCollection()` with date filter

```json
{
  "collectionGroup": "invoices",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "shopId", "order": "ASCENDING" },
    { "fieldPath": "branchId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "shopId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### `subscription.service.ts::getActiveAddons()`

```json
{
  "collectionGroup": "subscription_items",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "shopId", "order": "ASCENDING" },
    { "fieldPath": "isDeleted", "order": "ASCENDING" }
  ]
}
```

### `shop.service.ts` — Subdomain check

```json
{
  "collectionGroup": "shops",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "subdomain", "order": "ASCENDING" }
  ]
}
```

### `shop.service.ts::getPlatformManagedShopIds()`

```json
{
  "collectionGroup": "user_roles",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "roleId", "order": "ASCENDING" },
    { "fieldPath": "shopId", "order": "ASCENDING" }
  ]
}
```
