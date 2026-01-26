# 📊 Waffle Forever – Sales Analytics Dashboard

A production-ready **sales analytics dashboard** for Waffle Forever using **Next.js App Router** and **Rista POS APIs**.  
The system securely fetches, aggregates, and visualizes branch-wise sales data.

---

## 🎯 Features

- **User Authentication**: Secure login/signup with NextAuth and MongoDB
- **Secure Architecture**: API keys and JWT tokens never exposed to browser
- **Type-Safe**: Full TypeScript implementation with generated API types
- **Real-time Analytics**: Branch-wise sales data with date filtering
- **Interactive Charts**: Time-based analytics with Recharts
- **Tabbed Interface**: Organized views (Overview, Metrics, Highlights) for better UX
- **Payment Breakdown**: Categorized by Cash, UPI, and Card
- **Item Analytics**: Bestselling items tracking
- **Multi-branch Support**: Switch between branches dynamically
- **Branch Comparison**: Compare sales data across multiple branches side-by-side
- **API Caching**: In-memory caching for faster data retrieval and reduced API calls

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js with MongoDB
- **Database**: MongoDB
- **State Management**: Redux Toolkit
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **API Integration**: Rista POS APIs with Swagger Codegen
- **Security**: bcryptjs for password hashing, JWT for Rista API

---

## 📋 Prerequisites

- Node.js 20+ and npm
- MongoDB database (local or MongoDB Atlas)
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
# Rista API Configuration
RISTA_API_KEY=your_api_key_here
RISTA_SECRET_KEY=your_secret_key_here
RISTA_BASE_URL=https://api.ristaapps.com/v1

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
# Or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB=wf-sales-dashboard

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_generate_with_openssl_rand_base64_32
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

**First Time Setup:**
1. Click "Don't have an account? Sign up" on the login page
2. Create your account with email, password, and name
3. You'll be automatically logged in and redirected to the dashboard

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
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth API route
│   │   │   └── signup/route.ts         # User registration
│   │   ├── dashboard/branch/route.ts   # Unified dashboard API
│   │   └── branches/route.ts           # Branch list API
│   ├── dashboard/page.tsx              # Protected dashboard UI
│   ├── layout.tsx                      # Root layout with Redux & Auth
│   ├── SessionProvider.tsx             # NextAuth session wrapper
│   └── page.tsx                        # Login/Signup page
├── api/                                # Orval-generated REST clients & schemas
├── lib/
│   ├── jwt.ts                          # JWT generator for Rista API (HS256)
│   ├── ristaClient.ts                  # Rista API client wrapper
│   └── mongodb.ts                      # MongoDB connection utility
├── services/
│   ├── salesSummary.service.ts         # Sales summary analytics
│   ├── salesPage.service.ts            # Paginated sales fetching
│   ├── paymentAnalytics.service.ts     # Payment breakdown
│   └── itemAnalytics.service.ts        # Item & time analytics
├── store/
│   ├── index.ts                        # Redux store config
│   ├── dashboardSlice.ts               # Dashboard state slice
│   ├── hooks.ts                        # Typed Redux hooks
│   └── ReduxProvider.tsx               # Client-side provider
└── types/
    ├── dashboard.ts                    # Dashboard TypeScript interfaces
    └── next-auth.d.ts                  # NextAuth type extensions
