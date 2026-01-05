import { createRistaClient } from '../lib/ristaClient';
import { SalesSummary } from '../types/dashboard';

/**
 * Fetch sales summary from Rista API
 * Endpoint: GET /analytics/sales/summary
 */
export async function getSalesSummary(
  branch: string,
  date: string
): Promise<SalesSummary> {
  const client = createRistaClient();

  try {
    const response = await client.analytics.salesSummaryList({
      branch,
      date,
    });

    return {
      totalSales: response.data.totalSales || 0,
      totalOrders: response.data.totalOrders || 0,
      totalTax: response.data.totalTax || 0,
      totalDiscount: response.data.totalDiscount || 0,
    };
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    // Return default values on error
    return {
      totalSales: 0,
      totalOrders: 0,
      totalTax: 0,
      totalDiscount: 0,
    };
  }
}
