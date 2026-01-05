import { Sale as RistaSale } from '../generated/rista/models';

/**
 * Compute item analytics from sales data
 * Finds the most sold item by aggregating quantities
 */
export function computeTopItem(sales: RistaSale[]): { name: string; qty: number } {
  const itemMap = new Map<string, number>();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      // Use shortName or longName from Rista API
      const itemName = item.shortName || item.longName || 'Unknown Item';
      const currentQty = itemMap.get(itemName) || 0;
      itemMap.set(itemName, currentQty + (item.quantity || 0));
    }
  }

  let topItemName = '';
  let topItemQty = 0;

  for (const [name, qty] of itemMap.entries()) {
    if (qty > topItemQty) {
      topItemName = name;
      topItemQty = qty;
    }
  }

  return {
    name: topItemName || 'N/A',
    qty: topItemQty,
  };
}

/**
 * Compute orders by hour (0-23)
 */
export function computeOrdersByHour(sales: RistaSale[]): number[] {
  const hourlyOrders = new Array(24).fill(0);

  for (const sale of sales) {
    // Use invoiceDate or createdDate from Rista Sale model
    const date = new Date(sale.invoiceDate || sale.createdDate || '');
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
    const date = new Date(sale.invoiceDate || sale.createdDate || '');
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
