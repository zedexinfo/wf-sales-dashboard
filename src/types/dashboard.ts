export type DashboardPeriod = "Day" | "Week" | "Month" | "Year" | "Custom";

export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  totalTax: number;
  totalDiscount: number;
}

export interface PaymentAnalytics {
  // Dynamic payment modes - can include Cash, UPI, Card, etc.
  [mode: string]: number;
}

export interface ChannelAnalytics {
  // Dynamic channels - can include Dine-in, Takeaway, Zomato, Swiggy, DotPe, Magicpin, etc.
  [channel: string]: number;
}

export interface TopItem {
  name: string;
  qty: number;
}

export interface TopItemDetail extends TopItem {
  revenue: number;
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

export interface DashboardData {
  summary: SalesSummary;
  payments: PaymentAnalytics;
  channels: ChannelAnalytics;
  ordersByHour: number[];
  ordersByWeekday: number[];
  topItem: TopItem;
  topItems: TopItemDetail[];
}

export interface BranchComparisonData {
  branchId: string;
  branchName: string;
  data: DashboardData;
}

export interface MonthlyDataDocument {
  branchId: string;
  branchName: string;
  year: number;
  month: number;
  summary: SalesSummary;
  payments: PaymentAnalytics;
  syncedAt: Date;
  syncSource: "cron" | "manual";
}

export interface SyncResult {
  branchId: string;
  branchName: string;
  success: boolean;
  error?: string;
}

export interface DashboardState {
  branch: string;
  date: string;
  data: DashboardData | null;
  branches: Branch[];
  branchesLoading: boolean;
  loading: boolean;
  error: string | null;
  // Comparison mode
  comparisonMode: boolean;
  selectedBranches: string[];
  comparisonData: BranchComparisonData[] | null;
  comparisonLoading: boolean;
  comparisonError: string | null;
}
