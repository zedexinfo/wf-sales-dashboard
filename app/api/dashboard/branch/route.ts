import {
  computeOrdersByHour,
  computeOrdersByWeekday,
  computeTopItems,
} from "@/src/services/itemAnalytics.service";
import type { Sale } from "@/src/services/salesPage.service";
import { getAllSales } from "@/src/services/salesPage.service";
import { getSalesSummary } from "@/src/services/salesSummary.service";
import { 
  computePaymentAnalytics,
  computeChannelAnalytics 
} from "@/src/services/paymentAnalytics.service";
import {
  DashboardData,
  DashboardPeriod,
  PaymentAnalytics,
  ChannelAnalytics,
  SalesSummary,
} from "@/src/types/dashboard";
import { NextRequest, NextResponse } from "next/server";

const PERIOD_LOOKUP: Record<string, DashboardPeriod> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  custom: "Custom",
};

const ZERO_SUMMARY: SalesSummary = {
  totalSales: 0,
  totalOrders: 0,
  totalTax: 0,
  totalDiscount: 0,
};

const ZERO_PAYMENTS: PaymentAnalytics = {};

const ZERO_CHANNELS: ChannelAnalytics = {};

const MAX_RANGE_DAYS = 366;
const SALES_FETCH_CONCURRENCY = 4;

function parsePeriod(value: string | null): DashboardPeriod {
  if (!value) {
    return "Day";
  }

  const period = PERIOD_LOOKUP[value.toLowerCase()];
  return period || "Day";
}

function parseDateParts(dateStr: string): Date | null {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function enumerateRange(start: Date, end: Date): string[] {
  if (start > end) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function enforceRangeLimit(length: number) {
  if (length > MAX_RANGE_DAYS) {
    throw new Error(
      `Selected range spans ${length} days, exceeding the ${MAX_RANGE_DAYS}-day limit. Please choose a smaller window.`
    );
  }
}

function buildDateRange({
  period,
  anchorDate,
  startDate,
  endDate,
}: {
  period: DashboardPeriod;
  anchorDate?: string;
  startDate?: string;
  endDate?: string;
}): string[] {
  if (period === "Custom") {
    if (!startDate || !endDate) {
      throw new Error("startDate and endDate are required for custom ranges.");
    }

    const rangeStart = parseDateParts(startDate);
    const rangeEnd = parseDateParts(endDate);

    if (!rangeStart || !rangeEnd) {
      throw new Error("Invalid custom range. Expected YYYY-MM-DD.");
    }

    if (rangeStart > rangeEnd) {
      throw new Error("startDate must be earlier than endDate.");
    }

    const dates = enumerateRange(rangeStart, rangeEnd);
    enforceRangeLimit(dates.length);
    return dates;
  }

  if (!anchorDate) {
    throw new Error("date query parameter is required for this period.");
  }

  const parsedDate = parseDateParts(anchorDate);

  if (!parsedDate) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  let dates: string[] = [];

  switch (period) {
    case "Day":
      dates = [formatDate(parsedDate)];
      break;
    case "Week": {
      const weekStart = new Date(parsedDate);
      weekStart.setDate(parsedDate.getDate() - 6);
      dates = enumerateRange(weekStart, parsedDate);
      break;
    }
    case "Month": {
      const startOfMonth = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth() + 1,
        0
      );
      dates = enumerateRange(startOfMonth, endOfMonth);
      break;
    }
    case "Year": {
      const startOfYear = new Date(parsedDate.getFullYear(), 0, 1);
      const endOfYear = new Date(parsedDate.getFullYear(), 11, 31);
      dates = enumerateRange(startOfYear, endOfYear);
      break;
    }
    default:
      dates = [formatDate(parsedDate)];
  }

  enforceRangeLimit(dates.length);
  return dates;
}

async function aggregateRangeData(
  branch: string,
  dateRange: string[],
  summary: SalesSummary,
  salesBucket: Sale[]
) {
  let cursor = 0;
  const workerCount = Math.max(
    1,
    Math.min(SALES_FETCH_CONCURRENCY, dateRange.length)
  );

  const worker = async () => {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;

      if (currentIndex >= dateRange.length) {
        break;
      }

      const day = dateRange[currentIndex];
      const [{ summary: daySummary }, daySales] =
        await Promise.all([
          getSalesSummary(branch, day),
          getAllSales(branch, day),
        ]);

      summary.totalSales += daySummary.totalSales;
      summary.totalOrders += daySummary.totalOrders;
      summary.totalTax += daySummary.totalTax;
      summary.totalDiscount += daySummary.totalDiscount;

      salesBucket.push(...daySales);
    }
  };

  await Promise.all(Array.from({ length: workerCount }).map(() => worker()));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get("branch");
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const period = parsePeriod(searchParams.get("period"));

  if (!branch) {
    return NextResponse.json(
      { error: "branch query parameter is required" },
      { status: 400 }
    );
  }

  if (period === "Custom") {
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required for custom ranges" },
        { status: 400 }
      );
    }
  } else if (!date) {
    return NextResponse.json(
      { error: "date query parameter is required" },
      { status: 400 }
    );
  }

  let dateRange: string[];
  try {
    dateRange = buildDateRange({
      period,
      anchorDate: date ?? undefined,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    });
  } catch (rangeError) {
    return NextResponse.json(
      {
        error:
          rangeError instanceof Error
            ? rangeError.message
            : "Invalid date parameters.",
      },
      { status: 400 }
    );
  }

  try {
    const aggregatedSummary: SalesSummary = { ...ZERO_SUMMARY };
    const aggregatedSales: Sale[] = [];

    await aggregateRangeData(
      branch,
      dateRange,
      aggregatedSummary,
      aggregatedSales
    );

    // Compute payment and channel analytics from all sales
    const aggregatedPayments = computePaymentAnalytics(aggregatedSales);
    const aggregatedChannels = computeChannelAnalytics(aggregatedSales);

    const topItems = computeTopItems(aggregatedSales, 10);
    const bestSeller = topItems[0] ?? { name: "N/A", qty: 0, revenue: 0 };

    const dashboardData: DashboardData = {
      summary: aggregatedSummary,
      payments: aggregatedPayments,
      channels: aggregatedChannels,
      ordersByHour: computeOrdersByHour(aggregatedSales),
      ordersByWeekday: computeOrdersByWeekday(aggregatedSales),
      topItem: { name: bestSeller.name, qty: bestSeller.qty },
      topItems,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
