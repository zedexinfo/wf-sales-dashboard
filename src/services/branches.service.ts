import { getRistaPOSAPI } from '../generated/rista/ristaApi';
import type { Branch } from '../generated/rista/models';

const ristaAPI = getRistaPOSAPI();

/**
 * Fetch all branches from Rista API
 * Endpoint: GET /branches
 */
export async function getBranches(): Promise<Branch[]> {
  try {
    const response = await ristaAPI.getBranches();
    return response.branches || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    // Return empty array on error
    return [];
  }
}

export type { Branch };
