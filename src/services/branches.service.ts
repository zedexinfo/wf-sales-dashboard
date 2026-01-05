import type { Branch as RistaBranch, BranchListResult } from '../generated/rista/models';
import { getRistaPlatformAPI } from '../generated/rista/ristaApi';

const ristaAPI = getRistaPlatformAPI();

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

/**
 * Fetch all branches from Rista API
 * Endpoint: GET /branch/list
 */
export async function getBranches(): Promise<Branch[]> {
  try {
    const response: BranchListResult = await ristaAPI.getBranchList();
    
    // Map Rista Branch model to our dashboard Branch interface
    return (response || []).map((ristaBranch: RistaBranch) => ({
      id: ristaBranch.branchCode,
      name: ristaBranch.branchName,
      location: ristaBranch.address?.city || ristaBranch.address?.state || undefined,
    }));
  } catch (error) {
    console.error('Error fetching branches:', error);
    // Return empty array on error
    return [];
  }
}
