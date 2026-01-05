import { Sale as RistaSale } from "../api/ristaPlatformAPI.schemas";
import { getSale } from "../api/sale/sale";

const saleAPI = getSale();

type GeneratedSale = RistaSale;

export type Sale = GeneratedSale;

export type SaleItem = GeneratedSale extends { items: Array<infer Item> }
  ? Item
  : never;

/**
 * Fetch all sales for a given date and branch using pagination
 * Endpoint: GET /sales/page
 * Loops until lastKey is null
 */
export async function getAllSales(
  branch: string,
  day: string
): Promise<Sale[]> {
  const allSales: Sale[] = [];
  let lastKey: string | undefined = undefined;

  try {
    do {
      const { data: salesPageData } = await saleAPI.getSalesPage({
        branch,
        day,
        ...(lastKey && { lastKey }),
      });

      const sales: Sale[] = salesPageData.data ?? [];
      allSales.push(...sales);

      lastKey = salesPageData.lastKey || undefined;
    } while (lastKey);

    return allSales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}
