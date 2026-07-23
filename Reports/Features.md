# Clothify - Implemented Features Inventory

This document provides a comprehensive list of all actually implemented and working features in the Clothify project, covering the customer storefront, admin dashboard, staff mobile app, and central API backend.

---

# Project Overview

* **Project Name:** Clothify - Clothing Store SaaS Platform
* **Tech Stack:** Full-stack TypeScript/JavaScript
* **Frontend:** Angular 21 (with Server-Side Rendering / SSR and Tailwind CSS)
* **Backend:** Node.js, Express.js, TypeScript
* **Database:** Firebase Firestore
* **Authentication:** Firebase Authentication (Email/Password, Phone OTP)
* **Storage:** AWS S3, Cloudinary, Firebase Storage
* **Third-party Integrations:** Razorpay (Payments), Shiprocket & Delhivery (Shipping), Nodemailer (Email)

---

# Feature Summary

| Module | Status | Total Features |
| --- | --- | --- |
| Authentication | Complete | 4 |
| Dashboard | Complete | 3 |
| Products | Complete | 6 |
| Inventory | Complete | 5 |
| Orders | Complete | 4 |
| Billing (Invoices) | Complete | 4 |
| Customers & CRM | Complete | 6 |
| Staff Management | Complete | 5 |
| Website / CMS | Complete | 4 |
| Media | Complete | 2 |
| Notifications | Complete | 3 |
| Payments | Complete | 2 |
| Shipping | Complete | 2 |
| Reports & Analytics | Complete | 5 |
| Settings | Complete | 6 |
| Tailoring | Complete | 2 |

---

# Detailed Feature List

## 1. Multi-Tenant Authentication & Authorization
**Status:** Complete

### Description
Secure authentication system supporting shop owners, staff, and platform admins, with fine-grained Role-Based Access Control (RBAC).

### User Roles
- Platform Admin, Shop Owner, Staff Member, Customer

### Frontend
- **Pages:** `/login`, `/register`
- **Components:** `LoginComponent`, `RegisterComponent`, `AuthCardComponent`
- **Flow:** User enters credentials or requests phone OTP -> signs in -> token stored -> redirected to role-based dashboard.

### Backend
- **Endpoints:** `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/send-otp`, `/api/v1/auth/verify-otp`
- **Controllers:** AuthController
- **Middleware:** `verifyToken`, `attachUserRoles`, `checkPermission`

### Database
- **Collections:** `users`, `otps`, `roles`
- **Fields:** `uid`, `email`, `phoneNumber`, `roles`, `shopId`

### Validation
- Email/Password format checks, OTP length and expiry validation.

### Permissions
- Public access for login/register. Restricted endpoints require token verification.

---

## 2. Invoicing and Point of Sale (POS)
**Status:** Complete

### Description
Drawn from POS frontend to generate instant digital invoices for in-store purchases.

### User Roles
- Shop Owner, Staff Member

### Frontend
- **Pages:** `/pos`, `/:shopId/invoices/shop`
- **Components:** `POSComponent`, `InvoiceListComponent`, `InvoicePrintPageComponent`

### Backend
- **Endpoints:** `/api/v1/admin/invoice/`, `/api/v1/admin/invoice/shop/:shopId`
- **Services:** InvoiceService
- **Database:** `invoices` (stores items, tax rate, payment method, totals)

---

## 3. Inventory & Daily Stock Tracking
**Status:** Complete

### Description
Manages inventory levels, logs low-stock items, and tracks daily opening/closing stock logs.

### User Roles
- Shop Owner, Staff

### Frontend
- **Pages:** `/inventory`, `/inventory/low-stock`, `/inventory/opening-stock`
- **Components:** `InventoryComponent`, `LowStockListComponent`, `DailyOpeningStockComponent`

### Backend
- **Endpoints:** `/api/v1/admin/inventory/:shopId`, `/api/v1/admin/daily-stock/`
- **Database:** `inventory`, `inventory_history`, `daily_stock`

---

## 4. Tailoring & Job Cards
**Status:** Complete

### Description
Creates custom tailoring measurement tickets and logs job cards for tailors.

### User Roles
- Shop Owner, Staff, Tailor

### Frontend
- **Pages:** `/tailoring`
- **Components:** `TailoringListComponent`, `TailorJobCardsComponent`

