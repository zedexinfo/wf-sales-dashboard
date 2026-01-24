import { getAnalytics } from "../api/analytics/analytics";
import { PaymentAnalytics, SalesSummary } from "../types/dashboard";
import { computePaymentAnalyticsFromSummary } from "./paymentAnalytics.service";

const analyticsAPI = getAnalytics();

const EMPTY_SUMMARY: SalesSummary = {
  totalSales: 0,
  totalOrders: 0,
  totalTax: 0,
  totalDiscount: 0,
};

const EMPTY_PAYMENTS: PaymentAnalytics = {
  cash: 0,
  card: 0,
  upi: 0,
  cashInflow: 0,
  zomato: 0,
  swiggy: 0,
  other: 0,
};

export interface SalesSummaryResult {
  summary: SalesSummary;
  payments: PaymentAnalytics;
}

/**
 * Fetch sales summary from Rista API
 * Endpoint: GET /analytics/sales/summary
 */
export async function getSalesSummary(
  branch: string,
  date: string
): Promise<SalesSummaryResult> {
  try {
    const response = await analyticsAPI.getAnalyticsSalesSummary({
      branch,
      period: date, // Rista API uses 'period' parameter for date
    });

    // Map Rista API fields to our dashboard types
    const summary: SalesSummary = {
      totalSales: response.data.netAmount || response.data.grossAmount || 0,
      totalOrders: response.data.noOfSales || 0,
      totalTax: response.data.taxTotal || 0,
      totalDiscount: response.data.discountTotal || 0,
    };

    const payments = computePaymentAnalyticsFromSummary(response.data.payments);

    return {
      summary,
      payments,
    };
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    // Return default values on error
    return {
      summary: { ...EMPTY_SUMMARY },
      payments: { ...EMPTY_PAYMENTS },
    };
  }
}
