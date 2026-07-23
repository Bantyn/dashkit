# Cache Strategy — Clothify ERP Backend
**Date:** 2026-07-18

---

## Current Cache Inventory

| Cache Key Pattern | TTL | Layer | What it stores |
|---|---|---|---|
| `products:shop:{shopId}:{branchId}` | 5 min | Memory | Product list per shop |
| `product:{id}` | 5 min | Memory | Single product |
| `barcode:{shopId}:{barcode}` | 5 min | Memory | Barcode → productId mapping |
| `inventory:list:{shopId}` | 2 min | Memory | Inventory list |
| `inventory:history:{shopId}` | 2 min | Memory | Inventory history |
| `inventory:low-stock:{shopId}` | 2 min | Memory | Low stock items |
| `invoices:shop:{shopId}:{employeeId}:{branchId}` | 30 sec | Memory | Invoice list |
| `invoice:{id}` | 30 sec | Memory | Single invoice |
| `orders:shop:{shopId}` | 30 sec | Memory | Order list |
| `orders:my:{shopId}:{customerId}` | 30 sec | Memory | Customer orders |
| `order:{id}` | 30 sec | Memory | Single order |
| `analytics:dashboard:{shopId}:{staffId}:{period}` | 15 min | Memory | Dashboard data |
| `analytics:collections:{col}:{shopId}:...` | 15 min | Memory | Collection data per key |
| `analytics:report:{shopId}:{key}:...` | 15 min | Memory | Report data |
| `analytics:page:{shopId}:{key}:...` | 15 min | Memory | Analytics page data |
| `analytics:snapshot:latest` | 5 min | Memory | Cost analytics snapshot |
| `analytics:shops:all` | 5 min | Memory | All shops list |
| `analytics:plans:all` | 1 hour | Memory | Plans list |
| `cost-pricing:all` | 24 hours | Memory | Service pricing |
| `subscription:features:{active}` | 15 min | Memory | Feature definitions |
| `subscription:plans:{active}` | 15 min | Memory | Plan definitions |
| `subscription:feature:{key}` | 15 min | Memory | Single feature |
| `subscription:plan:{id/code}` | 15 min | Memory | Single plan |
| `subscription:access:{userId}:{shopId}` | 15 min | Memory | Resolved access context |
| `subscription:shop:{shopId}` | 15 min | Memory | Shop (from subscription) |
| `subscription:usage:{docId}` | 15 min | Memory | Usage tracking doc |
| `shop:{id}` | 15 min | Memory | Shop data |
| `shop-subdomain:{subdomain}` | 15 min | Memory | Subdomain lookup |
| `shop:platform-managed-ids` | 15 min | Memory | Admin shop IDs |
| `staff:list:{shopId}` | 1 min | Memory | Staff list |
| `staff:item:{id}` | 1 min | Memory | Single staff |
| `staff:logs:{shopId}:{staffId}` | 30 sec | Memory | Activity logs |
| `shop_counters:{shopId}` | 10 min | Memory | Shop counters |
| `shop_counters:all` | 10 min | Memory | All counters map |

---

## Problems with Current Cache

### Problem 1: Shared Static Cache — No Isolation Per Process
`CacheService` uses a `static` Map shared across all instances.
Multiple `new CacheService()` in different services all share the same store.
**This is actually correct behavior**, but the static map is never bounded in size.

### Problem 2: No Cache Size Limit / Eviction Policy
The current `CacheService` has no:
- Maximum entry count
- LRU eviction
- Memory pressure handling

A shop with 10,000 products can fill the cache with product data and never evict it.

### Problem 3: 30-Second Invoice/Order TTL Is Too Aggressive
Every invoice or order create invalidates all invoice keys for a shop.
For a busy POS with 10 cashiers, this causes constant cache misses.

### Problem 4: Analytics Cache Invalidated On Every Write
Every `createInvoice`, `createOrder`, `createProduct`, `deleteProduct` calls:
```typescript
this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
this.cache.deleteByPrefix(`analytics:report:${shopId}`);
// ... 4 more prefix deletes
```
On a busy POS day with 100 invoices, the analytics cache is invalidated 100 times, forcing 100 cold Firestore reads for the dashboard.

---

## Recommended Cache Strategy

### Layer 1: Static / Near-Immutable Data (24h+ TTL)

