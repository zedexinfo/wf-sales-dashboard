import { createRistaClient } from '../lib/ristaClient';

export interface Sale {
  id: string;
  branch: string;
  date: string;
  total: number;
  tax: number;
  discount: number;
  paymentMode: string;
  subMode?: string;
  items: SaleItem[];
}

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Fetch all sales for a given date and branch using pagination
 * Endpoint: GET /sales/page
 * Loops until lastKey is null
 */
export async function getAllSales(branch: string, date: string): Promise<Sale[]> {
  const client = createRistaClient();
  const allSales: Sale[] = [];
  let lastKey: string | undefined = undefined;

  try {
    do {
      const response = await client.sales.pageList({
        branch,
        date,
        ...(lastKey && { lastKey }),
      });

      const sales = (response.data.sales || []) as Sale[];
      allSales.push(...sales);

      lastKey = response.data.lastKey || undefined;
    } while (lastKey);

    return allSales;
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}
