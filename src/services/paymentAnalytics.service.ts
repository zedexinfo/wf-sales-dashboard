import { Sale as RistaSale } from '../generated/rista/models';
import { PaymentAnalytics } from '../types/dashboard';

/**
 * Compute payment analytics from sales data
 * Categorizes payments by: Cash, UPI (via subMode), Card, and total cash inflow
 */
export function computePaymentAnalytics(sales: RistaSale[]): PaymentAnalytics {
  let cash = 0;
  let upi = 0;
  let card = 0;

  for (const sale of sales) {
    // Iterate through payments array from Rista Sale model
    for (const payment of sale.payments || []) {
      const amount = payment.amount || 0;
      const paymentMode = (payment.mode || '').toLowerCase();
      const subMode = (payment.subMode || '').toLowerCase();

      if (paymentMode === 'cash' || paymentMode.includes('cash')) {
        cash += amount;
      } else if (paymentMode === 'card' || subMode.includes('card') || paymentMode.includes('card')) {
        card += amount;
      } else if (subMode.includes('upi') || paymentMode === 'upi' || paymentMode.includes('upi')) {
        upi += amount;
      } else if (paymentMode === 'digital' || paymentMode === 'online' || paymentMode.includes('digital')) {
        // Categorize digital payments based on subMode
        if (subMode.includes('upi')) {
          upi += amount;
        } else if (subMode.includes('card')) {
          card += amount;
        } else {
          // Default digital payment to card
          card += amount;
        }
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
