import {
  Sale as RistaSale,
  SalesSummaryPaymentsItem,
} from "../api/ristaPlatformAPI.schemas";
import { PaymentAnalytics } from "../types/dashboard";

/**
 * Compute payment analytics from sales data
 * Categorizes payments by: Cash, UPI (via subMode), Card, and total cash inflow
 */
export function computePaymentAnalytics(sales: RistaSale[]): PaymentAnalytics {
  let cash = 0;
  let upi = 0;
  let card = 0;
  let zomato = 0;
  let swiggy = 0;
  let other = 0;

  for (const sale of sales) {
    // Check source platform
    const source = (sale.sourceInfo?.source || "").toLowerCase();
    const channel = (sale.channel || "").toLowerCase();
    const isZomato = source.includes("zomato") || channel.includes("zomato");
    const isSwiggy = source.includes("swiggy") || channel.includes("swiggy");
    const isOnlineOrder = source && source !== "api" && source !== "callcenter" && !source.includes("dine");
    
    // Iterate through payments array from Rista Sale model
    for (const payment of sale.payments || []) {
      const amount = payment.amount || 0;
      const paymentMode = (payment.mode || "").toLowerCase();
      const subMode = (payment.subMode || "").toLowerCase();

      // Categorize by platform first if delivery exists
      if (isZomato) {
        zomato += amount;
      } else if (isSwiggy) {
        swiggy += amount;
      } else if (isOnlineOrder) {
        other += amount;
      }

      // Also categorize by payment type
      if (paymentMode === "cash" || paymentMode.includes("cash")) {
        cash += amount;
      } else if (
        paymentMode === "card" ||
        subMode.includes("card") ||
        paymentMode.includes("card")
      ) {
        card += amount;
      } else if (
        subMode.includes("upi") ||
        paymentMode === "upi" ||
        paymentMode.includes("upi")
      ) {
        upi += amount;
      } else if (
        paymentMode === "digital" ||
        paymentMode === "online" ||
        paymentMode.includes("digital")
      ) {
        // Categorize digital payments based on subMode
        if (subMode.includes("upi")) {
          upi += amount;
        } else if (subMode.includes("card")) {
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
    zomato,
    swiggy,
    other,
  };
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
