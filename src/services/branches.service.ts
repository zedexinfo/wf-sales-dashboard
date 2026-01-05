import type { Branch, BranchListResult } from "../generated/rista/models";
import { getRistaPlatformAPI } from "../generated/rista/ristaApi";

const ristaAPI = getRistaPlatformAPI();

/**
 * Fetch all branches from Rista API
 * Endpoint: GET /branches
 */
export async function getBranches(): Promise<BranchListResult> {
  try {
    const response = await ristaAPI.getBranchList();
    return response || [];
  } catch (error) {
    console.error("Error fetching branches:", error);
    // Return empty array on error
    return [];
  }
}

export type { Branch };
