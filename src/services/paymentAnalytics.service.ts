import {
  Sale as RistaSale,
  SalesSummaryPaymentsItem,
} from "../api/ristaPlatformAPI.schemas";
import { PaymentAnalytics, ChannelAnalytics } from "../types/dashboard";

/**
 * Compute payment analytics from sales data
 * Categorizes payments by mode: Cash, UPI, Card, etc.
 * This focuses ONLY on payment methods from the payments array
 */
export function computePaymentAnalytics(sales: RistaSale[]): PaymentAnalytics {
  const paymentModes: { [mode: string]: number } = {};

  for (const sale of sales) {
    // Iterate through payments array from Rista Sale model
    for (const payment of sale.payments || []) {
      const amount = payment.amount || 0;
      const paymentMode = payment.mode || "Unknown";

      // Accumulate by payment mode
      paymentModes[paymentMode] = (paymentModes[paymentMode] || 0) + amount;
    }
  }

  return paymentModes;
}

/**
 * Compute channel analytics from sales data
 * Categorizes sales by channel: Dine-in, Takeaway, Zomato, Swiggy, DotPe, Magicpin, etc.
 * This focuses on the channel field from the sale
 */
export function computeChannelAnalytics(sales: RistaSale[]): ChannelAnalytics {
  const channels: { [channel: string]: number } = {};

  for (const sale of sales) {
    const channel = sale.channel || "Unknown";
    const amount = sale.billRoundedAmount || sale.totalAmount || 0;

    // Accumulate by channel
    channels[channel] = (channels[channel] || 0) + amount;
  }

  return channels;
}

const PAYMENT_MODE_KEYWORDS = {
  cash: ["cash"],
  upi: ["upi", "paytm", "phonepe", "gpay", "google", "bharatpe", "tez"],
};

const ZERO_PAYMENT_ANALYTICS: PaymentAnalytics = {};

function categorizeSummaryPayment(mode?: string) {
  if (!mode) {
    return "card" as const;
  }

  const normalized = mode.toLowerCase();

  if (
    PAYMENT_MODE_KEYWORDS.cash.some((keyword) => normalized.includes(keyword))
  ) {
    return "cash" as const;
  }

  if (
    PAYMENT_MODE_KEYWORDS.upi.some((keyword) => normalized.includes(keyword))
  ) {
    return "upi" as const;
  }

  return "card" as const;
}

/**
 * Convert aggregated payment summary from analytics API to PaymentAnalytics shape.
 * Simply returns all payment modes as-is without categorization.
 */
export function computePaymentAnalyticsFromSummary(
  payments?: SalesSummaryPaymentsItem[]
): PaymentAnalytics {
  if (!payments?.length) {
    return { ...ZERO_PAYMENT_ANALYTICS };
  }

  const result: PaymentAnalytics = {};

  for (const payment of payments) {
    const amount = payment.amount || 0;
    const mode = payment.mode || "Unknown";

    // Add or accumulate the amount for this payment mode
    if (result[mode]) {
      result[mode] += amount;
    } else {
      result[mode] = amount;
    }
  }

  return result;
}
