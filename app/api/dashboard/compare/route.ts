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
import { apiCache, withCache } from "@/src/lib/cache";
import {
  DashboardData,
  SalesSummary,
} from "@/src/types/dashboard";
import { NextRequest, NextResponse } from "next/server";

const ZERO_SUMMARY: SalesSummary = {
  totalSales: 0,
  totalOrders: 0,
  totalTax: 0,
  totalDiscount: 0,
};

const MAX_COMPARISON_DAYS = 7; // Limit to 1 week
const MAX_BRANCHES = 10; // Reasonable limit for comparison

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

async function fetchBranchData(
  branch: string,
  dateRange: string[]
): Promise<DashboardData> {
  const cacheKey = apiCache.constructor.name === 'InMemoryCache' 
    ? `branch:${branch}:dates:${dateRange.join(',')}` 
    : '';

  return withCache(cacheKey, async () => {
    const aggregatedSummary: SalesSummary = { ...ZERO_SUMMARY };
    const aggregatedSales: Sale[] = [];

    // Fetch data for each date in the range
    for (const day of dateRange) {
      const [{ summary: daySummary }, daySales] = await Promise.all([
        getSalesSummary(branch, day),
        getAllSales(branch, day),
      ]);

      aggregatedSummary.totalSales += daySummary.totalSales;
      aggregatedSummary.totalOrders += daySummary.totalOrders;
      aggregatedSummary.totalTax += daySummary.totalTax;
      aggregatedSummary.totalDiscount += daySummary.totalDiscount;

      aggregatedSales.push(...daySales);
    }

    // Compute analytics from all sales
    const aggregatedPayments = computePaymentAnalytics(aggregatedSales);
    const aggregatedChannels = computeChannelAnalytics(aggregatedSales);

    const topItems = computeTopItems(aggregatedSales, 10);
    const bestSeller = topItems[0] ?? { name: "N/A", qty: 0, revenue: 0 };

    return {
      summary: aggregatedSummary,
      payments: aggregatedPayments,
      channels: aggregatedChannels,
      ordersByHour: computeOrdersByHour(aggregatedSales),
      ordersByWeekday: computeOrdersByWeekday(aggregatedSales),
      topItem: { name: bestSeller.name, qty: bestSeller.qty },
      topItems,
    };
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const branchesParam = searchParams.get("branches");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Validate required parameters
  if (!branchesParam) {
    return NextResponse.json(
      { error: "branches query parameter is required (comma-separated branch IDs)" },
      { status: 400 }
    );
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required for comparison" },
      { status: 400 }
    );
  }

  // Parse branches
  const branches = branchesParam.split(",").filter(b => b.trim());
  
  if (branches.length === 0) {
    return NextResponse.json(
      { error: "At least one branch must be specified" },
      { status: 400 }
    );
  }

  if (branches.length > MAX_BRANCHES) {
    return NextResponse.json(
      { error: `Cannot compare more than ${MAX_BRANCHES} branches at once` },
      { status: 400 }
    );
  }

  // Parse and validate date range
  const rangeStart = parseDateParts(startDate);
  const rangeEnd = parseDateParts(endDate);

  if (!rangeStart || !rangeEnd) {
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (rangeStart > rangeEnd) {
    return NextResponse.json(
      { error: "startDate must be earlier than or equal to endDate." },
      { status: 400 }
    );
  }

  const dateRange = enumerateRange(rangeStart, rangeEnd);

  // Enforce date range limit (1 day to 1 week)
  if (dateRange.length > MAX_COMPARISON_DAYS) {
    return NextResponse.json(
      {
        error: `Comparison range limited to ${MAX_COMPARISON_DAYS} days. Selected range spans ${dateRange.length} days.`
      },
      { status: 400 }
    );
  }

  try {
    // Fetch data for all branches in parallel
    const branchDataPromises = branches.map(async (branchId) => {
      const data = await fetchBranchData(branchId, dateRange);
      return {
        branchId: branchId.trim(),
        data,
      };
    });

    const results = await Promise.all(branchDataPromises);

    return NextResponse.json({
      comparison: results,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange.length,
      },
    });
  } catch (error) {
    console.error("Error fetching branch comparison data:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch comparison data" },
      { status: 500 }
    );
  }
}
