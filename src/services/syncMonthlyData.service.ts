import { getDatabase } from "../lib/mongodb";
import { MonthlyDataDocument, SyncResult } from "../types/dashboard";
import { getBranches } from "./branches.service";
import { getSalesSummary } from "./salesSummary.service";

const BATCH_SIZE = 3;

export async function syncMonthlyDataForBranch(
  branchId: string,
  branchName: string,
  year: number,
  month: number,
  syncSource: "cron" | "manual"
): Promise<MonthlyDataDocument> {
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const { summary, payments } = await getSalesSummary(branchId, period);

  const doc: MonthlyDataDocument = {
    branchId,
    branchName,
    year,
    month,
    summary,
    payments,
    syncedAt: new Date(),
    syncSource,
  };

  const db = await getDatabase();
  await db.collection("monthly_data").updateOne(
    { branchId, year, month },
    { $set: doc },
    { upsert: true }
  );

  return doc;
}

export async function syncAllBranchesForMonth(
  year: number,
  month: number,
  syncSource: "cron" | "manual"
): Promise<{ synced: number; failed: number; results: SyncResult[] }> {
  const branches = await getBranches();
  const results: SyncResult[] = [];

  for (let i = 0; i < branches.length; i += BATCH_SIZE) {
    const batch = branches.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (branch) => {
        try {
          await syncMonthlyDataForBranch(branch.id, branch.name, year, month, syncSource);
          return { branchId: branch.id, branchName: branch.name, success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Failed to sync branch ${branch.id}:`, error);
          return { branchId: branch.id, branchName: branch.name, success: false, error: message };
        }
      })
    );
    results.push(...batchResults);
  }

  const synced = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  return { synced, failed, results };
}
