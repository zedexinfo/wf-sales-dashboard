export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  totalTax: number;
  totalDiscount: number;
}

export interface PaymentAnalytics {
  cash: number;
  upi: number;
  card: number;
  cashInflow: number;
}

export interface TopItem {
  name: string;
  qty: number;
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

export interface DashboardData {
  summary: SalesSummary;
  payments: PaymentAnalytics;
  ordersByHour: number[];
  ordersByWeekday: number[];
  topItem: TopItem;
}

export interface DashboardState {
  branch: string;
  date: string;
  data: DashboardData | null;
  branches: Branch[];
  branchesLoading: boolean;
  loading: boolean;
  error: string | null;
}
