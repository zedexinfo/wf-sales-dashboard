# wf-sales-dashboard
Waffle Forever Sales reports and analytics dashboard.

## Objective
Build a production-ready **sales analytics dashboard** for Waffle Forever using **Next.js App Router** and **Rista POS APIs**.  
The system must securely fetch, aggregate, and visualize branch-wise sales data.

---

## Tech Stack
- Next.js (App Router)
- TypeScript
- Redux Toolkit
- Rista Swagger + Codegen
- Recharts / Chart.js
- Backend-for-Frontend (Next.js API routes)

---

## Core Rules
1. Never expose Rista API keys or JWT to the browser
2. All Rista calls must go through backend API routes
3. Use Swagger Codegen for typed APIs
4. Frontend only consumes aggregated internal APIs

---

## Rista API
- Swagger: https://ristaapps.com/api/documentation/swagger.json
- Base URL: https://api.ristaapps.com/v1

---

## Project Structure

src/
├─ app/
│  ├─ api/dashboard/branch/route.ts
│  └─ dashboard/page.tsx
├─ generated/rista (swagger output – read only)
├─ lib/jwt.ts
├─ lib/ristaClient.ts
├─ services/
│  ├─ salesSummary.service.ts
│  ├─ salesPage.service.ts
│  ├─ paymentAnalytics.service.ts
│  └─ itemAnalytics.service.ts
├─ store/
│  ├─ index.ts
│  └─ dashboardSlice.ts
└─ types/dashboard.ts

---

## Step 1 – Swagger Codegen

```bash
npx swagger-typescript-api \
  -p swagger.json \
  -o src/generated/rista \
  -n ristaApi.ts
```

---

## Step 2 – JWT Generator (Server Only)

- Algorithm: HS256
- Payload:
  - iss = API Key
  - iat = current timestamp (seconds)

---

## Step 3 – Rista Client Wrapper

Inject headers per request:
- x-api-key
- x-api-token (JWT)

---

## Step 4 – Backend Services

### Sales Summary
Endpoint:
GET /analytics/sales/summary

Returns:
- totalSales
- totalOrders
- totalTax
- totalDiscount

---

### Paginated Sales Fetch
Endpoint:
GET /sales/page

Loop until lastKey is null.

---

### Payment Analytics
Compute:
- Cash
- UPI (via subMode)
- Card
- Cash inflow

---

### Item Analytics
Aggregate sale.items[] to find most sold item.

---

### Time Analytics
- Orders by hour (0–23)
- Orders by weekday (Mon–Sun)

---

## Step 5 – Unified Dashboard API

Endpoint:
GET /api/dashboard/branch?branch=BR001&date=YYYY-MM-DD

Response Shape:
```ts
{
  summary: {},
  payments: {},
  ordersByHour: number[],
  ordersByWeekday: number[],
  topItem: { name: string; qty: number }
}
```

---

## Step 6 – Redux State

State:
- branch
- date
- data
- loading
- error

Async thunk fetches dashboard API.

---

## Step 7 – UI

Components:
- Branch selector
- Date picker
- KPI cards
- Charts
- Bestseller card

---

## Environment Variables

```env
RISTA_API_KEY=
RISTA_SECRET_KEY=
RISTA_BASE_URL=https://api.ristaapps.com/v1
```

---

## Phase 2 (Optional)
- Redis caching
- Monthly comparison
- Excel export
- RBAC
- WhatsApp reports

---

## Success Criteria
- Secure
- Typed
- Scalable
- Multi-branch ready
