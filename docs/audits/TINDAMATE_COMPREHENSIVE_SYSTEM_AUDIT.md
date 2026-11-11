# TindaMate — Comprehensive System Audit (Read-Only)
## Project Health Assessment, Feature Verification & Production Readiness

- **Audit Date:** November 11, 2026
- **Project:** TindaMate — Your Digital Tindahan Assistant (`AICO24/TindaMate`)
- **Workspace Directory:** `C:\TindaMate`
- **Audited Git Branch & Commit:** `main` @ `9343bd5` (`refactor(dashboard): integrate refined hero canopy, safe area, and dashboard sections`)
- **Working Tree State Before Audit:** Clean (`git status` reported zero staged/unstaged modifications to tracked files)
- **Audit Mode:** Strictly Read-Only (Static Code Inspection, SQL Schema & RPC Audit, TypeScript Verification, Security & Financial Logic Review)

---

## Section 1 — Executive Summary

**TindaMate** is a mobile-first Point of Sale (POS) and Business Management application built with **Expo SDK 55**, **React Native 0.83.2**, **React 19.2.0**, **TypeScript 5.9.2**, **Expo Router**, and **Supabase** (PostgreSQL, Auth, Storage, RPCs).

Across **Batches 1 through 9D**, the engineering team has built a remarkably cohesive, high-craft core system covering store authentication, dashboard analytics, product & inventory management with image uploads, multi-item POS cart checkout (both Cash and Utang/credit), customer directory & credit ledger with atomic partial/full settlement, operating expense CRUD, and a Cost of Goods Sold (COGS) snapshot foundation.

### High-Level Verdict
- **Overall Architectural & Codebase Health:** **Strong (82/100)** — Zero TypeScript errors (`npx tsc --noEmit` exits `0`), well-structured domain separation (`src/app`, `src/components`, `src/lib`, `src/types`, `src/constants`), integer-centavo financial helpers in core POS/Utang flows, and transactional `SECURITY DEFINER` PostgreSQL RPCs with `FOR UPDATE` row locking and idempotency keys.
- **Core Operational Modules (Products, POS Checkout, Customers/Utang, Expenses):** **Production-Grade in Online Mode**, with strong database constraints and RLS table isolation (`auth.uid() = store_id`).
- **Critical & High-Severity Blockers Identified Before Public Release:**
  1. **Security (Critical/High):** Supabase Storage RLS policies on the `products` bucket (`20261021000001_product_images_storage.sql`) allow **any authenticated user** to overwrite or delete **any other store's** product photos because folder ownership (`(storage.foldername(name))[1] = auth.uid()::text`) is not enforced.
  2. **Financial Accuracy (Critical):** The **Reports Screen (`src/app/reports.tsx`)** subtracts **today's** expenses (`fetchDashboardExpenseSummary()`) from **all-time** gross profit (`fetchStoreCOGSSummary()` with no date filter) to calculate `netStoreProfit`, and mislabels today's expense total as `"Month Expenses"`.
  3. **Financial Accuracy (High):** The **Reports "Top Products" breakdown (`src/app/reports.tsx`)** aggregates header rows from `public.sales` instead of `public.sale_items`. For multi-item cart sales, 100% of the cart's grand total revenue is attributed to the first product in the cart (`"<First Product> + N more"`), and when a store has zero sales, the chart fabricates "Top Products" share using unsold inventory value (`selling_price * stock_quantity`).
  4. **Security (High):** Unsanitized string interpolation inside PostgREST `.or()` filters in `fetchStoreCustomers` (`src/lib/customers.ts:216`) and `fetchStoreExpenses` (`src/lib/expenses.ts:320`) allows PostgREST filter syntax injection when users type commas or operators in search bars.
  5. **Database State Bug (Medium):** When a settled customer (`credit_accounts.status = 'settled'`) makes a new Utang purchase via `record_cart_sale` (`20261026000002_batch8c_pos_record_utang.sql:189-201`), the RPC adds the charge and increases `current_balance`, but never resets `credit_accounts.status` back to `'open'`.
  6. **Offline-First Readiness:** **Not Implemented (`0%`)**. `expo-sqlite` is not installed; all business operations require active internet connectivity to Supabase.

---

## Section 2 — Verified Technology Stack

The baseline prompt reported "Expo SDK 58 / React Native 0.88". Static inspection of `package.json` and `node_modules` confirms the **actual** installed versions below:

| Category | Reported in Baseline | Actual Verified Version (`package.json`) | Status & Notes |
| :--- | :--- | :--- | :--- |
| **Expo SDK** | Expo SDK 58 | **`~55.0.6`** | Verified in `package.json:27` |
| **React Native** | 0.88 | **`0.83.2`** | Verified in `package.json:41` (`newArchEnabled: true` in `app.json`) |
| **React** | 19 | **`19.2.0`** | Verified in `package.json:39` |
| **TypeScript** | TypeScript | **`~5.9.2`** (`strict: true`) | `npx tsc --noEmit` passes with **0 errors** |
| **Routing** | Expo Router | **`~55.0.5`** (`expo-router`) | File-based routing in `src/app/` |
| **Backend / DB** | Supabase JS / PostgreSQL | **`@supabase/supabase-js` `^2.99.1`** | 9 SQL migrations in `supabase/migrations/` |
| **Animations** | Reanimated 4 | **`react-native-reanimated` `4.2.1`** | Paired with `react-native-worklets` `0.7.2` |
| **Local Storage** | AsyncStorage | **`@react-native-async-storage/async-storage` `2.2.0`** | Used **only** for Supabase Auth session token persistence |
| **Offline DB** | Expo SQLite | **NOT INSTALLED** | `expo-sqlite` is absent from `package.json` |
| **Media & Images** | Expo Image / Picker | **`expo-image` `~55.0.6`**, **`expo-image-picker` `~55.0.12`** | Used for product photos & Supabase Storage upload |
| **OAuth & Crypto** | Auth Session / WebBrowser | **`expo-auth-session` `~55.0.8`**, **`expo-web-browser` `~55.0.9`**, **`expo-crypto` `~55.0.9`** | PKCE / Implicit OAuth helpers implemented in `src/lib/oauth.ts` |

### Diagnostic Command Verification Results
1. **`git status` & `git log`:**
   - Branch: `main` (tracking `origin/main`, up to date).
   - Latest commit: `9343bd5` (`refactor(dashboard): integrate refined hero canopy, safe area, and dashboard sections`).
   - Working tree: Clean (2 untracked local items ignored or non-source: `Expo-Go-57.0.9.apk` and `scratch/`).
2. **`npx tsc --noEmit`:**
   - **PASS** (Exit Code `0`, zero compilation or type errors across the entire project).
3. **`npx expo lint` & `npx expo-doctor`:**
   - **NOT VERIFIED (Environment Sandbox Restriction):** Both commands invoke `@expo/cli`, which attempts to create `C:\Users\Emmgochaico\.expo` for CLI telemetry/state and fails with `EPERM: operation not permitted, mkdir 'C:\Users\Emmgochaico\.expo'` inside the read-only host sandbox. Additionally, no `.eslintrc*` or `eslint.config.*` file exists in the repository root yet.

### Architecture, Dead Code & Dependency Hygiene Findings
- **Clean 4-Layer Architecture:**
  - `src/app/` — 19 Expo Router screens and layout navigators.
  - `src/components/` — 43 modular UI and domain components (`dashboard`, `products`, `sales`, `customers`, `expenses`, `ui`).
  - `src/lib/` — 7 service modules (`supabase.ts`, `oauth.ts`, `products.ts`, `sales.ts`, `customers.ts`, `expenses.ts`, `profit.ts`).
  - `src/types/` — 5 strict TypeScript contract files (`product.ts`, `sale.ts`, `customer.ts`, `expense.ts`, `profit.ts`).
