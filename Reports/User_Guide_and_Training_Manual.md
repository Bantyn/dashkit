# CLOTHIFY ERP - USER GUIDE & TRAINING MANUAL
## Enterprise Edition (v2.0)

**Release Date:** July 3, 2026  
**Document Version:** 2.4.0  
**Prepared By:** Product Documentation Team  

---

## Table of Contents
1. About Clothify
2. Getting Started
3. Dashboard Overview
4. Products Module
5. Inventory Management
6. Sales & Billing (POS)
7. Customer Relationship Management (CRM)
8. Staff Management
9. Accounting & Ledgers
10. Reports & Analytics
11. Website Settings
12. Shipping Integrations
13. Payments Integration
14. Notifications Manager
15. Custom Tailoring Module
16. System Settings
17. Profile & Security Settings
18. Mobile App Guide
19. Frequently Asked Questions (FAQ)
20. Troubleshooting
21. Best Practices
22. Keyboard Shortcuts
23. Glossary & Appendix

<div style="page-break-after: always;"></div>

---

# 1. About Clothify
**Clothify** is a multi-tenant Software-as-a-Service (SaaS) ERP platform tailored for apparel retail shop owners. It integrates physical in-store Point of Sale (POS) operations with an automated, customized online storefront, inventory tracking, custom tailoring management, and detailed accounting.

### Who Should Use It:
- **Shop Owners:** For tracking top-level sales, managing subscription configurations, and reviewing store performance.
- **Store Managers & Cashiers:** For daily billing, managing walk-in sales, processing returns, and customer lookups.
- **Inventory Managers:** For stock updates, receiving purchase orders, and daily opening/closing checks.
- **Tailors:** For updating measurements and tracking tailor job cards.

---

# 2. Getting Started
### System Requirements & Browser Support
- **Device:** Windows 10/11, macOS, Linux, or Tablet with active internet connection.
- **Browsers:** Google Chrome (recommended), Mozilla Firefox, Apple Safari, Microsoft Edge.

---

📷 Screenshot
**File Name:** 01-login-page.png
**Caption:** Login Page Screen
**Description:** Login screen showing the email and password inputs with phone OTP sign-in options.

---

<div style="page-break-after: always;"></div>

---

# 3. Dashboard Overview
The main dashboard serves as the central control panel showing real-time statistics of store operations.

---

📷 Screenshot
**File Name:** 02-dashboard-overview.png
**Caption:** Admin Dashboard
**Description:** Main dashboard interface showing charts, sales summaries, and notification widgets.

---

# 4. Products Module
### Add Product

* **Purpose:** To register a new item in the inventory catalog.
* **When to Use:** When receiving new stock or adding new styles to the store.
* **Who Can Access:** Shop Owner, Store Manager, Inventory Manager
* **Prerequisites:** Product category and brand must already be created.

#### Step-by-Step Instructions:
1. Navigate to the **Products** section on the sidebar.
2. Click the **Add Product** button in the top right corner.
3. Enter product details including Title, SKU, Barcode, Description, and base Price.
4. Select the appropriate Category and Brand.
5. Upload product images.
6. Click **Save**.

#### Expected Result:
The product is registered in the database, a barcode is generated if not provided, and it shows in the product list.

#### Best Practices:
- Use high-quality images with clean white backgrounds for storefront listing.
- Set unique SKU formats (e.g., SSHIRT-BLU-L) for easier variation tracking.

#### Common Mistakes:
- Forgetting to enter the tax rate, leading to incorrect POS billing.
- Duplicate barcode entry causing scanner conflicts.

#### Tips:
- You can auto-generate barcodes if you leave the barcode input field blank.

#### Related Features:
- Bulk Import
- Variant Management

---

📷 Screenshot

**File Name:** 03-add-product.png
**Caption:** Add Product Interface Screen
**Description:** Visual interface of Add Product with highlights.

---

### Edit/Delete Product

* **Purpose:** To modify existing product metadata, prices, or remove discontinued items.
* **When to Use:** When update prices, updating pictures, or removing old stock.
* **Who Can Access:** Shop Owner, Store Manager
* **Prerequisites:** The target product must already exist in the catalog.

