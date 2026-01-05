import { createRistaClient } from "../lib/ristaClient";

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

/**
 * Fetch all branches from Rista API
 * Endpoint: GET /branches
 */
export async function getBranches(): Promise<Branch[]> {
  const client = createRistaClient();

  try {
    const response = await client.branches.branchesList();
    const branches = (response.data || []) as Branch[];
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    // Return empty array on error
    return [];
  }
}