- **Dead Starter Template Files (10 files):**
  - `src/app/explore.tsx`, `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`, `src/components/external-link.tsx`, `src/components/hint-row.tsx`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx`, `src/components/web-badge.tsx`, `src/components/ui/collapsible.tsx`, `scripts/reset-project.js`.
- **Unused / Disconnected Custom Components (8 files):**
  - `src/components/ui/GoogleSignInButton.tsx`, `src/components/ui/FacebookSignInButton.tsx`, `src/components/ui/AuthDivider.tsx`, `src/components/ui/PasswordStrengthMeter.tsx`, `src/components/ui/WelcomeHeroIllustration.tsx`, `src/components/dashboard/StoreOverviewCard.tsx`, `src/components/dashboard/ProductScreenHeader.tsx` (duplicate of `src/components/products/ProductScreenHeader.tsx`), `src/components/sales/TodaySalesSummaryCard.tsx`.
- **Unused Dependencies in `package.json`:**
  - `@expo/ui` (`~55.0.4`), `expo-glass-effect` (`~55.0.8`), and `expo-symbols` (`~55.0.5` — referenced only in dead starter files).
- **Missing Native Identifiers in `app.json`:**
  - `app.json` defines `"scheme": "tindamate"`, `"name": "TindaMate"`, and `"slug": "tindamate"`, but **omits `android.package` and `ios.bundleIdentifier`**, which are required before running `eas build` or `npx expo run:android`.

---

## Section 3 — Feature Verification Matrix

| Module | Feature | Implementation Status | Verification Status | Evidence | Findings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Authentication** | Registration | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/register.tsx:100-191` | Calls `supabase.auth.signUp()` with `store_name` metadata (`data: { store_name }`). Handles both immediate session and email confirmation flows. |
| **A. Authentication** | Login | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/login.tsx:96-173` | Calls `supabase.auth.signInWithPassword()`. Maps Supabase errors to user-friendly messages. |
| **A. Authentication** | Logout | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:450-467`, `src/app/more.tsx:125-146` | Calls `supabase.auth.signOut({ scope: 'local' })` with confirmation dialog on `/more` and direct sign-out on `/home`. |
| **A. Authentication** | Session Persistence | `IMPLEMENTED` | `VERIFIED (Static)` | `src/lib/supabase.ts:44-67`, `src/app/index.tsx:31-49` | Persists JWT session in `AsyncStorage` on iOS/Android (`autoRefreshToken: true`, `persistSession: true`). Auto-redirects authenticated users from `/` to `/home`. |
| **A. Authentication** | Password Validation | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/register.tsx:83-85`, `src/components/ui/PasswordStrengthMeter.tsx` | `register.tsx` enforces `password.length >= 6` and confirm match. `PasswordStrengthMeter.tsx` is fully built in `src/components/ui/` but **never imported or rendered** in `register.tsx`. |
| **A. Authentication** | Password Recovery | `NOT IMPLEMENTED` | `VERIFIED (Static)` | `src/app/login.tsx:175-184` | Tapping `"Forgot Password?"` displays a placeholder `Alert.alert`: *"Password recovery will be implemented with Supabase Auth in an upcoming batch."* |
| **A. Authentication** | Google OAuth | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/lib/oauth.ts:103-199`, `src/components/ui/GoogleSignInButton.tsx` | Full OAuth helper (`performOAuthSignIn('google')`) and `GoogleSignInButton` component exist, and `login.tsx`/`register.tsx` handle deep-link callback tokens, **but no Google button is rendered on `login.tsx` or `register.tsx`**. |
| **A. Authentication** | Facebook OAuth | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/lib/oauth.ts:103-199`, `src/components/ui/FacebookSignInButton.tsx` | Full OAuth helper (`performOAuthSignIn('facebook')`) and `FacebookSignInButton` component exist, **but no Facebook button is rendered on `login.tsx` or `register.tsx`**. |
| **A. Authentication** | Guest Preview | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:108, 129-135`, `src/app/index.tsx` | `home.tsx` supports `?guest=1` (`isGuestMode`) with zeroed preview states and a Sign-Up prompt banner, **but the Welcome (`index.tsx`), Login, and Register screens have no button to enter Guest Preview**. |
| **A. Authentication** | Authenticated Route Protection | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/_layout.tsx:66-92`, `src/app/more.tsx:76-90` | Individual screens check `supabase.auth.getSession()`, **except `/more` (`src/app/more.tsx`)**, which renders store settings to unauthenticated users instead of redirecting to `'/'`. `_layout.tsx` does not globally guard routes on `SIGNED_OUT`. |
| **A. Authentication** | Error & Loading States | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/login.tsx:221-225`, `src/app/register.tsx:229-233` | Inline error banners, field-level validation errors, and button loading spinners work properly. (`showSuccessModal` state in both files is dead code—never set to `true`). |
| **B. Dashboard** | Today's Sales Summary & Count | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:266`, `src/lib/sales.ts:624-662` | Queries `public.sales` for local day `[00:00:00, 23:59:59.999]`; aggregates centavos accurately. |
| **B. Dashboard** | Sales Trend Comparison | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:491-529` | Compares Today's sales vs. Yesterday's sales (`[yesterday 00:00, today 00:00)`) and displays percentage badge (`+X%`, `-X%`, or `New today`). |
| **B. Dashboard** | Inventory Valuation & Low-Stock Count | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:534-547`, `src/components/dashboard/DashboardInventoryCard.tsx` | Computes `stock_quantity <= low_stock_threshold` and retail stock value (`SUM(selling_price * stock_quantity)`). |
| **B. Dashboard** | Outstanding Customer Debt | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:269, 369-388`, `src/lib/customers.ts:447-513` | Fetches `customer_credit_summaries` and displays `totalOutstandingBalance` and `customersWithBalanceCount`. |
| **B. Dashboard** | Weekly Sales Chart | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:549-599` | Plots Mon–Sun bars for current week. **Flaw:** If current week has `0` sales, `hasCurrentWeekSales` is `false` and the chart silently falls back to `historicalWeekdayCentavos` (all-time sales by weekday) while still labeled `"This Week"`. |
| **B. Dashboard** | Recent Activity | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:660-721`, `src/components/dashboard/DashboardRecentTransactionsSection.tsx` | Merges and chronologically sorts recent POS sales and Utang payments; links directly to `/sales/[id]` or `/customers/[id]`. |
| **B. Dashboard** | Expense Overview & Profit KPI | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:207-211, 390-416, 646-658` | Expense card shows today's expense total & count. **Flaw in Profit KPI:** Line 648 uses `todayGrossProfit ?? todaySalesSummary.totalAmount`—if `fetchStoreCOGSSummary` fails, **100% of Gross Sales is displayed as "Profit"**. Also ignores expenses and hides `hasIncompleteCosts` warnings. |
| **B. Dashboard** | Quick Action Navigation | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/home.tsx:621-644` | 4 quick action tiles (`New Sale`, `Add Product`, `Utang`, `Reports`) + persistent 5-tab `DashboardBottomNav`. |
| **C. Products & Inventory** | Product Listing, Search & Category Filtering | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/products/index.tsx:180-226`, `src/lib/products.ts:276-300` | Fetches store products ordered by `created_at DESC`; supports client-side search, stock status tabs (`All`, `In Stock`, `Low Stock`, `Out of Stock`), and dynamic category chips. |
| **C. Products & Inventory** | Add & Edit Product | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/products/add.tsx`, `src/app/products/[id]/edit.tsx`, `src/components/products/ProductForm.tsx` | Full validation (`validateProductForm`), quick category/unit chips, live stock badge preview, and duplicate-submit protection. |
| **C. Products & Inventory** | Product Deletion / Archiving | `NOT IMPLEMENTED` | `VERIFIED (Static)` | `supabase/migrations/20261022000000_batch4_sales_foundation.sql:25` | `sales` and `sale_items` enforce `ON DELETE RESTRICT` to protect historical sales, and a `DELETE` RLS policy exists on `products`, **but no delete or archive (`is_active`) UI/function exists**. |
| **C. Products & Inventory** | Product Image Picker & Supabase Storage | `IMPLEMENTED` | `VERIFIED (Static)` | `src/components/products/ProductImagePicker.tsx`, `src/lib/products.ts:212-270` | Camera & gallery picker with permission checks; uploads to `products` bucket under `<store_id>/<timestamp>-<rand>.<ext>`. |
| **C. Products & Inventory** | Selling Price, Cost Price & Stock Status | `IMPLEMENTED` | `VERIFIED (Static)` | `src/lib/products.ts:36-46, 85-204` | Validates `selling_price >= 0`, optional `cost_price >= 0`, integer `stock_quantity >= 0`, and `low_stock_threshold >= 0`. |
| **C. Products & Inventory** | Product Details (`products/[id]`) | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/products/[id]/index.tsx:74, 136-144, 324-359` | **3 UI/Functional gaps:** (1) Quantity stepper (`selectedQty`) is ignored by `handleAddToPosCart`, which only passes `{ productId }` (always adds qty `1`); (2) Heart favorite button (`isFavorite`) is local React state only; (3) `cost_price` and profit margin are never displayed on the detail screen. |
| **D. POS & Sales** | Product Selection, Search & Multi-Item Cart | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/sales/index.tsx:194-356`, `src/lib/sales.ts:144-319` | Supports search, category chips, adding/incrementing/decrementing/removing items, and strict stock cap enforcement (`quantity <= stock_quantity`). |
| **D. POS & Sales** | Subtotal, Total, Tendered & Change Math | `IMPLEMENTED` | `VERIFIED (Static)` | `src/lib/sales.ts:48-139, 324-447`, `src/components/sales/CheckoutModal.tsx` | Uses integer centavo arithmetic (`toCentavos` / `fromCentavos`) to eliminate IEEE-754 floating-point drift. |
| **D. POS & Sales** | Cash & Utang Checkout (`record_cart_sale`) | `IMPLEMENTED` | `VERIFIED (Static)` | `supabase/migrations/20261026000002_batch8c_pos_record_utang.sql:23-325` | Atomic PostgreSQL RPC: locks products in sorted UUID order (`ORDER BY item.product_id FOR UPDATE`), verifies stock, snapshots `cost_price` into `sale_items`, deducts stock, and creates Utang charge atomically. |
| **D. POS & Sales** | Idempotency & Duplicate Prevention | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/sales/index.tsx:78, 369-374`, `20261026000002_batch8c_pos_record_utang.sql:102-135` | Generates deterministic `idempotency_key` (`pos-cart-...`) per checkout session, locks on `(store_id, idempotency_key)`, and returns `already_recorded: true` on network retry. |
| **D. POS & Sales** | Receipt Modal, Sales History & Sale Details | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/components/sales/SaleSuccessModal.tsx`, `src/app/sales/history.tsx`, `src/app/sales/[id].tsx` | `SaleSuccessModal` and `/sales/[id]` work well (with legacy fallback for pre-Batch-7 single-item sales). **Flaw in `sales/history.tsx`:** Filter chips are `['This Week', 'This Month', 'Custom']` where `'Custom'` has no date picker (shows all-time), `'Today'` is missing, and the sparkline uses `idx % 6` modulo bucketing. |
| **E. Customers & Utang** | Customer Directory, Search & Status Filters | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/customers/index.tsx`, `src/lib/customers.ts:189-243` | Supports `All`, `With Balance`, `Active`, and `Archived` filters, summary banner, and search (note PostgREST `.or()` sanitization issue in Section 5). |
| **E. Customers & Utang** | Add & Edit Customer | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/customers/add.tsx`, `src/app/customers/[id]/edit.tsx`, `src/components/customers/CustomerForm.tsx` | Validates name, Philippine mobile format (`09XXXXXXXXX` or `+639XXXXXXXXX`), notes, and `is_active` toggle. |
| **E. Customers & Utang** | Customer Profile & Credit Ledger | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/customers/[id]/index.tsx`, `src/lib/customers.ts:365-439` | Displays authoritative balance, total utang, total paid, and chronological ledger of `charge` and `payment` entries; tapping a POS charge opens `/sales/[id]`. |
| **E. Customers & Utang** | Partial & Full Payment Settlement | `IMPLEMENTED` | `VERIFIED (Static)` | `src/components/customers/RecordPaymentModal.tsx`, `supabase/migrations/20261027000000_batch8e_customer_payment_settlement.sql` | `record_customer_payment` locks `credit_accounts FOR UPDATE`, prevents overpayment (`v_clean_amount > v_previous_balance`), inserts `'payment'` ledger entry, and updates `current_balance`. |
| **E. Customers & Utang** | Account Status Sync on Re-Borrowing | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `supabase/migrations/20261026000002_batch8c_pos_record_utang.sql:189-201` | **Bug:** When a `'settled'` customer takes a new Utang sale in POS, `record_cart_sale` adds the charge and increases `current_balance`, but leaves `credit_accounts.status = 'settled'` instead of resetting it to `'open'`. |
| **F. Expenses** | Expense Listing, Search & Category Filtering | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/expenses/index.tsx`, `src/lib/expenses.ts:288-334` | Lists expenses ordered by `expense_date DESC, created_at DESC`; filters across 8 predefined categories (`Restock / Inventory`, `Utilities`, `Rent`, `Transportation`, `Packaging / Supplies`, `Staff / Labor`, `Maintenance`, `Miscellaneous`). |
| **F. Expenses** | Create, Edit & Delete Expense | `IMPLEMENTED` | `VERIFIED (Static)` | `src/app/expenses/add.tsx`, `src/app/expenses/[id]/edit.tsx`, `src/components/expenses/DeleteExpenseConfirmModal.tsx` | Full CRUD with strict validation (`validateExpenseForm`), date validation (`YYYY-MM-DD`, no future dates), and explicit confirmation modal before deletion. |
| **G. COGS & Profit** | Historical Cost Snapshot on Sale | `IMPLEMENTED` | `VERIFIED (Static)` | `supabase/migrations/20261031000001_batch9d_cogs_aggregation_foundation.sql` | `record_cart_sale` snapshots `products.cost_price` into `sale_items.cost_price` at checkout time so subsequent product cost edits do not rewrite historical COGS. |
| **G. COGS & Profit** | Tracked vs. Untracked Cost Detection | `IMPLEMENTED` | `VERIFIED (Static)` | `supabase/migrations/20261031000001_batch9d_cogs_aggregation_foundation.sql:252-336`, `src/lib/profit.ts` | `get_store_cogs_summary` separates `tracked_items_count` (`cost_price IS NOT NULL`) and `untracked_items_count` (`cost_price IS NULL`), returning `hasIncompleteCosts`. |
| **G. COGS & Profit** | Realized vs. Uncollected Profit & Net Profit | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/reports.tsx:105-112, 174-177`, `src/app/home.tsx:648` | **Critical Flaws:** (1) `reports.tsx` subtracts **today's** expenses from **all-time** gross profit; (2) Unpaid `credit` (Utang) sales are counted immediately in Gross Sales and Gross Profit without separating uncollected receivables; (3) No refund/void/discount support exists. |
| **H. Reports** | Daily / Weekly / Monthly / All-Time Reports | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/reports.tsx:53-55, 100-130, 326-333` | **Missing Date Period Filters:** `/reports` has 4 domain tabs (`Sales`, `Profit`, `Inventory`, `Utang`), **not** Daily/Weekly/Monthly/All-Time period selectors. Tapping the header calendar icon simply navigates to `/sales/history`. |
| **H. Reports** | Top Products & Revenue Attribution | `PARTIALLY IMPLEMENTED` | `VERIFIED (Static)` | `src/app/reports.tsx:194-260` | **Broken for Multi-Item Carts:** Aggregates `public.sales` instead of `public.sale_items`, attributing 100% of multi-item cart totals to the first item only; fabricates revenue from unsold inventory when `sales.length === 0`. |

---

## Section 4 — Database & Backend Findings

All 9 SQL migrations in `supabase/migrations/` were inspected line-by-line:
1. `20261021000000_batch3_products_foundation.sql` (`public.products`)
2. `20261021000001_product_images_storage.sql` (`storage.buckets` / `storage.objects` for `products`)
3. `20261022000000_batch4_sales_foundation.sql` (`public.sales` + legacy `record_product_sale`)
4. `20261026000000_batch7_multi_item_pos_cart.sql` (`public.sale_items` + `record_cart_sale`)
5. `20261026000001_batch8a_customer_credit_foundation.sql` (`public.customers`, `public.credit_accounts`, `public.credit_transactions`, `public.customer_credit_summaries`)
6. `20261026000002_batch8c_pos_record_utang.sql` (Utang columns on `sales`, updated `record_cart_sale`, updated `customer_credit_summaries` view)
7. `20261027000000_batch8e_customer_payment_settlement.sql` (`record_customer_payment` RPC)
8. `20261031000000_batch9a_expenses_foundation.sql` (`public.expenses`)
9. `20261031000001_batch9d_cogs_aggregation_foundation.sql` (`sale_items.cost_price`, updated `record_cart_sale`, `get_store_cogs_summary` RPC)

### 1. Schema, Constraints & Relationships
- **Tables (6) & View (1):**
  - `public.products` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`)
  - `public.sales` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`, FK `product_id -> public.products(id) ON DELETE RESTRICT`, FK `customer_id -> public.customers(id) ON DELETE RESTRICT`)
  - `public.sale_items` (PK `id`, FK `sale_id -> public.sales(id) ON DELETE CASCADE`, FK `store_id -> auth.users(id) ON DELETE CASCADE`, FK `product_id -> public.products(id) ON DELETE RESTRICT`)
  - `public.customers` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`)
  - `public.credit_accounts` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`, FK `customer_id -> public.customers(id) ON DELETE CASCADE`, `UNIQUE (store_id, customer_id)`)
  - `public.credit_transactions` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`, FK `customer_id -> public.customers(id) ON DELETE CASCADE`, FK `credit_account_id -> public.credit_accounts(id) ON DELETE CASCADE`, FK `sale_id -> public.sales(id) ON DELETE SET NULL`)
  - `public.expenses` (PK `id`, FK `store_id -> auth.users(id) ON DELETE CASCADE`)
  - `public.customer_credit_summaries` (`VIEW` with `security_invoker = true`)
