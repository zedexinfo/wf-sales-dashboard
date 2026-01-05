import { NextRequest, NextResponse } from 'next/server';
import { getSalesSummary } from '@/src/services/salesSummary.service';
import { getAllSales } from '@/src/services/salesPage.service';
import { computePaymentAnalytics } from '@/src/services/paymentAnalytics.service';
import {
  computeTopItem,
  computeOrdersByHour,
  computeOrdersByWeekday,
} from '@/src/services/itemAnalytics.service';
import { DashboardData } from '@/src/types/dashboard';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get('branch');
  const date = searchParams.get('date');

  // Validate input
  if (!branch || !date) {
    return NextResponse.json(
      { error: 'branch and date query parameters are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch sales summary
    const summary = await getSalesSummary(branch, date);

    // Fetch all sales for the date
    const sales = await getAllSales(branch, date);

    // Compute analytics
    const payments = computePaymentAnalytics(sales);
    const topItem = computeTopItem(sales);
    const ordersByHour = computeOrdersByHour(sales);
    const ordersByWeekday = computeOrdersByWeekday(sales);

    const dashboardData: DashboardData = {
      summary,
      payments,
      ordersByHour,
      ordersByWeekday,
      topItem,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