#### Step-by-Step Instructions:
1. Go to the **Products** list.
2. Search for the product by name or SKU.
3. Click the **Edit (pencil)** icon to modify information, or the **Delete (trash bin)** icon to remove it.
4. Confirm changes or deletion in the pop-up modal.

#### Expected Result:
Product updates are applied immediately, or the product is archived/removed from active sales lists.

#### Best Practices:
- Never delete products with historical sales; archive them instead to keep reporting accurate.

#### Common Mistakes:
- Accidentally deleting an active product with active online orders.

#### Tips:
- Use filters to show discontinued products for easy bulk archiving.

#### Related Features:
- Product Lifecycle Status

---

📷 Screenshot

**File Name:** 04-edit-product.png
**Caption:** Edit Product Screen
**Description:** Visual interface of Edit/Delete Product with highlights.

---

# 5. Inventory Management

### Daily Opening Stock Logs

* **Purpose:** To record physical stock status at the start of the day.
* **When to Use:** Every morning before opening the shop doors.
* **Who Can Access:** Store Manager, Inventory Manager
* **Prerequisites:** All products must be registered in the catalog.

#### Step-by-Step Instructions:
1. Go to **Inventory** -> **Opening Stock**.
2. Review the listed product quantities.
3. Scan or enter count adjustments manually.
4. Click **Submit Daily Opening Balance**.

#### Expected Result:
A new stock session log is created in the database and current stock quantities are locked in as initial balance.

#### Best Practices:
- Double-check physical shelves to ensure numbers match current display counts.

#### Common Mistakes:
- Submitting the opening log after POS billing has already started.

#### Tips:
- Staff logs track who registered opening and closing stocks to identify inventory leakage.

#### Related Features:
- Inventory History
- Low Stock Alerts

---

📷 Screenshot

**File Name:** 05-opening-stock.png
**Caption:** Opening Stock Registry Screen
**Description:** Visual interface of Daily Opening Stock Logs with highlights.

---

# 6. Sales & Billing (POS)

### Create POS Invoice

* **Purpose:** To record and checkout customer transactions instantly in-store.
* **When to Use:** When checking out a walk-in retail customer.
* **Who Can Access:** Cashier, Store Manager, Shop Owner
* **Prerequisites:** Products must have positive stock counts.

#### Step-by-Step Instructions:
1. Navigate to **POS** from the sidebar.
2. Use a barcode scanner to scan the product tag, or search by name in the search bar.
3. Adjust quantities in the cart.
4. Enter customer phone number to attach CRM profile or select 'Walk-in'.
5. Select the payment method (Cash, Card, UPI, or Split payment).
6. Click **Pay & Generate Invoice**.

#### Expected Result:
An invoice is recorded, payment ledger is updated, stock is decremented, and the print dialog opens automatically.

#### Best Practices:
- Attach customer details to leverage automatic loyalty point calculations.

#### Common Mistakes:
- Selecting Cash payment for a UPI transaction, disrupting cash book tallies.

#### Tips:
- You can place an invoice 'On Hold' if a customer wishes to grab another item while in queue.

#### Related Features:
- Hold Invoice
- Loyalty Programs
- Print Receipt

---

📷 Screenshot

**File Name:** 06-pos-billing.png
**Caption:** POS Cashier Interface Screen
**Description:** Visual interface of Create POS Invoice with highlights.

---

# 7. Customer Relationship Management (CRM)

### Customer Credits & VIP Management

* **Purpose:** To track store credit and manage VIP customer segments.
* **When to Use:** When issuing refunds as store credit or updating custom loyalty parameters.
* **Who Can Access:** Shop Owner, Store Manager
* **Prerequisites:** Customer profile must exist in the database.

#### Step-by-Step Instructions:
1. Navigate to **CRM** -> **Customer Credits**.
2. Select the customer profile.
3. Click **Adjust Balance** to add store credit or deduct for purchases.
4. Toggle the **VIP Badge** if the customer meets target parameters.

#### Expected Result:
The customer's credit balance is updated instantly and reflected in the POS checkout options.

