import { Sale } from './salesPage.service';
import { PaymentAnalytics } from '../types/dashboard';

/**
 * Compute payment analytics from sales data
 * Categorizes payments by: Cash, UPI (via subMode), Card, and total cash inflow
 */
export function computePaymentAnalytics(sales: Sale[]): PaymentAnalytics {
  let cash = 0;
  let upi = 0;
  let card = 0;

  for (const sale of sales) {
    const amount = sale.total || 0;
    const paymentMode = (sale.paymentMode || '').toLowerCase();
    const subMode = (sale.subMode || '').toLowerCase();

    if (paymentMode === 'cash') {
      cash += amount;
    } else if (paymentMode === 'card' || subMode.includes('card')) {
      card += amount;
    } else if (subMode.includes('upi') || paymentMode === 'upi') {
      upi += amount;
    } else if (paymentMode === 'digital' || paymentMode === 'online') {
      // Categorize digital payments based on subMode
      if (subMode.includes('upi')) {
        upi += amount;
      } else {
        card += amount;
      }
    }
  }

  return {
    cash,
    upi,
    card,
    cashInflow: cash, // Cash inflow is total cash payments
  };
}