- **Data Integrity Constraints:**
  - `products`: `selling_price >= 0`, `cost_price IS NULL OR cost_price >= 0`, `stock_quantity >= 0`, `low_stock_threshold >= 0`, non-empty `name` and `unit`.
  - `sales`: `quantity > 0`, `selling_price >= 0`, `total_amount >= 0`, `item_count > 0`, `payment_method IN ('cash', 'credit')`, `sales_payment_customer_consistency_check` (enforces `customer_id IS NULL` for `'cash'` and `customer_id IS NOT NULL` for `'credit'`), and unique partial index `idx_sales_store_idempotency_key` on `(store_id, idempotency_key) WHERE idempotency_key IS NOT NULL`.
  - `sale_items`: `quantity > 0`, `selling_price >= 0`, `cost_price IS NULL OR cost_price >= 0`, `subtotal >= 0`.
  - `credit_accounts` & `credit_transactions`: `current_balance >= 0`, `total_credit >= 0`, `total_paid >= 0`, `amount > 0`, `transaction_type IN ('charge', 'payment', 'adjustment')`.
  - `expenses`: `amount > 0`, `category IN (...)` (8 valid categories), non-empty `title`.

### 2. Row-Level Security (RLS) on Public Tables
- Every table in `public` (`products`, `sales`, `sale_items`, `customers`, `credit_accounts`, `credit_transactions`, `expenses`) has `ENABLE ROW LEVEL SECURITY` and policies strictly enforcing `auth.uid() = store_id` on both `USING` and `WITH CHECK`.
- Even if a malicious client passes a forged `store_id` in an `INSERT` or `UPDATE` payload, PostgreSQL RLS rejects the operation because `WITH CHECK (auth.uid() = store_id)` evaluates against the server-verified JWT `auth.uid()`.
- `public.customer_credit_summaries` explicitly sets `WITH (security_invoker = true)` (`20261026000002_batch8c_pos_record_utang.sql:417`), ensuring the view executes with the caller's permissions and respects base-table RLS.

### 3. Database & Backend Issues Found
1. **Cross-Store Storage Policy Vulnerability (`20261021000001_product_images_storage.sql:25-43`):**
   - See **SEC-01** in Section 5. Storage `INSERT`, `UPDATE`, and `DELETE` policies on `storage.objects` only check `bucket_id = 'products'` without checking `(storage.foldername(name))[1] = auth.uid()::text`.
