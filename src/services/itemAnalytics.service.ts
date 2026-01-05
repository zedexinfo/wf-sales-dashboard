import { Sale } from './salesPage.service';
import { TopItem } from '../types/dashboard';

/**
 * Compute item analytics from sales data
 * Finds the most sold item by aggregating quantities
 */
export function computeTopItem(sales: Sale[]): TopItem {
  const itemMap = new Map<string, number>();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const currentQty = itemMap.get(item.name) || 0;
      itemMap.set(item.name, currentQty + (item.quantity || 0));
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
export function computeOrdersByHour(sales: Sale[]): number[] {
  const hourlyOrders = new Array(24).fill(0);

  for (const sale of sales) {
    const date = new Date(sale.date);
    const hour = date.getHours();
    if (hour >= 0 && hour < 24) {
      hourlyOrders[hour]++;
    }
  }

  return hourlyOrders;
}

/**
 * Compute orders by weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 * Returns array [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 */
export function computeOrdersByWeekday(sales: Sale[]): number[] {
  const weekdayOrders = new Array(7).fill(0); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

  for (const sale of sales) {
    const date = new Date(sale.date);
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