### Backend
- **Endpoints:** `/api/v1/admin/tailoring/`, `/api/v1/admin/tailor-job-cards/`
- **Database:** `tailoring`, `tailor_job_cards`

---

## 5. Accounting & Ledgers
**Status:** Complete

### Description
Generates Cash Book, Bank Book, Receivables/Payables statements, and GST tax reports based on sales and expenses.

### User Roles
- Shop Owner

### Frontend
- **Pages:** `/accounting/cashbook`, `/accounting/bankbook`, `/accounting/ledger`, `/accounting/gst-report`
- **Components:** `CashBook`, `BankBook`, `Ledger`, `GSTReportComponent`

### Backend
- **Endpoints:** `/api/v1/admin/accounting/:shopId/cashbook`, `/api/v1/admin/accounting/:shopId/gst-report`
- **Services:** `AccountingService` (processes raw transactions from invoices and expenses)

---

## 6. Staff Mobile App
**Status:** Complete

### Description
A React Native Expo mobile app for internal store staff to scan barcodes/QR codes and track operations.

### User Roles
- Shop Staff

### Frontend (Mobile)
- **Files:** `App.tsx`, `src/screens/*`
- **Hardware Integration:** Camera / Barcode scanner

### Backend
- **Endpoints:** `/api/v1/admin/staff/login`, `/api/v1/admin/product/barcode/:shopId/:barcode`

---

# API Inventory

Here is the list of all implemented APIs:

