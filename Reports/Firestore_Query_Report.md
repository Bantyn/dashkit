# Firestore Query Report — Clothify ERP Backend
**Date:** 2026-07-18 | **Provider Status:** Supabase Active | **Firestore:** STILL ACTIVE (Hybrid Leak)

---

## Summary

Even with `DB_PROVIDER=supabase`, **78+ direct Firestore calls** remain active across the backend.
These are spread across services that were **not migrated** to the Repository Pattern.

---

## 1. Config / Provider Resolution

### `db-config.service.ts`
| Method | Operation | Collection | Trigger |
|--------|-----------|------------|---------|
| `getActiveProvider()` | `.doc().get()` | `platform_settings/active_db` | Every cold boot + cache miss |
| `setActiveProvider()` | `.doc().set()` | `platform_settings/active_db` | Provider switch |
| `getConfig(provider)` | `.doc().get()` | `platform_settings/config_supabase` | Supabase client init |
| `saveConfig()` | `.doc().set()` | `platform_settings/config_{provider}` | Config update |

**Cost:** Every cold start of `SupabaseManager.getClient()` triggers 2 Firestore reads
(getActiveProvider + getConfig). Cached after first call.

---

## 2. Subscription Module

### `subscription.service.ts`
| Method | Operation | Collection | Per-Request? |
|--------|-----------|------------|--------------|
| `ensureDefaultsInternal()` | `.doc().get()` | `system_meta` | Once per server boot |
| `listFeatures()` | `.get()` | `features` | Per cache miss (15m TTL) |
| `listPlans()` | `.get()` | `plans` | Per cache miss (15m TTL) |
| `getFeature()` | `.doc().get()` | `features` | Per cache miss |
| `getPlan()` | `.doc().get()` then `.get()` | `plans` | Per cache miss |
| `getShopById()` | `.doc().get()` | `shops` | Per cache miss (15m TTL) |
| `resolveAccessContext()` | Multiple reads above | — | **Every entity create** |
| `assertLimitAvailable()` | `.count().get()` | `products` or `branches` | **Every product/branch create** |
| `getUsage()` | `.doc().get()` | `usage_tracking` | Every increment |
| `incrementUsage()` | `resolveAccessContext()` + `.doc().set()` | `usage_tracking` | Every entity create |
| `getActiveAddons()` | `.where().get()` | `subscription_items` | Invoice upcoming check |
| `assignPlanToUser()` | `.doc().set()` | `shops` | Plan change |
| `createFeature()` | `.doc().set()` | `features` | Feature create |
| `updateFeature()` | `.doc().set()` | `features` | Feature update |
| `deleteFeature()` | `.doc().delete()` | `features` | Feature delete |
| `createPlan()` | `.doc().set()` | `plans` | Plan create |
| `updatePlan()` | `.doc().set()` | `plans` | Plan update |
| `deletePlan()` | `.doc().delete()` | `plans` | Plan delete |

**Estimated reads per product create (worst case, all cache misses):** 5–7 reads + 2 writes

---

## 3. Analytics Module (Biggest Offender)

### `analytics.service.ts`
| Method | Operation | Collections | Notes |
|--------|-----------|------------|-------|
| `queryCollection()` | `.where().get()` | `invoices`, `orders`, `expenses`, `products`, `customers`, `staff`, `inventory`, `branches` | **Full collection reads** |
| `loadShopCollections()` | 8× `queryCollection` | All above | Per dashboard cold load |
| Dashboard APIs | `loadShopCollections()` | All 8 | **~8 reads per cold request** |
| Report APIs | `loadShopCollections()` | 3–6 collections | **3–6 reads per cold report** |

**These are the largest single contributor to Firestore reads in the system.**
With 15-minute cache, a shop with 1 user hitting dashboard = 8 reads per 15 min = **768 reads/day per shop**.
With 10 shops = **7,680+ reads/day** from analytics alone.

---

## 4. Shop Counters

