import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../../src/lib/mongodb";
import { getBranches } from "../../../../src/services/branches.service";
import { getSalesSummary } from "../../../../src/services/salesSummary.service";
import { MonthlyDataDocument } from "../../../../src/types/dashboard";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  const branchesParam = url.searchParams.get("branches");

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Required params: year (number), month (1-12)" },
      { status: 400 }
    );
  }

  const branchFilter = branchesParam
    ? branchesParam.split(",").map((b) => b.trim()).filter(Boolean)
    : null;

  // Fetch all known branches to resolve names for fallback
  const allBranches = await getBranches();
  const targetBranches = branchFilter
    ? allBranches.filter((b) => branchFilter.includes(b.id))
    : allBranches;

  if (targetBranches.length === 0) {
    return NextResponse.json({ error: "No matching branches found" }, { status: 404 });
  }

  // Load cached documents from MongoDB
  const db = await getDatabase();
  const query: Record<string, unknown> = { year, month };
  if (branchFilter) query.branchId = { $in: branchFilter };

  const cached = await db
    .collection<MonthlyDataDocument>("monthly_data")
    .find(query)
    .toArray();

  const cachedById = new Map(cached.map((d) => [d.branchId, d]));

  // For branches missing from cache, fall back to live Rista API
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const rows: MonthlyDataDocument[] = [];

  await Promise.all(
    targetBranches.map(async (branch) => {
      if (cachedById.has(branch.id)) {
        rows.push(cachedById.get(branch.id)!);
      } else {
        try {
          const { summary, payments } = await getSalesSummary(branch.id, period);
          rows.push({
            branchId: branch.id,
            branchName: branch.name,
            year,
            month,
            summary,
            payments,
            syncedAt: new Date(),
            syncSource: "manual",
          });
        } catch (error) {
          console.error(`Export fallback failed for branch ${branch.id}:`, error);
        }
      }
    })
  );

  // Sort rows by branch name for consistent output
  rows.sort((a, b) => a.branchName.localeCompare(b.branchName));

  const mName = monthName(year, month);
  const header = "Branch,Month,Year,Total Revenue,Total Discount,Total Orders,Total Tax\n";
  const lines = rows.map(
    (r) =>
      [
        escapeCsv(r.branchName),
        mName,
        year,
        Math.round(r.summary.totalSales),
        Math.round(r.summary.totalDiscount),
        r.summary.totalOrders,
        Math.round(r.summary.totalTax),
      ].join(",")
  );

  const csv = header + lines.join("\n") + "\n";
  const filename = `revenue-${year}-${String(month).padStart(2, "0")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
