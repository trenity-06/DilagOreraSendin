# TODO - Inventory System (Web + Mobile)

## Step 1 — Backend foundations

- [x] Inspect existing Laravel auth/sanctum setup (Sanctum config, User model, migrations)


- [x] Design/implement inventory DB schema via migrations:
  - [x] tbl_inventory_items
  - [x] tbl_inventory_transactions
  - [x] tbl_sales
  - [x] tbl_proof_of_sale
  - [x] tbl_notifications (webhook delivery log)

- [ ] Add/adjust User authorization model:
  - [ ] role/permission flag (e.g., is_admin or role_id)
  - [ ] middleware to protect inventory/report/webhook routes

## Step 2 — Inventory + Transactions APIs
- [ ] Implement Inventory endpoints:

  - [ ] Create/update item
  - [ ] List items with category sorting + search/filter
  - [ ] Get item details + current stock
- [ ] Implement Transactions endpoints:
  - [ ] Record stock IN (restock)
  - [ ] Record stock OUT via sale processing
  - [ ] Validate stock availability (no negative stock)
  - [ ] List/filter transactions

## Step 3 — Proof of Sale + Digital record management
- [ ] Implement upload proof of sale (store file securely)
- [ ] Implement list/download/delete proof records

## Step 4 — Sales + Revenue
- [ ] Implement Sales endpoints:
  - [ ] Create sale (creates OUT transactions)
  - [ ] List sales
  - [ ] Compute total revenue endpoints (date/category filters)

## Step 5 — Dashboard + Search/Filter UI support
- [ ] Implement dashboard endpoints (stock summary by category, recent activity, revenue summaries)
- [ ] Implement automated report generation endpoints (CSV/PDF as needed)

## Step 6 — Webhooks + Notifications system
- [ ] Implement webhook dispatcher:
  - [ ] Trigger on sale created
  - [ ] Trigger on report completed
  - [ ] Trigger on low-stock alerts
- [ ] Implement webhook delivery logging + retries
- [ ] Implement webhook payload formats and endpoints
- [ ] Add email notifications using Laravel mail (auto sale confirmation)
- [ ] Add messaging integrations using generic webhook URLs (Slack/Discord style)

## Step 7 — React frontend (Inventory monitoring)
- [ ] Add new routes:
  - [ ] /inventory dashboard
  - [ ] /inventory/items
  - [ ] /inventory/transactions
  - [ ] /inventory/sales
  - [ ] /reports
- [ ] Add services for inventory/transactions/sales/reports/webhook logs
- [ ] Build UI components:
  - [ ] item management (forms)
  - [ ] sale processing + proof upload
  - [ ] transaction tables with search/filter
  - [ ] dashboard summary cards

## Step 8 — Flutter mobile app
- [ ] Create Flutter project folder
- [ ] Implement login + API-based authentication
- [ ] Implement secure token storage + user session handling
- [ ] Implement REST client + GET/POST/PUT/DELETE endpoints
- [ ] Implement synchronization screens (inventory/items/transactions)

## Step 9 — Testing & validation
- [x] Run migrations

- [ ] Validate end-to-end sale -> stock reduction -> transaction record -> proof -> revenue calc -> webhook triggers
- [ ] Validate report generation -> webhook/email notifications