2. **`credit_accounts.status` Not Reset to `'open'` on Subsequent Utang Sale (`20261026000002_batch8c_pos_record_utang.sql:189-201`):**
   - When `record_customer_payment` settles a customer's balance to `0`, it sets `credit_accounts.status = 'settled'` (`20261027000000_batch8e_customer_payment_settlement.sql:198`).
   - When that customer later buys on Utang again via `record_cart_sale`, the RPC locates the existing `credit_accounts` row (`SELECT id INTO v_credit_account_id FROM public.credit_accounts WHERE store_id = v_store_id AND customer_id = p_customer_id`) and inserts a `'charge'` into `credit_transactions` (triggering `sync_credit_account_totals` to increase `current_balance`), **but neither `record_cart_sale` nor `sync_credit_account_totals` updates `credit_accounts.status` back to `'open'`**.
3. **Legacy `record_product_sale(uuid, integer)` RPC Remains Executable (`20261022000000_batch4_sales_foundation.sql:70-156`):**
   - The Batch 4 single-item RPC is still granted to `authenticated` (`GRANT EXECUTE ON FUNCTION public.record_product_sale(uuid, integer) TO authenticated`) and exported in `src/lib/sales.ts:836`. Calling it creates a row in `public.sales` **without** creating a `public.sale_items` row or snapshotting `cost_price`, which skews `get_store_cogs_summary` (since COGS aggregates `public.sale_items`).
4. **`sales` Table Denormalized Header Columns for Multi-Item Carts (`20261026000000_batch7_multi_item_pos_cart.sql:232-243`):**
   - Because `public.sales.product_id` is `NOT NULL` from Batch 4, `record_cart_sale` stores `v_first_product_id` in `sales.product_id` and `"<First Product> + N more"` in `sales.product_name`. Any query that groups `public.sales` by `product_id` (such as `src/app/reports.tsx:212`) misattributes the entire cart's revenue to the first product.
5. **`get_store_cogs_summary` Uses `NUMERIC` Instead of Integer Centavos (`20261031000001_batch9d_cogs_aggregation_foundation.sql:282-298`):**
   - PostgreSQL `NUMERIC` is exact base-10 arithmetic (so it does not suffer from binary floating-point drift), and `ROUND(..., 2)` is applied. However, note that `get_store_cogs_summary` includes **all** sales (`cash` and unpaid `credit`) in `gross_sales` and `gross_profit`.

---

## Section 5 — Security Findings

No actual secret values are printed in this report.

### Critical / High Severity

#### [SEC-01] CRITICAL / HIGH — Cross-Store File Overwrite & Deletion in `products` Storage Bucket
- **Location:** `supabase/migrations/20261021000001_product_images_storage.sql` (Lines 25–43)
- **Technical Evidence:**
  ```sql
  CREATE POLICY "Authenticated users can upload product images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'products');

  CREATE POLICY "Authenticated users can update own product images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'products')
    WITH CHECK (bucket_id = 'products');

  CREATE POLICY "Authenticated users can delete own product images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'products');
  ```
- **Risk & Impact:** Despite the policy names saying `"own product images"`, the SQL predicates only check `bucket_id = 'products'`. Any authenticated user can use the public Supabase client to delete, overwrite, or upload files into **any other store's folder** (`<other_store_id>/...`) in the `products` bucket.
- **Recommended Resolution:** Add a migration replacing those three policies with predicates enforcing `(storage.foldername(name))[1] = auth.uid()::text` (and `owner = auth.uid()`).

#### [SEC-02] HIGH — PostgREST Filter Syntax Injection in Customer & Expense Search Queries
- **Location:** `src/lib/customers.ts` (Line 216) and `src/lib/expenses.ts` (Line 320)
- **Technical Evidence:**
  - `src/lib/customers.ts:216`:
    ```ts
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`);
    ```
  - `src/lib/expenses.ts:320`:
    ```ts
    query = query.or(`title.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%,notes.ilike.%${cleanSearch}%`);
    ```
- **Risk & Impact:** `cleanSearch` is only `.trim()`med. In PostgREST, `.or()` parses commas (`,`), periods (`.`), and parentheses (`()`) as logical operators and column filters. If a store owner searches for `"Rice, Sugar"` or `"100.00"`, PostgREST fails with a syntax error (`PGRST100`) or evaluates injected filter clauses (bounded to the user's own store by RLS).
- **Recommended Resolution:** Strip or escape PostgREST reserved characters (`[,().%\\]`) before interpolating into `.or()`, or perform client-side search filtering on the already-fetched store dataset (as `src/app/products/index.tsx` does).

---

### Medium Severity

#### [SEC-03] MEDIUM — Hardcoded Fallback Supabase Project URL and Anon JWT Key in Source Code
- **Location:** `src/lib/supabase.ts` (Lines 11–39) & `scripts/verify-supabase.mjs` (Lines 11–14)
- **Technical Evidence:**
  - `src/lib/supabase.ts:11-25` embeds a literal fallback Supabase URL (`https://dkzkajepfptysowwohrd.supabase.co`) and a literal fallback `anon` JWT token when `process.env.EXPO_PUBLIC_SUPABASE_URL` or `process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are undefined.
  - Because those fallback strings are non-empty constants, lines 27–39 (`if (!supabaseUrl) throw new Error(...)`) are **dead, unreachable code**.
- **Risk & Impact:** While Supabase `anon` keys are public client identifiers designed to work alongside RLS, hardcoding them directly in committed TypeScript source files prevents environment separation (staging vs. production), bypasses missing-env fail-safes, and exposes the live project endpoint in public Git history.
- **Recommended Resolution:** Remove the hardcoded fallback URL and key from `src/lib/supabase.ts` and `scripts/verify-supabase.mjs` so the existing fail-fast guard at lines 27–39 functions as intended.

#### [SEC-04] MEDIUM — Production Console Logging of Sensitive OAuth Callback URLs, Tokens & User Emails
- **Location:** `src/lib/oauth.ts` (Lines 28, 50, 71, 82, 92, 167), `src/app/_layout.tsx` (Line 74), `src/app/login.tsx` (Line 134)
- **Technical Evidence:**
  - `src/lib/oauth.ts:28`: `console.log('[OAuth Tokens] Parsing URL:', url);` — logs the full OAuth redirect URL (which contains `code=...` or `#access_token=...&refresh_token=...`) without an `if (__DEV__)` guard.
  - `src/app/_layout.tsx:74` & `src/app/login.tsx:134`: logs `session?.user?.email` unconditionally on auth state changes.
- **Risk & Impact:** On Android devices, unconstrained `console.log` statements write to the system `logcat` buffer, exposing OAuth authorization codes, tokens, and user PII to local device log readers in production builds.
- **Recommended Resolution:** Wrap all diagnostic auth logs in `if (__DEV__)` and redact query/hash parameters before logging URLs.

#### [SEC-05] MEDIUM — Missing Client-Side Authentication Guard on `/more` Route & Global Sign-Out Listener
- **Location:** `src/app/more.tsx` (Lines 76–90) & `src/app/_layout.tsx` (Lines 73–78)
- **Technical Evidence:**
  - `src/app/more.tsx:76-90` fetches `supabase.auth.getSession()`, but if `sessionData?.session` is `null`, it simply leaves `user` as `null` and renders the screen with fallback text `"TindaMate Store"` instead of calling `router.replace('/')`.
  - `src/app/_layout.tsx:73-78` redirects to `/home` when `session && event !== 'SIGNED_OUT'`, but does not redirect to `/` when `event === 'SIGNED_OUT'` or when an unauthenticated user navigates directly to a deep route.
- **Recommended Resolution:** Add `if (!data?.session) { router.replace('/'); return; }` in `src/app/more.tsx` and enforce centralized protected-route redirection in `src/app/_layout.tsx`.

---

### Low / Informational Severity

#### [SEC-06] LOW — Non-Atomic Client-Side Fallback Mutations (`recordProductSaleWithGuardedFallback` & `recordCustomerPaymentFallback`)
- **Location:** `src/lib/sales.ts` (Lines 701–825) and `src/lib/customers.ts` (Lines 752–916)
- **Description:** If the Supabase RPCs return `PGRST202` (function not found), the client service layer falls back to multi-step client-side `SELECT` -> `UPDATE` -> `INSERT` calls. While guarded by optimistic `.eq('stock_quantity', currentStock)` checks, these client fallbacks are not wrapped in a single database transaction and could leave partial state if connectivity drops mid-flight.
- **Recommended Resolution:** Once all migrations (`Batch 3` through `Batch 9D`) are verified on the target Supabase instance, disable or remove the multi-step client-side mutation fallbacks so all financial writes go exclusively through atomic `SECURITY DEFINER` RPCs.

---

## Section 6 — UI/UX Findings

### 1. Design System & Visual Consistency
- **Centralized Theme (`src/constants/theme.ts`):** The Mint-Sage / Emerald Green visual identity (`Colors.primary: '#0D7A4D'`, `Colors.primaryDark: '#064E3B'`, `Colors.backgroundWarm: '#E4F2EA'`, `Colors.background: '#F4F6F8'`, `Colors.accent: '#F97316'`) is thoughtfully tokenized and consistently applied across all 19 screens.
- **Typography & Tabular Numerals:** Financial figures (`heroValue`, `kpiValue`) use `fontVariant: ['tabular-nums']` and high-contrast weights (`700`–`800`), preventing layout jitter when amounts update.
- **Accessibility & Touch Targets:** Interactive components (`TindaMateButton`, `TindaMateInput`, `DashboardBottomNav`, `ProductImagePicker`) consistently enforce `minHeight: 48`–`56`, include `accessibilityRole`, `accessibilityLabel`, and `hitSlop`, and cap `maxFontSizeMultiplier` (`1.15`–`1.3`) to prevent text clipping on small Android phones (`width < 360`).
- **Safe Area & Keyboard Handling:** Screens consistently use `SafeAreaView` from `react-native-safe-area-context` and `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`) with `keyboardShouldPersistTaps="handled"`.