```

---

## 🔐 Security

### Core Principles

1. **Password Security**: User passwords hashed with bcryptjs (12 rounds) before storage
2. **Session Management**: JWT-based sessions with NextAuth.js
3. **Protected Routes**: Dashboard requires authentication, automatic redirect if not logged in
4. **Never expose API keys to browser**: All Rista API calls go through backend API routes
5. **Server-side JWT generation**: Rista API tokens generated using HS256 algorithm on server only
6. **Environment variables**: Sensitive data stored in `.env.local` (never committed)

### Authentication Implementation

- **NextAuth.js**: Industry-standard authentication for Next.js
- **Provider**: Credentials provider with MongoDB
- **Session Strategy**: JWT-based stateless sessions
- **Password Hashing**: bcryptjs with 12 salt rounds

### Rista API JWT Implementation

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
- `period` (optional): Day, Week, Month, Year, or Custom
- `startDate` (optional): Start date for custom range
- `endDate` (optional): End date for custom range

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

### Branch Comparison API

**GET** `/api/dashboard/compare`

Query Parameters:
- `branches` (required): Comma-separated branch IDs (e.g., BR001,BR002,BR003)
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

Validation:
- Minimum 1 branch, maximum 10 branches
- Date range must be 1-7 days (maximum 1 week)

Response:
```json
{
  "comparison": [
    {
      "branchId": "BR001",
      "data": {
        "summary": { ... },
        "payments": { ... },
        "channels": { ... },
        "ordersByHour": [...],
        "ordersByWeekday": [...],
        "topItem": { ... },
        "topItems": [...]
      }
    },
    {
      "branchId": "BR002",
      "data": { ... }
    }
  ],
  "dateRange": {
    "start": "2024-01-20",
    "end": "2024-01-26",
    "days": 7
  }
}
```

---

## 🔐 Authentication

The dashboard uses **NextAuth.js** with MongoDB for secure user authentication:

### Features
- **Secure Password Storage**: Passwords are hashed using bcryptjs before storing
- **JWT Sessions**: Session management using JSON Web Tokens
- **Protected Routes**: Dashboard is only accessible to authenticated users
- **Auto-redirect**: Unauthenticated users are redirected to login

### User Management
- Sign up with email, password, and name
- Sign in with email and password
- Automatic session handling
- Sign out functionality in dashboard header

### Database Schema
Users are stored in MongoDB with the following structure:
```typescript
{
  _id: ObjectId,
  email: string,        // Unique, lowercase
  password: string,     // Hashed with bcryptjs
  name: string,
  createdAt: Date
}
```

---

## 🎨 UI Components

### Authentication Pages
1. **Login/Signup Page**: Unified form with toggle between login and signup modes
2. **Form Validation**: Client-side validation for email format and password length

### Dashboard Features

1. **Protected Access**: Requires authentication to view
2. **User Display**: Shows logged-in user's name/email in header
3. **Sign Out**: Logout button in dashboard header
4. **Branch Selector**: Dropdown to select branch (BR001, BR002, BR003)
5. **Date Picker**: Choose date for analytics
6. **Tabbed Interface**: Three organized tabs for better navigation
   - **Overview Tab**: KPI cards, weekly performance, payment breakdown
   - **Metrics Tab**: Hourly revenue trends and order analytics
   - **Highlights Tab**: Top sellers and performance highlights
7. **Branch Comparison Mode**: 
   - Toggle to comparison mode with "Compare Branches" button
   - Multi-select branches with checkboxes
   - "Select All" / "Deselect All" option
   - Date range picker (1 day to 1 week)
   - Visual comparison with tables and charts
   - Revenue and orders comparison visualizations
8. **API Caching**: 
   - Automatic caching of API responses (5-minute TTL)
   - Faster data retrieval for repeated queries
   - Reduced API load and improved performance
9. **Disabled States**: All filters disabled during data loading to prevent race conditions
10. **Responsive Layout**: Optimized width with reduced side padding for better space utilization

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

This project uses [Orval](https://orval.dev/) to generate TypeScript types and API functions from the Rista POS API Swagger/OpenAPI specification.

**Configuration**: `orval.config.js`

The configuration is set up to use the **live Rista API Swagger endpoint** (`https://ristaapps.com/api/documentation/swagger.json`) to ensure types are always up-to-date with the latest API changes.

#### Option 1: Use Remote Swagger Endpoint (Recommended)

When the Rista Swagger endpoint is accessible from your environment:

1. Update `orval.config.js`:
   ```javascript
   input: 'https://ristaapps.com/api/documentation/swagger.json',
   ```

2. Run code generation:
   ```bash
   npm run codegen
   ```

This ensures you always have the latest API types and endpoints from Rista.

#### Option 2: Use Local Swagger File

If the remote endpoint is not accessible (network restrictions, offline development):

1. Fetch the latest swagger file:
   ```bash
   npm run fetch-swagger
   # Or manually:
   curl -o swagger.json https://ristaapps.com/api/documentation/swagger.json
   ```

2. Update `orval.config.js` (if needed):
   ```javascript
   input: './swagger.json',  // Local file
   ```

3. Run code generation:
   ```bash
   npm run codegen
   ```

**Generated files**:
- `src/api/analytics/analytics.ts` - Analytics endpoints (`getAnalyticsSalesSummary`, ...)
- `src/api/business/business.ts` - Branch & outlet endpoints (`getBranchList`, ...)
- `src/api/sale/sale.ts` - Sales endpoints (`getSalesPage`, ...)
- `src/api/ristaPlatformAPI.schemas.ts` - Shared TypeScript interfaces (Branch, Sale, SalesSummary, etc.)

**Output Configuration**:
- **Client**: Axios with custom instance for authentication
- **Mode**: Tags split (one file per OpenAPI tag under `src/api`)
- **Clean**: Automatically removes old generated files

The custom Axios instance (`src/lib/ristaClient.ts`) automatically injects authentication headers (x-api-key, x-api-token) for all API calls.

---

## 📦 Dependencies

### Production
- `next` - React framework
- `react`, `react-dom` - UI library
- `next-auth` - Authentication for Next.js
- `mongodb` - MongoDB database driver
- `bcryptjs` - Password hashing
- `@reduxjs/toolkit` - State management
- `react-redux` - Redux bindings
- `recharts` - Data visualization
- `axios` - HTTP client
- `jsonwebtoken` - JWT generation for Rista API

### Development
- `typescript` - Type safety
- `@types/bcryptjs` - TypeScript types for bcryptjs
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