#### Best Practices:
- Keep detailed notes on credit adjustments to resolve customer disputes easily.

#### Common Mistakes:
- Adjusting credit balances without authorization or logging reason.

#### Tips:
- VIP customers can receive automatic discounts during POS checkout if enabled in settings.

#### Related Features:
- POS Invoice
- Loyalty Programs

---

📷 Screenshot

**File Name:** 07-customer-crm.png
**Caption:** CRM Customer Details & Credits Screen
**Description:** Visual interface of Customer Credits & VIP Management with highlights.

---

# 8. Staff Management

### Staff Log & Performance Logs

* **Purpose:** To track logins, actions, and performance commission metrics.
* **When to Use:** When reviewing monthly staff performance, hours, and commission distribution.
* **Who Can Access:** Shop Owner
* **Prerequisites:** Staff profiles must be created and active.

#### Step-by-Step Instructions:
1. Navigate to **Staff** -> **Performance**.
2. Filter by dates or specific staff member.
3. Review Total Sales generated, commissions earned, and system activity logs.

#### Expected Result:
Detailed logs showing sales performance and exact API requests executed by the staff member are rendered.

#### Best Practices:
- Link commission rates to staff profiles beforehand for automatic reporting.

#### Common Mistakes:
- Deleting staff accounts, which destroys historical performance metrics. Deactivate instead.

#### Tips:
- Export the performance log to Excel for payroll integration.

#### Related Features:
- Accounting Ledger
- System Settings

---

📷 Screenshot

**File Name:** 08-staff-performance.png
**Caption:** Staff Logs & Performance Dashboard Screen
**Description:** Visual interface of Staff Log & Performance Logs with highlights.

---

# 9. Accounting & Ledgers

### GST & Tax Reporting

* **Purpose:** To extract GSTR-1, GSTR-2, and GSTR-3B ready summary reports for compliance.
* **When to Use:** Monthly or quarterly tax preparation.
* **Who Can Access:** Shop Owner, Store Accountant
* **Prerequisites:** All transactions must be recorded via POS or purchases.

#### Step-by-Step Instructions:
1. Navigate to **Accounting** -> **GST Report**.
2. Select the start and end dates.
3. Click **Generate GST Summary**.

#### Expected Result:
A detailed grid showing CGST, SGST, IGST totals and tax bracket splits is rendered.

#### Best Practices:
- Reconcile expenses with purchase bills weekly to ensure accurate GSTR-2 inputs.

#### Common Mistakes:
- Failing to specify IGST for inter-state customer transactions.

#### Tips:
- You can download the GSTR report as an Excel sheet to upload directly to the tax portal.

#### Related Features:
- Invoices List
- Purchase Orders

---

📷 Screenshot

**File Name:** 09-gst-report.png
**Caption:** GST Tax Reporting Panel Screen
**Description:** Visual interface of GST & Tax Reporting with highlights.

---

# 10. Reports & Analytics

### Revenue & Profit Loss Reports

* **Purpose:** To analyze profit margins after accounting for COGS (Cost of Goods Sold) and operational expenses.
* **When to Use:** At the end of every month or fiscal quarter.
* **Who Can Access:** Shop Owner
* **Prerequisites:** Expenses and Purchases must be regularly updated.

#### Step-by-Step Instructions:
1. Navigate to **Reports** -> **Profit & Loss**.
2. Set date filters.
3. Review revenue metrics, total expense blocks, and net profit margins.

#### Expected Result:
A detailed profit & loss summary card with line graphs is generated.

#### Best Practices:
- Include all staff payroll and rental costs in expenses for accurate net margin reporting.

#### Common Mistakes:
- Ignoring stock adjustments when calculating COGS.

#### Tips:
- Utilize the dashboard overview charts for quick day-to-day profit snapshots.

#### Related Features:
- Dashboard
- GST Reports

---

📷 Screenshot

**File Name:** 10-revenue-report.png
**Caption:** Revenue & Analytics Report Screen
**Description:** Visual interface of Revenue & Profit Loss Reports with highlights.

---

# 11. Website Settings

### Storefront Customization & Theme Editor

