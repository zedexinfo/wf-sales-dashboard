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
      period: date, // Rista API uses 'period' parameter for date
    });

    // Map Rista API fields to our dashboard types
    return {
      totalSales: response.data.netAmount || response.data.grossAmount || 0,
      totalOrders: response.data.noOfSales || 0,
      totalTax: response.data.taxTotal || 0,
      totalDiscount: response.data.discountTotal || 0,
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
