# 📊 Waffle Forever – Sales Analytics Dashboard

A production-ready **sales analytics dashboard** for Waffle Forever using **Next.js App Router** and **Rista POS APIs**.  
The system securely fetches, aggregates, and visualizes branch-wise sales data.

---

## 🎯 Features

- **Secure Architecture**: API keys and JWT tokens never exposed to browser
- **Type-Safe**: Full TypeScript implementation with generated API types
- **Real-time Analytics**: Branch-wise sales data with date filtering
- **Interactive Charts**: Time-based analytics with Recharts
- **Payment Breakdown**: Categorized by Cash, UPI, and Card
- **Item Analytics**: Bestselling items tracking
- **Multi-branch Support**: Switch between branches dynamically

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **API Integration**: Rista POS APIs with Swagger Codegen
- **Authentication**: JWT (HS256)

---

## 📋 Prerequisites

- Node.js 20+ and npm
- Rista API credentials (API Key and Secret Key)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/zedexinfo/wf-sales-dashboard.git
cd wf-sales-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Rista API credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
RISTA_API_KEY=your_api_key_here
RISTA_SECRET_KEY=your_secret_key_here
RISTA_BASE_URL=https://api.ristaapps.com/v1
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 5. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/dashboard/branch/route.ts  # Unified dashboard API
│   ├── dashboard/page.tsx             # Dashboard UI
│   ├── layout.tsx                     # Root layout with Redux
│   └── page.tsx                       # Home page (redirects)
├── generated/rista/                   # Auto-generated API types
├── lib/
│   ├── jwt.ts                        # JWT generator (HS256)
│   └── ristaClient.ts                # Rista API client wrapper
├── services/
│   ├── salesSummary.service.ts       # Sales summary analytics
│   ├── salesPage.service.ts          # Paginated sales fetching
│   ├── paymentAnalytics.service.ts   # Payment breakdown
│   └── itemAnalytics.service.ts      # Item & time analytics
├── store/
│   ├── index.ts                      # Redux store config
│   ├── dashboardSlice.ts             # Dashboard state slice
│   ├── hooks.ts                      # Typed Redux hooks
│   └── ReduxProvider.tsx             # Client-side provider
└── types/dashboard.ts                # TypeScript interfaces
```

---

## 🔐 Security

### Core Principles

1. **Never expose API keys to browser**: All Rista API calls go through backend API routes
2. **Server-side JWT generation**: Tokens generated using HS256 algorithm on server only
3. **Environment variables**: Sensitive data stored in `.env.local` (never committed)

### JWT Implementation

- **Algorithm**: HS256
- **Payload**: `{ iss: API_KEY, iat: timestamp }`
- **Location**: Server-side only (`src/lib/jwt.ts`)

---

## 📊 API Endpoints

### Dashboard API

**GET** `/api/dashboard/branch`

Query Parameters:
- `branch` (required): Branch ID (e.g., BR001)
- `date` (required): Date in YYYY-MM-DD format

Response:
```json
{
  "summary": {
    "totalSales": 15000,
    "totalOrders": 45,
    "totalTax": 1200,
    "totalDiscount": 300
  },
  "payments": {
    "cash": 8000,
    "upi": 5000,
    "card": 2000,
    "cashInflow": 8000
  },
  "ordersByHour": [0, 0, 0, ..., 12, 8, 0],
  "ordersByWeekday": [15, 20, 18, 22, 25, 30, 12],
  "topItem": {
    "name": "Belgian Waffle",
    "qty": 45
  }
}
```

---

## 🎨 UI Components

### Dashboard Features

1. **Branch Selector**: Dropdown to select branch (BR001, BR002, BR003)
2. **Date Picker**: Choose date for analytics
3. **KPI Cards**: Display total sales, orders, tax, and discount
4. **Orders by Hour**: Bar chart showing order distribution (24 hours)
5. **Orders by Weekday**: Bar chart showing weekly patterns
6. **Payment Breakdown**: Pie chart with Cash/UPI/Card distribution
7. **Bestseller Card**: Trophy display for top-selling item

---

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run codegen      # Regenerate API types from Swagger using Orval
```

### Code Generation

This project uses [Orval](https://orval.dev/) to generate TypeScript types and API functions from the Swagger/OpenAPI specification.

**Configuration**: `orval.config.js`
- Input: `swagger.json` (OpenAPI 3.0 spec)
- Output: `src/generated/rista/`
- Client: Axios with custom instance for authentication
- Mode: Single file generation

**Generated files**:
- `src/generated/rista/ristaApi.ts` - API functions (`getBranches`, `getAnalyticsSalesSummary`, `getSalesPage`)
- `src/generated/rista/models/` - TypeScript interfaces for all schemas

The custom Axios instance (`src/lib/ristaClient.ts`) automatically injects authentication headers (x-api-key, x-api-token) for all API calls.

---

## 📦 Dependencies

### Production
- `next` - React framework
- `react`, `react-dom` - UI library
- `@reduxjs/toolkit` - State management
- `react-redux` - Redux bindings
- `recharts` - Data visualization
- `axios` - HTTP client
- `jsonwebtoken` - JWT generation

### Development
- `typescript` - Type safety
- `eslint` - Code linting
- `tailwindcss` - Styling
- `orval` - API type generation from OpenAPI/Swagger specs

---

## 🧪 Testing

The project includes:
- TypeScript compilation checks
- ESLint for code quality
- CodeQL security scanning

Run checks:
```bash
npm run build  # TypeScript compilation
npm run lint   # Code linting
```

---

## 🚧 Roadmap (Phase 2)

- [ ] Redis caching for improved performance
- [ ] Monthly comparison views
- [ ] Excel export functionality
- [ ] Role-based access control (RBAC)
- [ ] WhatsApp report automation

---

## 📄 License

This project is private and proprietary to Waffle Forever.

---

## 👥 Authors

- **Zedex Info** - Development team

---

## 🤝 Contributing

This is a private project. For internal contributions, please follow the standard Git workflow:

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

## 📞 Support

For questions or issues, contact the Waffle Forever development team.