### 2. Screens & Components That Look Complete but Have Missing or Misleading Functionality
1. **Login & Register Screens (`src/app/login.tsx`, `src/app/register.tsx`):**
   - `"Forgot Password?"` on `login.tsx:175-184` only opens a placeholder alert.
   - `GoogleSignInButton`, `FacebookSignInButton`, `AuthDivider`, and `PasswordStrengthMeter` are built in `src/components/ui/` but **not rendered** on the Login or Register screens.
   - `showSuccessModal` state (`login.tsx:43`, `register.tsx:46`) and its `<Modal>` markup are dead code (`setShowSuccessModal` is never called).
2. **Welcome Screen (`src/app/index.tsx`) vs. Guest Mode (`src/app/home.tsx`):**
   - `home.tsx` implements a complete Guest Preview mode (`?guest=1`), but `index.tsx` only renders `"Get Started"` (`/register`) and `"Sign In"` (`/login`)—there is no `"Preview as Guest"` button anywhere in the app.
3. **Product Details Screen (`src/app/products/[id]/index.tsx`):**
   - **Quantity Stepper Ignored (`lines 74, 136-142, 324-359`):** The user can increment `selectedQty` (e.g., to `5`), then tap `"Add to Cart"`, which calls `router.push({ pathname: '/sales', params: { productId: product.id } })`—ignoring `selectedQty` and always adding quantity `1`.
   - **Non-Persistent Favorite Heart (`lines 73, 144, 166-174`):** Tapping the top-right heart toggles local `isFavorite` state, which is lost as soon as the user navigates back.
   - **Missing Cost & Profit Margin Info:** Although `products.cost_price` is stored and editable, `products/[id]/index.tsx` only shows `Selling Price` and `Stock`, omitting `Cost Price`, unit markup, and profit margin (leaving `styles.metricsGrid` at lines 626–656 unused).
4. **Sales History Screen (`src/app/sales/history.tsx`):**
   - Filter chips are `['This Week', 'This Month', 'Custom']` (`line 42`). Selecting `'Custom'` opens no date picker and simply displays all-time records (`lines 150-152`). There is no `'Today'` filter chip.
   - The summary card hardcodes `"No comparison yet"` (`line 364`), and the mini sparkline (`lines 182-193`) distributes transactions using modulo `idx % 6` rather than chronological dates.
5. **Reports Screen (`src/app/reports.tsx`):**
   - Header subtitle says `"Real-time performance & analytics"` with a `CalendarFilterIcon` button (`lines 326-333`), but tapping the calendar icon navigates away to `/sales/history` instead of filtering report periods.
   - In the `Sales` tab, when `sales.length === 0`, the bar chart renders hardcoded decorative heights `[0.3, 0.45, 0.6, 0.78, 0.95]` (`line 183`) and "Top Products" displays unsold inventory retail values (`lines 244-259`) as if they were top-selling items.
6. **More Screen (`src/app/more.tsx`):**
   - Displays static `"Cloud Synced"` badges (`lines 203, 305`) regardless of actual network connectivity.

---

## Section 7 — Offline-First Readiness

TindaMate's long-term objective is offline-first operation with local SQLite persistence and background cloud synchronization. Below is the verified classification of the current codebase:

| Offline-First Capability | Classification | Technical Evidence & Behavior |
| :--- | :--- | :--- |
| **Auth Session Token Persistence** | `IMPLEMENTED` | `src/lib/supabase.ts:44-67` persists the Supabase Auth JWT in `@react-native-async-storage/async-storage` on native Android/iOS. |
| **Idempotency Keys on POS Checkout** | `IMPLEMENTED` | `src/app/sales/index.tsx:78, 369-374` generates a client-side `idempotency_key` (`pos-cart-...`) preserved across retries while the checkout modal stays open, preventing duplicate sales if a flaky connection drops the HTTP response after the DB commits. |
| **Expo SQLite Installation** | `NOT IMPLEMENTED` | `package.json` does **not** include `expo-sqlite`. Zero references to `expo-sqlite` or `SQLite` exist anywhere in `src/`. |
| **Local SQLite Database Schema** | `NOT IMPLEMENTED` | No local tables exist for `products`, `sales`, `sale_items`, `customers`, `credit_accounts`, `credit_transactions`, or `expenses`. |
| **Local Data Caching (Read Offline)** | `NOT IMPLEMENTED` | Every screen (`home`, `products`, `sales`, `customers`, `expenses`, `reports`) fetches directly from Supabase over HTTPS on focus (`useFocusEffect`). When offline, screens display error banners. |
| **Offline Checkout Queue (Write Offline)** | `NOT IMPLEMENTED` | `recordCartSale` (`src/lib/sales.ts:469`) calls `supabase.rpc('record_cart_sale', ...)` directly. If the device is offline during checkout, the RPC fails, `CheckoutModal` displays `"Could Not Complete Sale"`, and the cart remains in volatile React memory (`useState`)—lost if the app closes. |
| **Cloud Synchronization Engine** | `NOT IMPLEMENTED` | No outbox/inbox sync queue, background task, or connectivity listener (`@react-native-community/netinfo` or `expo-network`) is installed or integrated. |
| **Conflict Resolution Strategy** | `NOT IMPLEMENTED` | No local-vs-remote stock, price, or credit ledger conflict resolution exists. |

**Connectivity Interruption Behavior During Checkout:**
- If connectivity drops **before** the request reaches Supabase: `recordCartSale` throws a network error; `CheckoutModal` keeps the cart intact in memory and displays an inline retry banner (`src/components/sales/CheckoutModal.tsx:686-697`).
- If connectivity drops **after** `record_cart_sale` commits on Supabase but before the device receives the HTTP response: tapping `"Confirm Sale"` again reuses `checkoutIdempotencyKeyRef.current` (`src/app/sales/index.tsx:371`), and `record_cart_sale` safely returns the already-recorded sale (`already_recorded: true`) without double-deducting stock or double-charging Utang.

---

## Section 8 — Testing & Quality Assurance

### 1. Static Diagnostics & Automated Test Inventory
- **TypeScript Compilation (`npx tsc --noEmit`):** **PASS** (0 errors).
- **Automated Unit / Integration / E2E Test Suite:** **NONE (`0` test files)**.
  - There are no `*.test.ts`, `*.spec.ts`, or `jest` / `vitest` configurations in `package.json` or `src/`.
- **Existing Diagnostic Script (`scripts/verify-supabase.mjs`):**
  - A standalone Node script that tests anonymous read/write against `public.products`. However, it is **outdated** (pre-Batch 3 RLS): it expects anonymous `INSERT` into `public.products` (`store_id` omitted) to succeed, whereas Batch 3 (`20261021000000_batch3_products_foundation.sql`) made `store_id NOT NULL` and restricted `INSERT` to `authenticated` users with `auth.uid() = store_id`.

### 2. High-Priority Missing Test Scenarios & Regression Risks
1. **Centavo & Financial Math Unit Tests:**
   - `src/lib/sales.ts` (`calculateCartSummary`, `validatePaymentAmount`), `src/lib/customers.ts` (`validatePaymentAmountInput`), `src/lib/expenses.ts` (`validateExpenseForm`), and `src/lib/profit.ts` (`parseCOGSSummaryPayload`) have pure deterministic functions that are ideal for unit testing.
2. **Database RPC & Trigger Integration Tests (pgTAP / Supabase Local):**
   - Concurrent `record_cart_sale` calls competing for the last item in stock.
   - Idempotent retry of `record_cart_sale` with identical `(store_id, idempotency_key)`.
   - Full lifecycle of Utang: POS credit sale -> partial payment (`record_customer_payment`) -> full settlement (`status = 'settled'`) -> subsequent POS credit sale (exposing the `status` bug in `ISS-05`).
   - Cross-store RLS isolation tests verifying Store A cannot read/modify Store B's records or storage objects.
3. **Timezone Boundary Risks:**
   - `getTodayDateRangeISO()` (`src/lib/sales.ts:610-619`) uses device local midnight converted to UTC ISO strings (`start.toISOString()`) to query `TIMESTAMPTZ` columns (`sales.created_at`), whereas `getTodayLocalDateString()` (`src/lib/expenses.ts:44-50`) formats a local `YYYY-MM-DD` string to query `DATE` columns (`expenses.expense_date`). If a store owner's device clock or timezone setting is inaccurate, daily cutoffs shift accordingly.

---

## Section 9 — Production Readiness Matrix