### `shop-counters.service.ts`
| Method | Operation | Collection | Notes |
|--------|-----------|------------|-------|
| `incrementCounter()` | `.doc().set({merge: true})` | `shop_counters` | Every product/order/invoice create |
| `getCounters()` | `.doc().get()` | `shop_counters` | Per analytics request (10m cached) |
| `getAllCounters()` | `.get()` | `shop_counters` | Cost analytics snapshot build |
| `seedCountersForShop()` | 6× `.count().get()` + 1 `.set()` | Multiple | One-time seed only |

**Impact:** Every product create → 1 Firestore write. Every order create → 1 Firestore write.

---

## 5. Staff / Activity Logging

### `staff.service.ts`
| Method | Operation | Collection | Notes |
|--------|-----------|------------|-------|
| `logActivity()` | `.add()` | `staff_activities` | **Synchronous**, blocks every write |
| Staff CRUD | `.get()`, `.set()`, `.update()`, `.delete()` | `staff` | Not migrated |
| `getStaffByShop()` | `.where().get()` | `staff` | Full staff fetch |

**Critical Issue:** `logActivity` is called synchronously inside `createInvoice`, `createOrder`, and `createProduct`. It adds **~50–200ms** to every POS transaction.

---

## 6. Cost Analytics Module

### `cost-analytics.service.ts`
| Method | Operation | Collection | Notes |
|--------|-----------|------------|-------|
| `getSnapshot()` | `.doc().get()` | `platform_cost_analytics` | 1 read, well-cached (5m) |
| `invalidateSnapshot()` | `.doc().set({merge:true})` | `platform_cost_analytics` | Every entity mutation |
| `buildAndSaveSnapshot()` | `.get()` × 4 + `.doc().get()` × 1 | Multiple | Background only |
| `getPricingSettings()` | `.where().get()` | `platform_costs_pricing` | 24h cached |
| `getAllShops()` | `.get()` | `shops` | 5m cached |
| `updatePricingSettings()` | `.update()`, `.set()` | `platform_costs_pricing`, `platform_costs_pricing_history` | Admin only |

**Impact per entity create:** `invalidateSnapshot()` fires → 1 Firestore write per every product/order/invoice.

---

## 7. Shop Service

### `shop.service.ts`
| Method | Operation | Collection | Notes |
|--------|-----------|------------|-------|
| `checkSubdomainAvailability()` | `.where().get()` | `shops` | Shop registration |
| `getPlatformManagedShopIds()` | `.where().get()` | `user_roles` | Admin list, cached 15m |
| Shop CRUD | `.doc().get()`, `.set()`, `.update()`, `.delete()` | `shops` | Not migrated |
| `getShopsByAdmin()` | `.get()` | `shops` | Full collection read |

---

## 8. DB Management Controller

### `db-management.controller.ts`
| Method | Operation | Collection | Notes |
|--------|-----------|------------|-------|
| `getOverview()` | 7× `.count().get()` | `products`, `customers`, `inventory`, `invoices`, `orders`, `categories`, `brands` | **7 Firestore count queries per admin overview request** |

---

## Firestore Cost Estimate

Assuming 50 shops, each with 50 POS transactions/day:

| Source | Reads/day | Writes/day |
|--------|-----------|------------|
| Analytics (cold dashboard, 1/15min per shop) | 8 × 50 × (1440/15) = ~38,400 | 0 |
| Product creates (50 shops × 20/day) | ~7 reads each × 1,000 = ~7,000 | ~4 writes × 1,000 = 4,000 |
| Invoice creates (50 shops × 50/day) | ~5 reads × 2,500 = 12,500 | ~3 writes × 2,500 = 7,500 |
| Config/Provider resolution | ~2 reads at boot × 10 restarts = 20 | 0 |
| **TOTAL** | **~58,000** | **~11,500** |

**Monthly: ~1.74M reads, ~345K writes**

Firestore free tier: 50K reads/day = **1.5M/month**
→ **Overflow: ~240K reads/month** → **Billable at $0.036/100K = ~$0.09/month USD baseline**

As shops grow (100+), this scales linearly and crosses billing thresholds.