* **Purpose:** To configure color themes, banners, and page display configurations for the customer storefront.
* **When to Use:** When launching sales events, modifying shop logo, or updating colors.
* **Who Can Access:** Shop Owner
* **Prerequisites:** Active website subscription plan.

#### Step-by-Step Instructions:
1. Navigate to **Website** -> **Theme**.
2. Choose standard presets or insert custom hex codes.
3. Add carousel banner images and customize header text.
4. Click **Save Theme Settings**.

#### Expected Result:
Storefront web pages instantly reflect the new theme configuration and layout.

#### Best Practices:
- Choose high-contrast text colors for accessibility and readability.

#### Common Mistakes:
- Using excessively large banner images that slow down storefront load speeds.

#### Tips:
- Use custom domain settings to link your boutique domain name directly to the storefront.

#### Related Features:
- Website Pages
- Offers Management

---

📷 Screenshot

**File Name:** 11-website-theme.png
**Caption:** Website Storefront Customization Screen
**Description:** Visual interface of Storefront Customization & Theme Editor with highlights.

---

# 12. Shipping Integrations

### Delhivery Fulfillment Setup

* **Purpose:** To link Delhivery credentials and automatically dispatch online orders.
* **When to Use:** When starting online deliveries for customer storefront orders.
* **Who Can Access:** Shop Owner, Inventory Manager
* **Prerequisites:** Delhivery Merchant API Key is required.

#### Step-by-Step Instructions:
1. Navigate to **Shipping** -> **Setup**.
2. Input your Delhivery Client ID and Token.
3. Select default pickup warehouse address.
4. Click **Link Shipping Provider**.

#### Expected Result:
Delhivery is configured. Shipments can now be booked directly from the orders detail panel.

#### Best Practices:
- Ensure pickup address details match Delhivery records to prevent shipment cancellations.

#### Common Mistakes:
- Failing to configure weight units correctly, leading to incorrect delivery charges.

#### Tips:
- Use tracking dashboards to monitor dispatch details in real-time.

#### Related Features:
- Payments Integration
- Orders Module

---

📷 Screenshot

**File Name:** 12-shipping-setup.png
**Caption:** Shipping Integration Panel Screen
**Description:** Visual interface of Delhivery Fulfillment Setup with highlights.

---

# 13. Custom Tailoring Module

### Tailoring Measurement Ticket & Job Card

* **Purpose:** To log body measurements and assign custom tailoring orders to tailors.
* **When to Use:** When receiving a custom stitching order from a retail customer.
* **Who Can Access:** Store Manager, Cashier, Tailor
* **Prerequisites:** The customer profile must exist.

#### Step-by-Step Instructions:
1. Navigate to **Tailoring** -> **New Measurement**.
2. Select the customer and apparel type (e.g., Suit, Kurta).
3. Log specific dimensions (Chest, Waist, Shoulders, etc.).
4. Assign a deadline and select a tailor.
5. Click **Generate Job Card**.

#### Expected Result:
A PDF Job Card is generated with a barcode, and the tailor is notified on their work board.

#### Best Practices:
- Print the job card and attach it physically to the fabric bundle.

#### Common Mistakes:
- Modifying measurements in a job card without notifying the assigned tailor.

#### Tips:
- Customers can track the status of their tailoring order from the online storefront portal.

#### Related Features:
- Staff logs
- POS Invoice

---

📷 Screenshot

**File Name:** 13-tailoring-job-card.png
**Caption:** Tailoring Measurement Entry Screen
**Description:** Visual interface of Tailoring Measurement Ticket & Job Card with highlights.

---


---

# 19. Frequently Asked Questions (FAQ)

Here are answers to the most common queries regarding Clothify ERP operations:

#### Q1: How do I recover my password if I get locked out?
**A:** On the login page, click "Forgot Password". Enter your registered email, and a secure password reset link will be sent instantly.

#### Q2: Can I use the barcode scanner on a mobile phone?
**A:** Yes. The React Native Staff App has built-in camera integrations that turn any smartphone into a mobile barcode scanner.