| Category | Status | Justification & Evidence |
| :--- | :--- | :--- |
| **1. Architecture & Code Organization** | `READY` | Clean separation across `src/app`, `src/components`, `src/lib`, `src/types`, and `src/constants/theme.ts`. Zero circular dependencies detected. |
| **2. TypeScript & Static Type Safety** | `READY` | `npx tsc --noEmit` passes with 0 errors under `"strict": true`. Domain types and RPC payload normalizers are comprehensive. |
| **3. Authentication & Session Management** | `NEEDS IMPROVEMENT` | Email/password login, registration, and session persistence work, but `/more` lacks an auth redirect, OAuth buttons & password strength meter are not wired into `login.tsx`/`register.tsx`, and `"Forgot Password?"` is a stub alert. |
| **4. Products & Inventory Management** | `NEEDS IMPROVEMENT` | Add, edit, list, search, stock badges, and photo upload work well, but `storage.objects` RLS is insecure (`SEC-01`), `products/[id]` ignores `selectedQty` on "Add to Cart", and product archiving is not yet implemented. |
| **5. POS Cart & Checkout Engine** | `READY` | Multi-item cart, centavo math, quick tender bills, atomic `record_cart_sale` RPC with `FOR UPDATE` row locking, and `idempotency_key` deduplication are well-engineered. |
| **6. Customers & Utang Ledger** | `NEEDS IMPROVEMENT` | Ledger, partial/full payment RPC (`record_customer_payment`), and customer CRUD work reliably, but `credit_accounts.status` stays `'settled'` on re-borrowing (`ISS-05`) and search has PostgREST `.or()` injection (`SEC-02`). |
| **7. Expense Management** | `NEEDS IMPROVEMENT` | Full CRUD, validation, and category filters are complete, except for PostgREST `.or()` search character sanitization (`SEC-02`). |
| **8. COGS, Profit & Financial Reporting** | `BLOCKED` | **Blocked by `ISS-02` & `ISS-03`:** `/reports` subtracts *today's* expenses from *all-time* gross profit, mislabels today's expenses as `"Month Expenses"`, misattributes multi-item cart revenue to the first product only, and lacks date-range filters. |
| **9. Database Schema, RLS & Security** | `BLOCKED` | **Blocked by `SEC-01` & `SEC-02`:** `storage.objects` policies allow cross-store image overwrite/deletion; hardcoded fallback Supabase credentials in `src/lib/supabase.ts`; unconditional OAuth URL logging. |
| **10. Offline-First & Local Persistence** | `BLOCKED` | `expo-sqlite`, local schema, offline transaction queue, and sync engine are **not implemented** (`0%`). App is strictly online-only today. |
| **11. Automated Testing & QA** | `NEEDS IMPROVEMENT` | Zero automated unit or integration tests exist in the repository; `npx expo lint` / `npx expo-doctor` require ESLint config and local execution outside the sandbox. |
| **12. EAS Build & Native Release Config** | `BLOCKED` | `app.json` is missing `android.package` and `ios.bundleIdentifier`, and no `eas.json` configuration file exists yet. |

---

## Section 10 — Identified Issues & Technical Debt

### [ISS-01] Cross-Store Storage Object Overwrite & Deletion Vulnerability
- **Severity:** **Critical / High**
- **Affected Module:** Products & Inventory / Supabase Storage (`supabase/migrations/20261021000001_product_images_storage.sql:25-43`)
- **Description:** Storage RLS policies for `INSERT`, `UPDATE`, and `DELETE` on `storage.objects` only check `bucket_id = 'products'` without verifying folder ownership (`(storage.foldername(name))[1] = auth.uid()::text`).
- **Technical Evidence:** Lines 25–43 of `20261021000001_product_images_storage.sql`.
- **Potential Impact:** Any authenticated user can overwrite or delete product images belonging to any other store in the `products` bucket.
- **Recommended Resolution:** Create a new migration dropping the three permissive `storage.objects` policies and recreating them with `bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text`.

