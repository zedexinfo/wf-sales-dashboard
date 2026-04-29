import { NextRequest, NextResponse } from "next/server";
import { syncAllBranchesForMonth } from "../../../../src/services/syncMonthlyData.service";

function validateAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function getPreviousMonth(): { year: number; month: number } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
}

async function handleSync(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let year: number | undefined;
  let month: number | undefined;

  if (request.method === "POST") {
    try {
      const body = await request.json();
      year = body.year ? Number(body.year) : undefined;
      month = body.month ? Number(body.month) : undefined;
    } catch {
      // ignore parse errors, use defaults
    }
  } else {
    const url = new URL(request.url);
    const qYear = url.searchParams.get("year");
    const qMonth = url.searchParams.get("month");
    year = qYear ? Number(qYear) : undefined;
    month = qMonth ? Number(qMonth) : undefined;
  }

  if (!year || !month) {
    const defaults = getPreviousMonth();
    year = defaults.year;
    month = defaults.month;
  }

  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month (1-12)" }, { status: 400 });
  }

  const result = await syncAllBranchesForMonth(year, month, "cron");
  return NextResponse.json({ year, month, ...result });
}

export const GET = handleSync;
export const POST = handleSync;