#### Q3: How are returns handled in the accounting books?
**A:** When a return is processed in the POS, a Credit Note is generated. If cash is refunded, the Cash Book logs a debit entry. If credit is given, the customer CRM gets credited.

#### Q4: Can I run multiple branch offices on the same subscription?
**A:** Yes, the Pro plan supports multi-branch configurations where you can track branch logs and sales separately from a master admin account.

#### Q5: Is my customer database secure on Clothify?
**A:** Yes. Clothify uses multi-tenant data isolation and Firestore security rules. Your customer logs and transaction records cannot be accessed by any other shop on the platform.

#### Q6: How do I export my GST reports for my accountant?
**A:** Go to Accounting -> GST Report, select the date range, and click "Export to Excel". This sheet contains standard tax columns ready for direct import into tax software.

#### Q7: What payment methods does the customer storefront support?
**A:** Through Razorpay, it supports Credit/Debit cards, Net Banking, UPI (GPay, PhonePe, etc.), and digital wallets.

#### Q8: How can I change the branding of my storefront?
**A:** Go to Website -> Theme in the admin panel. Here you can upload your custom logo, select primary/secondary brand colors, and add hero carousel banners.

#### Q9: What happens when a product goes out of stock?
**A:** The storefront automatically flags the product as "Out of Stock" and prevents customers from purchasing it. The admin panel logs it in the "Low Stock" registry.

#### Q10: Can I import my existing product list from an Excel sheet?
**A:** Yes. Navigate to Products -> Import, download the template CSV file, fill in your product details, and upload it back.

---

# 20. Troubleshooting

| Problem | Possible Cause | Solution | Screenshot Placeholder |
| --- | --- | --- | --- |
| **Barcode scanner not entering items** | Scanner input focus lost or incorrect suffix config. | Click inside the POS search bar. Verify scanner is configured with a 'Carriage Return' (Enter key) suffix. | 📷 14-scanner-troubleshoot.png |
| **Storefront showing 404 domain error** | DNS records not fully propagated. | Go to Domain Settings, copy CNAME pointing to `shops.clothify.io`. Wait 24-48 hours for DNS. | 📷 15-domain-troubleshoot.png |
| **Razorpay Checkout failing** | Invalid API keys or test mode active. | Go to Settings -> Integrations, verify live API keys are inserted and webhook URL is correctly mapped. | 📷 16-payment-troubleshoot.png |

---

# 21. Best Practices

1. **Daily Opening & Closing Audits:** Ensure your cashier completes the opening stock checks every morning and runs the "Daily Closing" report before shutting the POS drawer to detect cash discrepancies.
2. **SKU Standardization:** Follow a strict structure when creating product codes (e.g. `[Category]-[Material]-[Color]-[Size]`) to simplify variant lookup and inventory reconciliation.
3. **Customer Segment Target:** Regularly update your customer tags (like VIP, Dormant, New) and use SMS/WhatsApp promotions targeting these specific tags to increase marketing conversion rates.

---

# 22. Keyboard Shortcuts

| Action | Shortcut Key |
| --- | --- |
| **Open POS Search** | `Ctrl + Space` |
| **Complete POS Checkout** | `Enter` (When payment input focused) |
| **Put Order on Hold** | `Ctrl + H` |
| **View Low Stock List** | `Ctrl + L` |
| **Open New Tailoring Ticket** | `Ctrl + T` |

---

# 23. Glossary & Appendix

- **SaaS (Software as a Service):** A software delivery model where applications are hosted by a vendor and licensed on a subscription basis.
- **Tenant:** A single store/shop instance on the multi-tenant Clothify platform.
- **COGS (Cost of Goods Sold):** The direct costs attributable to the production or purchase of the goods sold by a business.
- **GSTR-1:** Monthly/Quarterly return that summarizes outward supplies (sales) for GST.
- **Job Card:** An instruction ticket detailing measurements and instructions given to a tailor for apparel manufacturing.

**Support Contact:**  
For technical support or billing queries, please contact us at:  
- **Email:** patelbanty@gmail.com  
- **Phone:** +91 90165 76612  
- **Office:** 2/4863, Navsari Bazar, Surat, Gujarat, India, 395002  