### [ISS-02] Reports Screen Subtracts *Today's* Expenses from *All-Time* Gross Profit & Mislabels Today's Expenses as "Month Expenses"
- **Severity:** **Critical (Financial Accuracy)**
- **Affected Module:** Reports & COGS/Profit (`src/app/reports.tsx:105-112, 174-177, 525-532`)
- **Description:** `loadAnalytics()` fetches `fetchStoreCOGSSummary()` with no date arguments (returning **all-time** `grossProfit` and `cogs`) alongside `fetchDashboardExpenseSummary()` (which queries `expenses` for `expense_date = todayISO` **only**). Line 177 then computes `netStoreProfit = Number((grossProfit - totalExpenses).toFixed(2))` (all-time gross profit minus today's expenses), and line 526 labels `totalExpenses` as `"Month Expenses"`.
- **Technical Evidence:**
  - `src/app/reports.tsx:109-110`: `fetchDashboardExpenseSummary()`, `fetchStoreCOGSSummary()`
  - `src/app/reports.tsx:177`: `const netStoreProfit = Number((grossProfit - totalExpenses).toFixed(2));`
  - `src/app/reports.tsx:526`: `<Text style={styles.breakdownLabel}>Month Expenses</Text>`
- **Potential Impact:** Store owners are shown mathematically invalid Net Profit figures and a false "Month Expenses" number that actually reflects only today's expenses (resetting to `₱0.00` every midnight).
- **Recommended Resolution:** Add period-aware expense aggregation (e.g., `fetchExpenseSummaryForRange(startDate, endDate)`) and pass matching `startDate` / `endDate` filters to both `fetchStoreCOGSSummary(range)` and the expense summary query so Gross Sales, COGS, Gross Profit, Operating Expenses, and Net Profit always cover the exact same time period.

### [ISS-03] Reports "Top Products" Misattributes Multi-Item Cart Revenue to First Item Only & Fabricates Revenue When Sales = 0
- **Severity:** **High (Financial Accuracy)**
- **Affected Module:** Reports (`src/app/reports.tsx:194-260`)
- **Description:** `topProducts` iterates over `sales` (header rows from `public.sales`) and groups by `s.product_id || s.product_name`. In multi-item POS checkouts (`record_cart_sale`), `public.sales` stores only the first item's `product_id`, sets `product_name` to `"<First Product> + N more"`, and sets `total_amount` to the entire cart's grand total. Furthermore, when `sales.length === 0` (lines 244–259), `topProducts` falls back to `products.slice(0, 4)` using `p.selling_price * p.stock_quantity` as `revenue`.
- **Technical Evidence:** `src/app/reports.tsx:211-259`.
- **Potential Impact:** Multi-item cart sales corrupt product-level sales analytics, and new stores with zero sales see fake "Top Products" revenue percentages derived from unsold stock.
- **Recommended Resolution:** Aggregate top-selling products from `public.sale_items` (or a dedicated Supabase RPC `get_top_selling_products(p_start_date, p_end_date)`) and show an honest empty state when `sales.length === 0`.

### [ISS-04] PostgREST `.or()` Filter Injection in Customer & Expense Search
- **Severity:** **High**
- **Affected Module:** Customers (`src/lib/customers.ts:216`) & Expenses (`src/lib/expenses.ts:320`)
- **Description:** Raw user search strings are interpolated directly into `.or(\`name.ilike.%${cleanSearch}%...\`)` without stripping commas, parentheses, or periods.
- **Technical Evidence:** `src/lib/customers.ts:216`, `src/lib/expenses.ts:320`.
- **Potential Impact:** Typing a comma or PostgREST operator in the Customer or Expense search bar breaks the query or injects unintended filter clauses.
- **Recommended Resolution:** Sanitize search input with `searchQuery.replace(/[,().%\\]/g, ' ').trim()` before building the `.or()` string.

### [ISS-05] `credit_accounts.status` Remains `'settled'` When a Settled Customer Makes a New Utang Purchase
- **Severity:** **Medium**
- **Affected Module:** POS Utang & Customer Credit Database RPC (`supabase/migrations/20261026000002_batch8c_pos_record_utang.sql:189-201, 421-442`)
- **Description:** When a customer pays off their full balance via `record_customer_payment`, `credit_accounts.status` is updated to `'settled'`. When that customer subsequently buys items on Utang via `record_cart_sale`, the RPC reuses the existing `credit_accounts` row and inserts a `'charge'` into `credit_transactions`, increasing `current_balance > 0`, **but never sets `credit_accounts.status = 'open'`**.
- **Technical Evidence:** `20261026000002_batch8c_pos_record_utang.sql:189-201` & `20261027000000_batch8e_customer_payment_settlement.sql:195-202`.
- **Potential Impact:** `customer_credit_summaries.account_status` reports `'settled'` for a customer who actively owes money (`current_balance > 0`).
- **Recommended Resolution:** Update `sync_credit_account_totals()` trigger function in a new migration so `status` is automatically derived from balance (`CASE WHEN v_next_balance > 0 THEN 'open' ELSE 'settled' END`).

### [ISS-06] Dashboard Profit KPI Silently Displays 100% of Gross Sales as "Profit" When COGS RPC Fails
- **Severity:** **Medium**
- **Affected Module:** Dashboard (`src/app/home.tsx:207-211, 647-649`)
- **Description:** Line 648 computes `const profitValueDisplay = isGuestMode ? '₱0.00' : formatPesoCurrency(todayGrossProfit ?? todaySalesSummary.totalAmount)`. If `fetchStoreCOGSSummary` fails or returns `null`, `todaySalesSummary.totalAmount` (Gross Sales) is displayed under the `"Profit"` card title. Additionally, the Dashboard Profit card does not indicate when sold items lack `cost_price` (`hasIncompleteCosts`).
- **Technical Evidence:** `src/app/home.tsx:647-649`.
- **Potential Impact:** Misleads store owners into thinking 100% of gross revenue is profit if the COGS RPC fails or if `cost_price` is untracked.
- **Recommended Resolution:** Display `'—'` or `'₱0.00'` (never `todaySalesSummary.totalAmount`) when `todayGrossProfit === null`, and surface a badge when `hasIncompleteCosts` is `true`.

### [ISS-07] Dashboard "This Week" Sales Chart Silently Falls Back to All-Time Weekday Sums
- **Severity:** **Medium**
- **Affected Module:** Dashboard (`src/app/home.tsx:555-587`)
- **Description:** In `weeklyChartBuckets`, if `currentWeekCentavos` has zero sales in the current Monday–Sunday week (`hasCurrentWeekSales === false`), `activeCentavosBuckets` falls back to `historicalWeekdayCentavos` (all-time sales grouped by weekday) while the UI still labels the section `"This Week"`.
- **Technical Evidence:** `src/app/home.tsx:585-587`: `const activeCentavosBuckets = hasCurrentWeekSales ? currentWeekCentavos : historicalWeekdayCentavos;`.
- **Potential Impact:** At the start of a new week (e.g., Monday morning with zero sales yet), the chart displays past weeks' cumulative sales bars as if they happened `"This Week"`.
- **Recommended Resolution:** Always use `currentWeekCentavos` for the `"This Week"` chart so zero-sale days in the current week honestly render at `0`.

### [ISS-08] Reports Screen Missing Period Selectors (Daily / Weekly / Monthly / All-Time) & Uses Modulo Chart Bucketing
- **Severity:** **Medium**
- **Affected Module:** Reports (`src/app/reports.tsx:181-191, 326-333`)
- **Description:** `/reports` has no Daily/Weekly/Monthly/All-Time period filter, and `chartBars` buckets sales using `buckets[4 - (idx % 5)]` (modulo arithmetic on array index rather than transaction date).
- **Technical Evidence:** `src/app/reports.tsx:181-191`.
- **Potential Impact:** Store owners cannot view daily, weekly, or monthly profit/loss statements, and the Sales bar chart on `/reports` does not represent chronological time buckets.
- **Recommended Resolution:** Add a `['Today', 'This Week', 'This Month', 'All Time']` period selector to `/reports` and compute chronological date buckets.

### [ISS-09] Disconnected Auth UI Components, Placeholder Forgot Password & Unreachable Guest Mode
- **Severity:** **Medium**
- **Affected Module:** Authentication (`src/app/login.tsx`, `src/app/register.tsx`, `src/app/index.tsx`, `src/components/ui/`)
- **Description:**
  1. `GoogleSignInButton.tsx`, `FacebookSignInButton.tsx`, `AuthDivider.tsx`, and `PasswordStrengthMeter.tsx` are implemented in `src/components/ui/` and backed by `src/lib/oauth.ts`, but are not rendered in `login.tsx` or `register.tsx`.
  2. `handleForgotPassword` in `login.tsx:175-184` is a stub alert.
  3. Guest Preview (`?guest=1` in `home.tsx`) has no entry button on `index.tsx`, `login.tsx`, or `register.tsx`.
- **Technical Evidence:** `src/app/login.tsx:1-35, 175-184`, `src/app/register.tsx:1-35`, `src/app/index.tsx:100-140`.
- **Potential Impact:** Users cannot use Google/Facebook sign-in, password strength feedback, password reset, or Guest Preview from the UI.
- **Recommended Resolution:** Wire the existing OAuth buttons and `PasswordStrengthMeter` into `login.tsx`/`register.tsx`, implement `supabase.auth.resetPasswordForEmail()`, and add a `"Try Guest Preview"` button on `src/app/index.tsx` (or remove guest mode if no longer desired).

### [ISS-10] Product Details Screen Ignores Selected Quantity on "Add to Cart", Has Unpersisted Favorite Toggle & Omits Cost/Margin
- **Severity:** **Medium**
- **Affected Module:** Products (`src/app/products/[id]/index.tsx:73-74, 136-144, 324-359`)
- **Description:**
  1. `handleAddToPosCart` (`lines 136-142`) navigates to `/sales?productId=<id>` without passing `selectedQty`, so `/sales` (`src/app/sales/index.tsx:157-190`) always adds quantity `1`.
  2. The heart button (`isFavorite`, `line 73`) only flips local component state.
  3. `cost_price` and unit profit margin are not displayed on `products/[id]/index.tsx`.
- **Technical Evidence:** `src/app/products/[id]/index.tsx:136-142` and `src/app/sales/index.tsx:157-190`.
- **Potential Impact:** Confusing UX when a vendor selects a quantity on Product Details and only 1 unit appears in the POS cart.
- **Recommended Resolution:** Pass `quantity: String(selectedQty)` in `router.push({ pathname: '/sales', params: { productId: product.id, quantity: String(selectedQty) } })` and handle `params.quantity` in `src/app/sales/index.tsx`; display `cost_price` and profit margin on Product Details.

### [ISS-11] Hardcoded Fallback Supabase URL & Key and Unconditional OAuth Console Logging
- **Severity:** **Medium**
- **Affected Module:** Supabase Client & OAuth (`src/lib/supabase.ts:11-39`, `src/lib/oauth.ts:28-92`)
- **Description:** Hardcoded fallback project URL and anon JWT key in `src/lib/supabase.ts` make the missing-env error check unreachable; `src/lib/oauth.ts` logs raw OAuth callback URLs without `if (__DEV__)`.
- **Technical Evidence:** See **SEC-03** and **SEC-04** in Section 5.
- **Recommended Resolution:** Remove hardcoded fallback credentials from `src/lib/supabase.ts` and gate all OAuth/session logs behind `if (__DEV__)`.

### [ISS-12] Missing Native Package Identifiers (`app.json`), Legacy RPC & Dead Template Files
- **Severity:** **Low**
- **Affected Module:** Project Configuration & Hygiene (`app.json`, `package.json`, `src/app/explore.tsx`, `src/components/`)
- **Description:**
  1. `app.json` lacks `android.package` (e.g., `"com.tindamate.app"`) and `ios.bundleIdentifier`.
  2. Legacy `public.record_product_sale(uuid, integer)` RPC (`20261022000000_batch4_sales_foundation.sql`) is still executable and bypasses `sale_items`.
  3. 10 starter template files (`explore.tsx`, `app-tabs.tsx`, etc.) and 3 unused dependencies (`@expo/ui`, `expo-glass-effect`, `expo-symbols`) remain in the repo.
- **Recommended Resolution:** Add native bundle identifiers to `app.json`, revoke/drop `record_product_sale(uuid, integer)` in a cleanup migration, and remove dead template files and unused packages.

---

## Section 11 — Prioritized Development Roadmap

### P0 — Critical Blockers (Security & Financial Integrity)
*Must be completed immediately before any external beta or store owner onboarding.*
1. **Batch 10A — Security & Database Hardening:**
   - **Dependencies:** None.
   - **Scope:**
     - Add SQL migration fixing `storage.objects` RLS policies on `products` bucket to enforce `(storage.foldername(name))[1] = auth.uid()::text` (`SEC-01` / `ISS-01`).
     - Update `sync_credit_account_totals()` trigger in SQL so `credit_accounts.status` automatically updates to `'open'` when `current_balance > 0` and `'settled'` when `current_balance = 0` (`ISS-05`).
     - Revoke/drop legacy `public.record_product_sale(uuid, integer)` RPC.
     - Sanitize PostgREST `.or()` search inputs in `src/lib/customers.ts` and `src/lib/expenses.ts` (`SEC-02` / `ISS-04`).
     - Remove hardcoded fallback Supabase URL/key in `src/lib/supabase.ts` (`SEC-03`), gate OAuth logs behind `if (__DEV__)` (`SEC-04`), and add the missing session guard in `src/app/more.tsx` (`SEC-05`).
   - **Expected Outcome:** Zero cross-store storage vulnerabilities, accurate credit account statuses, and hardened auth/query security.

2. **Batch 10B — Financial Reporting & Profit Calculation Fix:**
   - **Dependencies:** Existing Batch 9A (`expenses`) & Batch 9D (`get_store_cogs_summary`).
   - **Scope:**
     - Fix `/reports` (`src/app/reports.tsx`) so Gross Sales, COGS, Gross Profit, Operating Expenses, and Net Profit are all queried using matching date ranges (`Today`, `This Week`, `This Month`, `All Time`) (`ISS-02`, `ISS-08`).
     - Replace `public.sales` header aggregation in `/reports` "Top Products" with `public.sale_items` line-item aggregation, and remove the unsold-inventory fallback when `sales.length === 0` (`ISS-03`).
     - Separate **Realized Cash Sales** vs. **Uncollected Credit (Utang) Sales** in the Profit breakdown so store owners can see both Accrual Net Profit and Cash-Realized Net Profit.
     - Fix Dashboard (`src/app/home.tsx`) Profit KPI fallback (`ISS-06`) and Weekly Sales chart fallback (`ISS-07`).
   - **Expected Outcome:** 100% mathematically accurate, period-aligned financial statements across Dashboard and Reports.

---

### P1 — High Priority (Functional Completeness & Build Readiness)
3. **Batch 11A — UX Polish & Disconnected Feature Wiring:**
   - **Dependencies:** Batch 10A.
   - **Scope:**
     - Pass `selectedQty` from `src/app/products/[id]/index.tsx` to `/sales` cart and display `cost_price` + profit margin on Product Details (`ISS-10`).
     - Add `'Today'` and `'All Time'` filter pills to `src/app/sales/history.tsx` and fix chronological trend bars.
     - Wire `PasswordStrengthMeter`, `GoogleSignInButton` / `FacebookSignInButton` (or hide if OAuth providers are not configured in Supabase dashboard), and implement password reset (`supabase.auth.resetPasswordForEmail`) (`ISS-09`).
     - Add product archive (`is_active`) support so discontinued products can be hidden from POS without breaking `ON DELETE RESTRICT` historical sales.
   - **Expected Outcome:** Every visible UI control across Auth, Products, and Sales History performs its expected action end-to-end.

4. **Batch 11B — EAS Build Configuration & Automated Test Foundation:**
   - **Dependencies:** Batch 10B, Batch 11A.
   - **Scope:**
     - Configure `android.package` and `ios.bundleIdentifier` in `app.json` and create `eas.json` (`ISS-12`).
     - Add Jest / unit tests covering `src/lib/sales.ts`, `src/lib/customers.ts`, `src/lib/expenses.ts`, and `src/lib/profit.ts`.
     - Prune dead starter template files (`src/app/explore.tsx`, etc.) and unused dependencies.
   - **Expected Outcome:** Reproducible Android APK/AAB cloud builds via EAS and automated regression protection for centavo financial logic.

---

### P2 — Medium Priority (Offline-First Architecture)
5. **Batch 12 — Offline-First SQLite & Cloud Sync Engine:**
   - **Dependencies:** Batch 10A, Batch 10B, Batch 11B.
   - **Scope:**
     - Install `expo-sqlite` via `npx expo install expo-sqlite` and network status detection (`expo-network`).
     - Implement local SQLite mirror tables (`products`, `sales`, `sale_items`, `customers`, `credit_accounts`, `credit_transactions`, `expenses`) + an `offline_mutation_queue` outbox table.
     - Queue POS checkouts (`record_cart_sale` payloads with `idempotency_key`) locally when offline and replay them sequentially via `record_cart_sale` RPC when connectivity resumes.
     - Replace static `"Cloud Synced"` badges with real sync state indicators (`Synced`, `Offline — N pending`, `Syncing...`).
   - **Expected Outcome:** True offline-capable sari-sari store POS operation with idempotent cloud synchronization.

---

### P3 — Future Improvements
6. **Batch 13 — Barcode Scanning, Receipt Printing & Inventory Restock Logs:**
   - Barcode/QR scanner (`expo-camera`) for instant POS item lookup.
   - Bluetooth thermal receipt printer (`ESC/POS`) / shareable image receipt export.
   - Dedicated Stock Adjustment / Restock log linking inventory restocks directly to `Restock / Inventory` expenses.

---

## Section 12 — Final Recommendation

### 1. What is genuinely complete and working well?
- **Multi-Item POS Cart & Atomic Checkout (`src/app/sales/index.tsx`, `src/components/sales/CheckoutModal.tsx`, `record_cart_sale` RPC):** Integer-centavo math, stock cap validation, quick tender options, sorted row locking (`FOR UPDATE`), `cost_price` snapshotting into `sale_items`, and `idempotency_key` deduplication are rock-solid.
- **Customer Credit (Utang) & Payment Settlement (`src/app/customers/`, `record_customer_payment` RPC):** Full customer directory, credit ledger, and atomic partial/full payment settlement with overpayment protection work cohesively.
- **Expense Tracking (`src/app/expenses/`, `src/lib/expenses.ts`):** Complete CRUD (create, list, category filter, edit, delete with confirmation modal) and database constraints (`20261031000000_batch9a_expenses_foundation.sql`).
- **Products & Inventory CRUD (`src/app/products/`, `src/lib/products.ts`):** Product creation, editing, live stock status calculation (`In Stock`, `Low Stock`, `Out of Stock`), and camera/gallery image upload to Supabase Storage.
- **TypeScript & Design System Foundation:** Zero TypeScript compilation errors (`npx tsc --noEmit` passes cleanly) and a unified, accessible Mint-Sage / Emerald Green theme (`src/constants/theme.ts`).

### 2. What is incomplete or broken?
- **Reports Financial Math (`src/app/reports.tsx`):** Subtracts *today's* expenses from *all-time* gross profit (`ISS-02`), mislabels today's expenses as `"Month Expenses"`, misattributes 100% of multi-item cart revenue to the first product in "Top Products" (`ISS-03`), fabricates revenue from unsold stock when sales are zero, and lacks Daily/Weekly/Monthly/All-Time period filters (`ISS-08`).
- **Storage RLS Policy (`20261021000001_product_images_storage.sql`):** Lacks folder ownership enforcement (`(storage.foldername(name))[1] = auth.uid()::text`), allowing cross-store image overwrite/deletion (`SEC-01` / `ISS-01`).
- **PostgREST Search Filter Unsanitized Input (`src/lib/customers.ts:216`, `src/lib/expenses.ts:320`):** Unsanitized `.or()` string interpolation breaks when search queries contain commas or PostgREST operators (`SEC-02` / `ISS-04`).
- **Credit Account Status on Re-Borrowing (`20261026000002_batch8c_pos_record_utang.sql`):** `credit_accounts.status` stays `'settled'` when a previously settled customer makes a new Utang purchase (`ISS-05`).
- **UI Disconnections:** Product Details ignores `selectedQty` when adding to POS cart (`ISS-10`), Dashboard Profit KPI falls back to displaying Gross Sales if the COGS RPC fails (`ISS-06`), `/more` lacks an unauthenticated redirect (`SEC-05`), and OAuth buttons / PasswordStrengthMeter / Forgot Password / Guest Preview entry button are unfinished or unwired (`ISS-09`).

### 3. Is the project ready for real sari-sari store owners?
- **For supervised online pilot testing of POS, Products, Utang, and Expenses:** **Almost — requires P0 fixes first** (specifically fixing `SEC-01` storage RLS, `SEC-02` search sanitization, `ISS-05` credit status trigger, and `ISS-02`/`ISS-03` financial report calculations).
- **For general public production release or offline store environments:** **Not yet.** P0 and P1 batches must be completed for online production readiness, and P2 (`expo-sqlite` offline-first sync) is required for stores with unreliable mobile data.

### 4. What must be fixed immediately before adding new features?
1. **Fix `storage.objects` RLS policies** on the `products` bucket (`SEC-01` / `ISS-01`).
2. **Fix `/reports` Net Profit, Expense period matching, and Top Products `sale_items` aggregation** (`ISS-02`, `ISS-03`, `ISS-08`) plus the **Dashboard Profit KPI fallback** (`ISS-06`).
3. **Fix `sync_credit_account_totals()` trigger** so `credit_accounts.status` resets to `'open'` when `current_balance > 0` (`ISS-05`).
4. **Sanitize `.or()` search strings** in `src/lib/customers.ts` and `src/lib/expenses.ts` (`SEC-02` / `ISS-04`).
5. **Remove hardcoded Supabase credentials** from `src/lib/supabase.ts` (`SEC-03`), **guard OAuth console logs** (`SEC-04`), and **add the auth guard to `/more`** (`SEC-05`).

### 5. Should development continue with Batch 9E (Financial Reports Upgrade), security/bug fixes, or offline-first architecture?
- **Start with a combined Security & Financial Reports Stabilization Batch (Batch 10A + Batch 10B / Batch 9E).**
- Because Batch 9E (Financial Reports Upgrade) directly touches `src/app/reports.tsx`, `src/lib/profit.ts`, and `src/lib/expenses.ts`, combining the **P0 Security/DB fixes** (`SEC-01` to `SEC-05`, `ISS-05`) with the **Financial Reports & Profit Accuracy overhaul** (`ISS-02`, `ISS-03`, `ISS-06`, `ISS-07`, `ISS-08`) resolves the most critical blockers in one cohesive milestone before introducing `expo-sqlite` offline-first complexity.

### 6. Recommended Next Development Batch Title
> **Batch 10 (9E + Security Hardening): Storage RLS & Credit Status Fix, Search Sanitization, and Period-Accurate Financial Reports (`sale_items` & Net Profit Alignment)**

### 7. Recommended Exact Scope for that Batch
1. **Supabase Migration (`20261111000000_batch10_security_and_reporting_fixes.sql`):**
   - Enforce `(storage.foldername(name))[1] = auth.uid()::text` on `storage.objects` `INSERT`, `UPDATE`, and `DELETE` policies for `bucket_id = 'products'`.
   - Update `public.sync_credit_account_totals()` so `status = CASE WHEN v_next_balance > 0 THEN 'open' ELSE 'settled' END` and backfill any existing rows where `current_balance > 0 AND status = 'settled'`.
   - Revoke/drop legacy `public.record_product_sale(uuid, integer)`.
   - Add a read-only RPC `public.get_store_financial_report(p_start_date timestamptz, p_end_date timestamptz, p_expense_start date, p_expense_end date)` (or top-products RPC aggregating `public.sale_items`) so Sales, COGS, Cash vs. Utang revenue, Expenses, and Top Products are computed atomically for any selected period.
2. **Service & Auth Hardening (`src/lib/` & `src/app/more.tsx`):**
   - Sanitize `.or()` search queries in `src/lib/customers.ts` and `src/lib/expenses.ts`.
   - Remove hardcoded fallback URL/key in `src/lib/supabase.ts`, gate `src/lib/oauth.ts` logs with `if (__DEV__)`, and enforce session redirect on `src/app/more.tsx`.
3. **Reports & Dashboard Accuracy (`src/app/reports.tsx` & `src/app/home.tsx`):**
   - Add period filter tabs (`Today`, `This Week`, `This Month`, `All Time`) to `/reports`.
   - Align Gross Profit and Operating Expenses to the same selected period, fix `"Month Expenses"` labeling, aggregate Top Products from `sale_items`, and fix the Dashboard Profit KPI & Weekly Chart fallbacks.
