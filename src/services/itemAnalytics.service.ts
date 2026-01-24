import { Sale as RistaSale } from "../api/ristaPlatformAPI.schemas";
import { TopItemDetail } from "../types/dashboard";

/**
 * Compute item analytics from sales data
 * Finds the most sold item by aggregating quantities
 */
export function computeTopItem(sales: RistaSale[]): {
  name: string;
  qty: number;
} {
  const [top] = computeTopItems(sales, 1);

  if (!top) {
    return {
      name: "N/A",
      qty: 0,
    };
  }

  return {
    name: top.name,
    qty: top.qty,
  };
}

/**
 * Compute ranked list of top-selling items (quantity driven)
 */
export function computeTopItems(
  sales: RistaSale[],
  limit = 10
): TopItemDetail[] {
  const itemMap = new Map<string, TopItemDetail>();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const itemName = item.shortName || item.longName || "Unknown Item";
      const existing = itemMap.get(itemName) || {
        name: itemName,
        qty: 0,
        revenue: 0,
      };

      existing.qty += item.quantity || 0;
      const revenueContribution =
        item.netAmount ??
        item.itemTotalAmount ??
        item.itemAmount ??
        (item.unitPrice || 0) * (item.quantity || 0);
      existing.revenue += revenueContribution;

      itemMap.set(itemName, existing);
    }
  }

  return Array.from(itemMap.values())
    .sort((a, b) => {
      if (b.qty !== a.qty) {
        return b.qty - a.qty;
      }
      return b.revenue - a.revenue;
    })
    .slice(0, limit);
}

/**
 * Compute orders by hour (0-23)
 */
export function computeOrdersByHour(sales: RistaSale[]): number[] {
  const hourlyOrders = new Array(24).fill(0);

  for (const sale of sales) {
    // Use invoiceDate or createdDate from Rista Sale model
    const date = new Date(sale.invoiceDate || sale.createdDate || "");
    const hour = date.getHours();
    if (hour >= 0 && hour < 24) {
      hourlyOrders[hour]++;
    }
  }

  return hourlyOrders;
}

/**
 * Compute orders by weekday
 * Input: JavaScript Date.getDay() format (0=Sunday, 1=Monday, ..., 6=Saturday)
 * Output: Reordered array [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 */
export function computeOrdersByWeekday(sales: RistaSale[]): number[] {
  const weekdayOrders = new Array(7).fill(0); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

  for (const sale of sales) {
    const date = new Date(sale.invoiceDate || sale.createdDate || "");
    const day = date.getDay(); // 0=Sunday, 6=Saturday
    if (day >= 0 && day < 7) {
      weekdayOrders[day]++;
    }
  }

  // Reorder to [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  return [
    weekdayOrders[1], // Monday
    weekdayOrders[2], // Tuesday
    weekdayOrders[3], // Wednesday
    weekdayOrders[4], // Thursday
    weekdayOrders[5], // Friday
    weekdayOrders[6], // Saturday
    weekdayOrders[0], // Sunday
  ];
}
