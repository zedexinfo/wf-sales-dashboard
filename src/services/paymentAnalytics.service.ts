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

  for (const sale of sales) {
    // Iterate through payments array from Rista Sale model
    for (const payment of sale.payments || []) {
      const amount = payment.amount || 0;
      const paymentMode = (payment.mode || "").toLowerCase();
      const subMode = (payment.subMode || "").toLowerCase();

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
  };
}

const PAYMENT_MODE_KEYWORDS = {
  cash: ["cash"],
  upi: ["upi", "paytm", "phonepe", "gpay", "google", "bharatpe", "tez"],
};

const ZERO_PAYMENT_ANALYTICS: PaymentAnalytics = {
  cash: 0,
  upi: 0,
  card: 0,
  cashInflow: 0,
};

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
 */
export function computePaymentAnalyticsFromSummary(
  payments?: SalesSummaryPaymentsItem[]
): PaymentAnalytics {
  if (!payments?.length) {
    return { ...ZERO_PAYMENT_ANALYTICS };
  }

  let cash = 0;
  let upi = 0;
  let card = 0;

  for (const payment of payments) {
    const amount = payment.amount || 0;
    const bucket = categorizeSummaryPayment(payment.mode);

    if (bucket === "cash") {
      cash += amount;
    } else if (bucket === "upi") {
      upi += amount;
    } else {
      card += amount;
    }
  }

  return {
    cash,
    upi,
    card,
    cashInflow: cash,
  };
}
