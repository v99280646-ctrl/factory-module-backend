# Factory Module Backend

Express and MongoDB API for the Factrova factory operations UI.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set these values in `.env` before login:

```text
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
JWT_SECRET=change-this-to-a-long-random-secret
```

Super admin access is now stored in the database in the `superadminaccesses` collection.
You can still keep `SUPER_ADMIN_EMAILS` as an optional fallback for local bootstrap.

Seed the first admin access record with:

```bash
npm run seed:super-admin -- ads.grandcafe@gmail.com "Grand Cafe Admin"
```

If this database already had the older non-tenant indexes, run:

```bash
npm run migrate:tenant-indexes
```

Default API base:

```text
http://localhost:4000/api
```

Versioned operations API base:

```text
http://localhost:4000/api/v1
```

## Main Routes

```text
GET    /api/health
GET    /api/factories
POST   /api/factories

POST   /api/auth/google
GET    /api/auth/me
POST   /api/auth/factories/:factoryId/members

GET    /api/admin/dashboard/summary
GET    /api/admin/factories
POST   /api/admin/accounts

GET    /api/v1/dashboard/summary
POST   /api/v1/bootstrap/defaults

GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id

GET/POST/PATCH/DELETE also exists for:
/api/v1/vendors
/api/v1/staff
/api/v1/services
/api/v1/stock
/api/v1/waste
/api/v1/projects
/api/v1/transactions
/api/v1/invoices
/api/v1/settings
/api/v1/notifications

POST   /api/v1/projects
PATCH  /api/v1/projects/:id/workflow
PATCH  /api/v1/stock/:id/quantity
PUT    /api/v1/settings/:scope
PUT    /api/v1/notifications
```

## Project Create Payload

```json
{
  "name": "Sterling HQ Cabinets",
  "customerId": "665f2f7e82e7ec0016a91abc",
  "customerName": "Sterling Interiors",
  "workType": "own",
  "delivery": "2026-06-30",
  "materials": [
    {
      "source": "inventory",
      "stockItemId": "665f2f7e82e7ec0016a91abd",
      "materialName": "MDF Sheet 18mm",
      "materialType": "MDF",
      "quantity": 10,
      "unit": "sheets"
    }
  ],
  "services": [
    {
      "serviceName": "Pressing"
    },
    {
      "serviceName": "Cutting"
    }
  ]
}
```

Creating a project validates inventory quantity, saves project materials/services/workflow stages, and deducts used stock.

## Collections

```text
profiles: email, fullName, avatarUrl, googleSubject, globalRole, active
superadminaccesses: email, fullName, active
factorymembers: factoryId, profileId, email, role, employeeRole, status
subscriptions: factoryId, provider, plan, status, currentPeriodStart, currentPeriodEnd
payments: factoryId, amount, currency, status, provider, providerPaymentId, paidAt
customers: company, contact, phone, email, address, state, district, pincode, gstin
vendors: name, contact, alternativeContact, email, gst, address, materials
staff: name, email, phone, role, accessLevel, active
services: name, price, unit
stockitems: material, type, quantity, unit, lowStockAt
wastematerials: code, material, size, note
projects: code, name, customer, workType, status, progress, delivery, amount, notes, materials[], services[], workflowStages[]
transactions: transactionDate, description, type, amount
invoices: invoiceNo, projectId, customerName, invoiceDate, status, billToAddress, design, totals, items[]
appsettings: scope, config
notificationsettings: audience, label, enabled
```

All operations collections are scoped by `factoryId`. Send `Authorization: Bearer <token>` and `X-Factory-Id: <factoryId>` for `/api/v1/*` requests.

## Account Creation

Use Google sign-in to create a profile, then assign access with the admin APIs:

```json
{
  "email": "admin@factory.com",
  "fullName": "Factory Admin",
  "role": "factory_admin",
  "factoryId": "66a1f0b2b5d1c8a1d2e3f456"
}
```

For staff/employee:

```json
{
  "email": "staff@factory.com",
  "fullName": "Line Worker",
  "role": "employee",
  "factoryId": "66a1f0b2b5d1c8a1d2e3f456",
  "employeeRole": "Cutting"
}
```

## Layout

```text
src/
  app.js
  server.js
  config/
  db/
  middlewares/
  modules/
    admin/
    auth/
    factory/
    health/
  routes/
  utils/
```

## Scripts

```bash
npm run dev
npm start
npm run lint
npm test
```