| Data | Current TTL | Recommended TTL | Notes |
|------|------------|-----------------|-------|
| Service Pricing | 24h ✅ | 24h | Correct |
| Feature Definitions | 15 min ⚠️ | 1 hour | Rarely changes |
| Plan Definitions | 15 min ⚠️ | 1 hour | Rarely changes |
| Platform Settings | Session | 30 min | Boot-time config |

### Layer 2: Tenant / Shop Data (15–60 min TTL)

| Data | Current TTL | Recommended TTL | Notes |
|------|------------|-----------------|-------|
| Shop (by ID) | 15 min ✅ | 15 min | Correct |
| Subscription Access Context | 15 min ✅ | 15 min | Correct |
| Shop Counters | 10 min ✅ | 10 min | Correct |
| Staff List | 1 min ⚠️ | 5 min | Can be longer |

### Layer 3: Transactional / Frequently Mutated Data (30s–5 min TTL)

| Data | Current TTL | Recommended TTL | Notes |
|------|------------|-----------------|-------|
| Invoice List | 30 sec ⚠️ | 2 min | Longer TTL, version-key invalidation |
| Order List | 30 sec ⚠️ | 2 min | Same |
| Inventory | 2 min ✅ | 2 min | Correct |
| Products | 5 min ✅ | 5 min | Correct |

### Layer 4: Analytics / Aggregations (15 min TTL, stale-while-revalidate)

**Key Change: Stop invalidating analytics cache on every write.**
Instead, use a **generation counter** or **version key** approach:

```typescript
// Instead of deleting on every write:
this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);

// Maintain a version counter in memory:
private analyticsVersion = new Map<string, number>();

invalidateAnalyticsVersion(shopId: string) {
  const current = this.analyticsVersion.get(shopId) || 0;
  this.analyticsVersion.set(shopId, current + 1);
  // DO NOT delete cache entries
}

getDashboardCacheKey(shopId: string, period: string) {
  const version = this.analyticsVersion.get(shopId) || 0;
  return `analytics:dashboard:${shopId}:${period}:v${version}`;
}
```

This approach:
- Keeps old cache entries (they expire naturally)
- Creates new cache key on invalidation (so next request gets fresh data)
- Doesn't delete existing data (no cache stampede)

---

## Recommended Cache Invalidation Rules

| Action | What to Invalidate |
|--------|-------------------|
| Create/Update/Delete Product | `products:shop:*` + increment analytics version |
| Create Invoice | `invoices:shop:{shopId}:*` + increment analytics version |
| Update Invoice | `invoice:{id}` + `invoices:shop:{shopId}:*` |
| Create Order | `orders:shop:{shopId}` + increment analytics version |
| Update Stock | `inventory:list:{shopId}` + `inventory:low-stock:{shopId}` |
| Update Plan | `subscription:plans:*` + `subscription:plan:{id}` |
| Update Feature | `subscription:features:*` + `subscription:feature:{key}` |
| Plan Assigned to Shop | `subscription:access:*:{shopId}` + `subscription:shop:{shopId}` |
| Update Shop | `shop:{id}` + `shop-subdomain:{subdomain}` |

---

## Future: Redis Layer (When Needed)

When horizontal scaling is needed (multiple Node.js processes):
```
Memory Cache (L1)     → Current Map<> — per process, sub-ms
Redis Cache (L2)      → Shared across processes, ~1–5ms
Database (L3)         → Firestore/Supabase, ~50–500ms
```

Redis keys to migrate first:
1. `subscription:access:*` — High read, shared across processes
2. `shop:*` — Every request reads this
3. `subscription:plans:*` — Every request reads this
4. `analytics:dashboard:*` — Expensive to rebuild

---

## Cache Size Limit Recommendation

Add to `CacheService`:
```typescript
private static readonly MAX_ENTRIES = 10_000;

set<T>(key: string, value: T, ttlMs: number): T {
  // Evict 10% of oldest entries when over limit
  if (CacheService.store.size >= CacheService.MAX_ENTRIES) {
    const toDelete = Math.floor(CacheService.MAX_ENTRIES * 0.1);
    const keys = CacheService.store.keys();
    for (let i = 0; i < toDelete; i++) {
      CacheService.store.delete(keys.next().value);
    }
  }
  // ... existing set logic
}
```