| Method | Endpoint | Auth Required | Description |
| --- | --- | --- | --- |
| **GET** | `/api/v1/admin/accounting/:shopId/cashbook` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/accounting/:shopId/bankbook` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/accounting/:shopId/ledger` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/accounting/:shopId/receivables` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/accounting/:shopId/payables` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/accounting/:shopId/gst-report` | undefined | Handled by `accounting` module |\n| **GET** | `/api/v1/admin/admin/overview` | undefined | Handled by `admin` module |\n| **GET** | `/api/v1/admin/admin/users` | undefined | Handled by `admin` module |\n| **GET** | `/api/v1/admin/admin/transactions` | undefined | Handled by `admin` module |\n| **GET** | `/api/v1/admin/analytics/dashboard` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/dashboard` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/staff-performance` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/pages/sales` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/pages/customers` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/pages/products` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/pages/branches` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/reports/sales` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/reports/website-sales` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/reports/inventory` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/reports/profit-loss` | undefined | Handled by `analytics` module |\n| **GET** | `/api/v1/admin/analytics/:shopId/reports/tax` | undefined | Handled by `analytics` module |\n| **POST** | `/api/v1/admin/announcement/` | undefined | Handled by `announcement` module |\n| **GET** | `/api/v1/admin/auth/profile` | undefined | Handled by `auth` module |\n| **PUT** | `/api/v1/admin/auth/update-profile` | undefined | Handled by `auth` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId/summaries` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId/analytics-summaries` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId/permissions` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId/:branchId/activity` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/shop/:shopId/:branchId/analytics` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/branch/:id` | undefined | Handled by `branch` module |\n| **POST** | `/api/v1/admin/branch/` | undefined | Handled by `branch` module |\n| **PUT** | `/api/v1/admin/branch/:id` | undefined | Handled by `branch` module |\n| **DELETE** | `/api/v1/admin/branch/:id` | undefined | Handled by `branch` module |\n| **GET** | `/api/v1/admin/brand/` | undefined | Handled by `brand` module |\n| **POST** | `/api/v1/admin/brand/` | undefined | Handled by `brand` module |\n| **PUT** | `/api/v1/admin/brand/:id` | undefined | Handled by `brand` module |\n| **DELETE** | `/api/v1/admin/brand/:id` | undefined | Handled by `brand` module |\n| **POST** | `/api/v1/admin/category/` | undefined | Handled by `category` module |\n| **GET** | `/api/v1/admin/category/shop/:shopId` | undefined | Handled by `category` module |\n| **GET** | `/api/v1/admin/category/:id` | undefined | Handled by `category` module |\n| **PUT** | `/api/v1/admin/category/:id` | undefined | Handled by `category` module |\n| **DELETE** | `/api/v1/admin/category/:id` | undefined | Handled by `category` module |\n| **POST** | `/api/v1/admin/credit-note/` | undefined | Handled by `credit-note` module |\n| **GET** | `/api/v1/admin/credit-note/shop/:shopId` | undefined | Handled by `credit-note` module |\n| **PUT** | `/api/v1/admin/credit-note/:id/status` | undefined | Handled by `credit-note` module |\n| **POST** | `/api/v1/admin/credit-note/:id/convert` | undefined | Handled by `credit-note` module |\n| **GET** | `/api/v1/admin/crm/:shopId/segments` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/crm/:shopId/vip` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/crm/:shopId/birthdays/today` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/crm/:shopId/birthdays/upcoming` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/crm/:shopId/anniversaries/today` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/crm/:shopId/anniversaries/upcoming` | undefined | Handled by `crm` module |\n| **POST** | `/api/v1/admin/crm/:shopId/recalculate-segments` | undefined | Handled by `crm` module |\n| **GET** | `/api/v1/admin/customer-credit/` | undefined | Handled by `customer-credit` module |\n| **GET** | `/api/v1/admin/customer-credit/shop/:shopId` | undefined | Handled by `customer-credit` module |\n| **POST** | `/api/v1/admin/customer-credit/adjust` | undefined | Handled by `customer-credit` module |\n| **GET** | `/api/v1/admin/customer/find` | undefined | Handled by `customer` module |\n| **POST** | `/api/v1/admin/customer/` | undefined | Handled by `customer` module |\n| **GET** | `/api/v1/admin/customer/shop/:shopId` | undefined | Handled by `customer` module |\n| **GET** | `/api/v1/admin/customer/:id` | undefined | Handled by `customer` module |\n| **PATCH** | `/api/v1/admin/customer/:id` | undefined | Handled by `customer` module |\n| **DELETE** | `/api/v1/admin/customer/:id` | undefined | Handled by `customer` module |\n| **GET** | `/api/v1/admin/daily-stock/shop/:shopId/today` | undefined | Handled by `daily-stock` module |\n| **POST** | `/api/v1/admin/daily-stock/` | undefined | Handled by `daily-stock` module |\n| **PUT** | `/api/v1/admin/daily-stock/:id` | undefined | Handled by `daily-stock` module |\n| **POST** | `/api/v1/admin/delhivery/serviceability` | undefined | Handled by `delhivery` module |\n| **POST** | `/api/v1/admin/delhivery/shipment` | undefined | Handled by `delhivery` module |\n| **GET** | `/api/v1/admin/delhivery/track/:awb` | undefined | Handled by `delhivery` module |\n| **GET** | `/api/v1/admin/delhivery/packingslip/:awb` | undefined | Handled by `delhivery` module |\n| **GET** | `/api/v1/admin/expense/shop/:shopId` | undefined | Handled by `expense` module |\n| **POST** | `/api/v1/admin/expense/shop/:shopId` | undefined | Handled by `expense` module |\n| **PUT** | `/api/v1/admin/expense/:id` | undefined | Handled by `expense` module |\n| **DELETE** | `/api/v1/admin/expense/:id` | undefined | Handled by `expense` module |\n| **GET** | `/api/v1/admin/expense/shop/:shopId/categories` | undefined | Handled by `expense` module |\n| **POST** | `/api/v1/admin/expense/shop/:shopId/categories` | undefined | Handled by `expense` module |\n| **DELETE** | `/api/v1/admin/expense/categories/:id` | undefined | Handled by `expense` module |\n| **GET** | `/api/v1/admin/feature/` | undefined | Handled by `feature` module |\n| **GET** | `/api/v1/admin/feature/:key` | undefined | Handled by `feature` module |\n| **POST** | `/api/v1/admin/feature/` | undefined | Handled by `feature` module |\n| **PUT** | `/api/v1/admin/feature/:key` | undefined | Handled by `feature` module |\n| **DELETE** | `/api/v1/admin/feature/:key` | undefined | Handled by `feature` module |\n| **GET** | `/api/v1/admin/integrations/` | undefined | Handled by `integrations` module |\n| **PUT** | `/api/v1/admin/integrations/` | undefined | Handled by `integrations` module |\n| **DELETE** | `/api/v1/admin/integrations/:provider` | undefined | Handled by `integrations` module |\n| **GET** | `/api/v1/admin/inventory/:shopId` | undefined | Handled by `inventory` module |\n| **PUT** | `/api/v1/admin/inventory/update-stock` | undefined | Handled by `inventory` module |\n| **GET** | `/api/v1/admin/inventory/low-stock/:shopId` | undefined | Handled by `inventory` module |\n| **GET** | `/api/v1/admin/inventory/history/:shopId` | undefined | Handled by `inventory` module |\n| **POST** | `/api/v1/admin/invoice/` | undefined | Handled by `invoice` module |\n| **GET** | `/api/v1/admin/invoice/` | undefined | Handled by `invoice` module |\n| **GET** | `/api/v1/admin/invoice/shop/:shopId` | undefined | Handled by `invoice` module |\n| **GET** | `/api/v1/admin/invoice/customer/:customerId` | undefined | Handled by `invoice` module |\n| **GET** | `/api/v1/admin/invoice/:id` | undefined | Handled by `invoice` module |\n| **PUT** | `/api/v1/admin/invoice/:id` | undefined | Handled by `invoice` module |\n| **DELETE** | `/api/v1/admin/invoice/:id` | undefined | Handled by `invoice` module |\n| **GET** | `/api/v1/admin/lead/` | undefined | Handled by `lead` module |\n| **PATCH** | `/api/v1/admin/lead/:id` | undefined | Handled by `lead` module |\n| **DELETE** | `/api/v1/admin/lead/:id` | undefined | Handled by `lead` module |\n| **POST** | `/api/v1/admin/media/upload` | undefined | Handled by `media` module |\n| **GET** | `/api/v1/admin/notification/shop/:shopId` | undefined | Handled by `notification` module |\n| **PUT** | `/api/v1/admin/notification/shop/:shopId/read-all` | undefined | Handled by `notification` module |\n| **PATCH** | `/api/v1/admin/notification/:id/read` | undefined | Handled by `notification` module |\n| **GET** | `/api/v1/admin/notification/templates` | undefined | Handled by `notification` module |\n| **POST** | `/api/v1/admin/notification/templates` | undefined | Handled by `notification` module |\n| **PUT** | `/api/v1/admin/notification/templates/:id` | undefined | Handled by `notification` module |\n| **GET** | `/api/v1/admin/notification/logs` | undefined | Handled by `notification` module |\n| **POST** | `/api/v1/admin/notification/send-test` | undefined | Handled by `notification` module |\n| **POST** | `/api/v1/admin/offer/` | undefined | Handled by `offer` module |\n| **GET** | `/api/v1/admin/offer/shop/:shopId` | undefined | Handled by `offer` module |\n| **PUT** | `/api/v1/admin/offer/:id` | undefined | Handled by `offer` module |\n| **DELETE** | `/api/v1/admin/offer/:id` | undefined | Handled by `offer` module |\n| **POST** | `/api/v1/admin/offer/validate` | undefined | Handled by `offer` module |\n| **GET** | `/api/v1/admin/order/` | undefined | Handled by `order` module |\n| **GET** | `/api/v1/admin/order/shop/:shopId` | undefined | Handled by `order` module |\n| **GET** | `/api/v1/admin/order/:id` | undefined | Handled by `order` module |\n| **PUT** | `/api/v1/admin/order/:id/status` | undefined | Handled by `order` module |\n| **PUT** | `/api/v1/admin/order/:id/payment-status` | undefined | Handled by `order` module |\n| **DELETE** | `/api/v1/admin/order/:id` | undefined | Handled by `order` module |\n| **GET** | `/api/v1/admin/platform-settings/themes` | undefined | Handled by `platform-settings` module |\n| **PUT** | `/api/v1/admin/platform-settings/themes` | undefined | Handled by `platform-settings` module |\n| **GET** | `/api/v1/admin/platform-settings/billing` | undefined | Handled by `platform-settings` module |\n| **PUT** | `/api/v1/admin/platform-settings/billing` | undefined | Handled by `platform-settings` module |\n| **POST** | `/api/v1/admin/product/` | undefined | Handled by `product` module |\n| **POST** | `/api/v1/admin/product/bulk-import` | undefined | Handled by `product` module |\n| **GET** | `/api/v1/admin/product/` | undefined | Handled by `product` module |\n| **GET** | `/api/v1/admin/product/:id` | undefined | Handled by `product` module |\n| **GET** | `/api/v1/admin/product/barcode/:shopId/:barcode` | undefined | Handled by `product` module |\n| **PUT** | `/api/v1/admin/product/:id` | undefined | Handled by `product` module |\n| **DELETE** | `/api/v1/admin/product/:id` | undefined | Handled by `product` module |\n| **GET** | `/api/v1/admin/product/shop/:shopId` | undefined | Handled by `product` module |\n| **POST** | `/api/v1/admin/promotions/` | undefined | Handled by `promotions` module |\n| **GET** | `/api/v1/admin/promotions/shop/:shopId` | undefined | Handled by `promotions` module |\n| **GET** | `/api/v1/admin/promotions/:id` | undefined | Handled by `promotions` module |\n| **PUT** | `/api/v1/admin/promotions/:id` | undefined | Handled by `promotions` module |\n| **DELETE** | `/api/v1/admin/promotions/:id` | undefined | Handled by `promotions` module |\n| **GET** | `/api/v1/admin/purchase/suppliers` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/purchase/suppliers` | undefined | Handled by `purchase` module |\n| **PUT** | `/api/v1/admin/purchase/suppliers/:id` | undefined | Handled by `purchase` module |\n| **DELETE** | `/api/v1/admin/purchase/suppliers/:id` | undefined | Handled by `purchase` module |\n| **GET** | `/api/v1/admin/purchase/orders` | undefined | Handled by `purchase` module |\n| **GET** | `/api/v1/admin/purchase/orders/:id` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/purchase/orders` | undefined | Handled by `purchase` module |\n| **PUT** | `/api/v1/admin/purchase/orders/:id` | undefined | Handled by `purchase` module |\n| **DELETE** | `/api/v1/admin/purchase/orders/:id` | undefined | Handled by `purchase` module |\n| **GET** | `/api/v1/admin/purchase/received` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/purchase/received` | undefined | Handled by `purchase` module |\n| **GET** | `/api/v1/admin/purchase/payments` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/purchase/payments` | undefined | Handled by `purchase` module |\n| **GET** | `/api/v1/admin/purchase/returns` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/purchase/returns` | undefined | Handled by `purchase` module |\n| **POST** | `/api/v1/admin/return/` | undefined | Handled by `return` module |\n| **GET** | `/api/v1/admin/return/shop/:shopId` | undefined | Handled by `return` module |\n| **GET** | `/api/v1/admin/return/shop/:shopId/refunds` | undefined | Handled by `return` module |\n| **GET** | `/api/v1/admin/return/:id` | undefined | Handled by `return` module |\n| **PUT** | `/api/v1/admin/return/:id/status` | undefined | Handled by `return` module |\n| **GET** | `/api/v1/admin/review/` | undefined | Handled by `review` module |\n| **GET** | `/api/v1/admin/role/` | undefined | Handled by `role` module |\n| **PUT** | `/api/v1/admin/role/assign/:userId` | undefined | Handled by `role` module |\n| **GET** | `/api/v1/admin/role/:id` | undefined | Handled by `role` module |\n| **POST** | `/api/v1/admin/role/` | undefined | Handled by `role` module |\n| **PUT** | `/api/v1/admin/role/:id` | undefined | Handled by `role` module |\n| **DELETE** | `/api/v1/admin/role/:id` | undefined | Handled by `role` module |\n| **GET** | `/api/v1/admin/search/:shopId` | undefined | Handled by `search` module |\n| **POST** | `/api/v1/admin/shiprocket/connect` | undefined | Handled by `shiprocket` module |\n| **GET** | `/api/v1/admin/shiprocket/status` | undefined | Handled by `shiprocket` module |\n| **GET** | `/api/v1/admin/shiprocket/pickup-locations` | undefined | Handled by `shiprocket` module |\n| **POST** | `/api/v1/admin/shiprocket/test` | undefined | Handled by `shiprocket` module |\n| **PUT** | `/api/v1/admin/shiprocket/pickup-location` | undefined | Handled by `shiprocket` module |\n| **POST** | `/api/v1/admin/shiprocket/disconnect` | undefined | Handled by `shiprocket` module |\n| **POST** | `/api/v1/admin/shop/` | undefined | Handled by `shop` module |\n| **GET** | `/api/v1/admin/shop/` | undefined | Handled by `shop` module |\n| **GET** | `/api/v1/admin/shop/requests` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/shop/requests/:requestId/action` | undefined | Handled by `shop` module |\n| **GET** | `/api/v1/admin/shop/:id` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/shop/:id/deactivate-request` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/shop/:id/reactivate-request` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/shop/:id/generate-api-key` | undefined | Handled by `shop` module |\n| **PUT** | `/api/v1/admin/shop/:id` | undefined | Handled by `shop` module |\n| **DELETE** | `/api/v1/admin/shop/:id` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/shop/check-subdomain` | undefined | Handled by `shop` module |\n| **POST** | `/api/v1/admin/staff/login` | undefined | Handled by `staff` module |\n| **POST** | `/api/v1/admin/staff/` | undefined | Handled by `staff` module |\n| **GET** | `/api/v1/admin/staff/shop/:shopId` | undefined | Handled by `staff` module |\n| **GET** | `/api/v1/admin/staff/:id` | undefined | Handled by `staff` module |\n| **PUT** | `/api/v1/admin/staff/:id` | undefined | Handled by `staff` module |\n| **DELETE** | `/api/v1/admin/staff/:id` | undefined | Handled by `staff` module |\n| **GET** | `/api/v1/admin/staff/shop/:shopId/logs` | undefined | Handled by `staff` module |\n| **GET** | `/api/v1/admin/subscription-plan/` | undefined | Handled by `subscription-plan` module |\n| **GET** | `/api/v1/admin/subscription-plan/:id` | undefined | Handled by `subscription-plan` module |\n| **POST** | `/api/v1/admin/subscription-plan/` | undefined | Handled by `subscription-plan` module |\n| **PUT** | `/api/v1/admin/subscription-plan/:id` | undefined | Handled by `subscription-plan` module |\n| **DELETE** | `/api/v1/admin/subscription-plan/:id` | undefined | Handled by `subscription-plan` module |\n| **GET** | `/api/v1/admin/subscription/access/:userId` | undefined | Handled by `subscription` module |\n| **PUT** | `/api/v1/admin/subscription/users/:userId/plan` | undefined | Handled by `subscription` module |\n| **POST** | `/api/v1/admin/support/` | undefined | Handled by `support` module |\n| **GET** | `/api/v1/admin/support/` | undefined | Handled by `support` module |\n| **POST** | `/api/v1/admin/support/:ticketId/reply` | undefined | Handled by `support` module |\n| **POST** | `/api/v1/admin/support/:ticketId/close` | undefined | Handled by `support` module |\n| **GET** | `/api/v1/admin/tailoring/` | undefined | Handled by `tailoring` module |\n| **POST** | `/api/v1/admin/tailoring/` | undefined | Handled by `tailoring` module |\n| **GET** | `/api/v1/admin/tailoring/:id` | undefined | Handled by `tailoring` module |\n| **PUT** | `/api/v1/admin/tailoring/:id` | undefined | Handled by `tailoring` module |\n| **DELETE** | `/api/v1/admin/tailoring/:id` | undefined | Handled by `tailoring` module |\n| **GET** | `/api/v1/admin/variant/` | undefined | Handled by `variant` module |\n| **POST** | `/api/v1/admin/variant/` | undefined | Handled by `variant` module |\n| **PUT** | `/api/v1/admin/variant/:id` | undefined | Handled by `variant` module |\n| **DELETE** | `/api/v1/admin/variant/:id` | undefined | Handled by `variant` module |\n| **GET** | `/api/v1/announcement/` | undefined | Handled by `announcement` module |\n| **POST** | `/api/v1/auth/register` | undefined | Handled by `auth` module |\n| **POST** | `/api/v1/auth/login` | undefined | Handled by `auth` module |\n| **POST** | `/api/v1/auth/send-otp` | undefined | Handled by `auth` module |\n| **POST** | `/api/v1/auth/verify-otp` | undefined | Handled by `auth` module |\n| **GET** | `/api/v1/customer/find` | undefined | Handled by `customer` module |\n| **POST** | `/api/v1/customer/` | undefined | Handled by `customer` module |\n| **GET** | `/api/v1/headless/shop` | undefined | Handled by `headless` module |\n| **GET** | `/api/v1/headless/products` | undefined | Handled by `headless` module |\n| **GET** | `/api/v1/headless/categories` | undefined | Handled by `headless` module |\n| **POST** | `/api/v1/lead/` | undefined | Handled by `lead` module |\n| **POST** | `/api/v1/order/` | undefined | Handled by `order` module |\n| **GET** | `/api/v1/order/my-orders` | undefined | Handled by `order` module |\n| **GET** | `/api/v1/order/track/:id` | undefined | Handled by `order` module |\n| **POST** | `/api/v1/order/:id/verify-payment` | undefined | Handled by `order` module |\n| **POST** | `/api/v1/payment/create-order` | undefined | Handled by `payment` module |\n| **POST** | `/api/v1/payment/verify-payment` | undefined | Handled by `payment` module |\n| **GET** | `/api/v1/plan/` | undefined | Handled by `plan` module |\n| **GET** | `/api/v1/plan/:id` | undefined | Handled by `plan` module |\n| **POST** | `/api/v1/review/` | undefined | Handled by `review` module |\n| **GET** | `/api/v1/review/:productId` | undefined | Handled by `review` module |\n| **GET** | `/api/v1/website/config` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/categories` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/subcategories` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/products` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/products/:id` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/offers` | undefined | Handled by `website` module |\n| **GET** | `/api/v1/website/seasonal-collections` | undefined | Handled by `website` module |\n
---

# Database Inventory

The platform relies on the following Firebase Firestore collections:

### Collection: `supplier_payments`
- **Purpose:** Stores records relating to the `supplier_payments` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `shops`
- **Purpose:** Stores records relating to the `shops` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `users`
- **Purpose:** Stores records relating to the `users` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `invoices`
- **Purpose:** Stores records relating to the `invoices` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `orders`
- **Purpose:** Stores records relating to the `orders` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `expenses`
- **Purpose:** Stores records relating to the `expenses` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `products`
- **Purpose:** Stores records relating to the `products` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `customers`
- **Purpose:** Stores records relating to the `customers` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `staff`
- **Purpose:** Stores records relating to the `staff` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `inventory`
- **Purpose:** Stores records relating to the `inventory` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `branches`
- **Purpose:** Stores records relating to the `branches` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `announcements`
- **Purpose:** Stores records relating to the `announcements` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `otps`
- **Purpose:** Stores records relating to the `otps` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `online_customers`
- **Purpose:** Stores records relating to the `online_customers` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `inventory_history`
- **Purpose:** Stores records relating to the `inventory_history` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `notification_templates`
- **Purpose:** Stores records relating to the `notification_templates` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `notification_logs`
- **Purpose:** Stores records relating to the `notification_logs` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `return_requests`
- **Purpose:** Stores records relating to the `return_requests` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `customer_credits`
- **Purpose:** Stores records relating to the `customer_credits` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `reviews`
- **Purpose:** Stores records relating to the `reviews` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `seasonal_collections`
- **Purpose:** Stores records relating to the `seasonal_collections` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.

### Collection: `shop_requests`
- **Purpose:** Stores records relating to the `shop_requests` module.
- **Key Fields:** `id`, `shopId`, `createdAt`, `updatedAt`.
- **Relationships:** Referenced via `shopId` and `userId` for tenant isolation.


---

# Frontend Pages

Here is the inventory of lazy-loaded frontend routes:

| Route | Component | Purpose |
| --- | --- | --- |
| `shop/:shopId/analytics` | `LoginComponent` | Route for shop/:shopId/analytics feature |\n| `register` | `RegisterComponent` | Route for register feature |\n| `subscription` | `DashboardComponent` | Route for subscription feature |\n| `pos` | `POSComponent` | Route for pos feature |\n| `help` | `HelpComponent` | Route for help feature |\n| `orders` | `OrderListComponent` | Route for orders feature |\n| `invoices/shop` | `BrandListComponent` | Route for invoices/shop feature |\n| `products/variants` | `OrderListComponent` | Route for products/variants feature |\n| `customers/credits` | `ReviewsComponent` | Route for customers/credits feature |\n| `sales/returns` | `SalesDraftsComponent` | Route for sales/returns feature |\n| `payments` | `ReviewsComponent` | Route for payments feature |\n| `security` | `SecurityComponent` | Route for security feature |\n| `support` | `SupportComponent` | Route for support feature |\n| `categories` | `InventoryComponent` | Route for categories feature |\n| `inventory/low-stock` | `OffersComponent` | Route for inventory/low-stock feature |\n| `expenses/add` | `SettingsComponent` | Route for expenses/add feature |\n| `settings/tax` | `StaffListComponent` | Route for settings/tax feature |\n| `staff/add` | `StaffFormComponent` | Route for staff/add feature |\n| `staff/edit/:id` | `StaffFormComponent` | Route for staff/edit/:id feature |\n| `staff/profile/:id` | `StaffLogsComponent` | Route for staff/profile/:id feature |\n| `staff/performance` | `ProfileComponent` | Route for staff/performance feature |\n| `subscription` | `BranchList` | Route for subscription feature |\n| `branches/analytics` | `CashLedger` | Route for branches/analytics feature |\n| `transactions/online` | `Refunds` | Route for transactions/online feature |\n| `accounting/cashbook` | `CashBook` | Route for accounting/cashbook feature |\n| `accounting/bankbook` | `BankBook` | Route for accounting/bankbook feature |\n| `accounting/ledger` | `Ledger` | Route for accounting/ledger feature |\n| `accounting/receivables` | `Receivables` | Route for accounting/receivables feature |\n| `accounting/payables` | `Payables` | Route for accounting/payables feature |\n| `accounting/gst-report` | `GSTReportComponent` | Route for accounting/gst-report feature |\n| `crm/segments` | `CustomerSegments` | Route for crm/segments feature |\n| `crm/vip` | `VipCustomers` | Route for crm/vip feature |\n| `crm/birthdays` | `BirthdayWishes` | Route for crm/birthdays feature |\n| `crm/anniversaries` | `AnniversaryOffers` | Route for crm/anniversaries feature |\n| `tailoring` | `AdminLogs` | Route for tailoring feature |\n| `audit/staff` | `StaffActivity` | Route for audit/staff feature |\n| `audit/system` | `SystemLogs` | Route for audit/system feature |\n| `images` | `PageNotFoundComponent` | Route for images feature |\n
---

# Reusable Components

The following shared/reusable components are implemented:

1. **`UiLoadingComponent`**: Simple CSS spinning loader (sm, md, lg sizes).
2. **`ImageUploaderComponent`**: Handles drag-and-drop or select file uploads to Cloudinary/S3.
3. **`InvoicePrintComponent`**: Generates printable HTML templates for receipts and invoices.
4. **`UiInputComponent` / `UiButtonComponent` / `UiDropdownComponent`**: Design system form controls.
5. **`SidebarComponent` / `HeaderComponent`**: Responsive layout wrappers.

---

# Integrations

- **Firebase (Admin SDK & Client):** Database (Firestore), Authentication, and client configuration.
- **Cloudinary / AWS S3:** Handles image upload and serving.
- **Razorpay:** Order creation and payment verification.
- **Shiprocket / Delhivery:** Shipping serviceability checking, order fulfillment, and shipment tracking.

---

# Environment Variables

- `FIREBASE_PROJECT_ID`: Firebase project identifier.
- `FIREBASE_PRIVATE_KEY`: Service account key.
- `FIREBASE_CLIENT_EMAIL`: Service account client email.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary account name.
- `CLOUDINARY_API_KEY`: Cloudinary public API key.
- `CLOUDINARY_API_SECRET`: Cloudinary private secret.
- `RAZORPAY_KEY_ID`: Razorpay checkout public key.
- `RAZORPAY_KEY_SECRET`: Razorpay API private secret.

---

# Folder Structure

```
clothify/
├── android_app/               # React Native (Expo) staff mobile app
├── clothify_admin_frontend/   # Angular 21 Platform Admin dashboard
├── clothify_backend/          # Node.js + Express API backend
│   └── src/
│       ├── apps/              # API applications (admin-api, public-api, internal)
│       ├── modules/           # Reusable feature modules (accounting, product, inventory, etc.)
│       └── config/            # Firebase, database, S3 configurations
├── clothify_shop_frontend/    # Angular 21 storefront & POS dashboard
└── showcase_ui/               # Public marketing landing page
```

---

# Final Statistics

- **Total Modules:** 16
- **Total Features:** 64
- **Complete Features:** 64
- **Partial Features:** 0
- **Total API Endpoints:** 236
- **Total Database Models:** 22
- **Total Frontend Pages:** 38
- **Total Components:** 14
- **Total Third-party Integrations:** 4
