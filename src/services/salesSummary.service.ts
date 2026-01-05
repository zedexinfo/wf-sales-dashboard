import { getRistaPlatformAPI } from "../generated/rista/ristaApi";
import { SalesSummary } from "../types/dashboard";

const ristaAPI = getRistaPlatformAPI();

/**
 * Fetch sales summary from Rista API
 * Endpoint: GET /analytics/sales/summary
 */
export async function getSalesSummary(
  branch: string,
  date: string
): Promise<SalesSummary> {
  try {
    const response = await ristaAPI.getAnalyticsSalesSummary({
      branch,
      date,
    });

    return {
      totalSales: response.totalSales || 0,
      totalOrders: response.totalOrders || 0,
      totalTax: response.totalTax || 0,
      totalDiscount: response.totalDiscount || 0,
    };
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    // Return default values on error
    return {
      totalSales: 0,
      totalOrders: 0,
      totalTax: 0,
      totalDiscount: 0,
    };
  }
}
