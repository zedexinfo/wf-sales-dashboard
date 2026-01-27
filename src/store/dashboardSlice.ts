import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Branch,
  BranchComparisonData,
  DashboardData,
  DashboardPeriod,
  DashboardState,
} from "../types/dashboard";

// Helper function to get today's date in user's local timezone
function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial state
const initialState: DashboardState = {
  branch: "",
  date: getTodayLocalDate(), // Today's date in user's local timezone
  data: null,
  branches: [],
  branchesLoading: false,
  loading: false,
  error: null,
  comparisonMode: false,
  selectedBranches: [],
  comparisonData: null,
  comparisonLoading: false,
  comparisonError: null,
};

// Async thunk to fetch branches
export const fetchBranches = createAsyncThunk(
  "dashboard/fetchBranches",
  async () => {
    const response = await fetch("/api/branches");

    if (!response.ok) {
      throw new Error("Failed to fetch branches");
    }

    const data: { branches: Branch[] } = await response.json();
    return data.branches;
  }
);

// Async thunk to fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async ({
    branch,
    date,
    period,
    customRange,
  }: {
    branch: string;
    date: string;
    period: DashboardPeriod;
    customRange?: { start: string; end: string };
  }) => {
    const query = new URLSearchParams({ branch, period });

    if (period === "Custom") {
      if (customRange?.start) {
        query.set("startDate", customRange.start);
      }
      if (customRange?.end) {
        query.set("endDate", customRange.end);
      }
    } else {
      query.set("date", date);
    }

    const response = await fetch(`/api/dashboard/branch?${query.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const data: DashboardData = await response.json();
    return data;
  }
);

// Async thunk to fetch branch comparison data
export const fetchBranchComparison = createAsyncThunk(
  "dashboard/fetchComparison",
  async ({
    branches,
    startDate,
    endDate,
    branchNames,
  }: {
    branches: string[];
    startDate: string;
    endDate: string;
    branchNames: Record<string, string>;
  }) => {
    const branchesParam = branches.join(",");
    const query = new URLSearchParams({
      branches: branchesParam,
      startDate,
      endDate,
    });

    const response = await fetch(`/api/dashboard/compare?${query.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to fetch comparison data" }));
      throw new Error(errorData.error || "Failed to fetch comparison data");
    }

    const data = await response.json();
    
    // Map branch IDs to names
    const comparison: BranchComparisonData[] = data.comparison.map((item: { branchId: string; data: DashboardData }) => ({
      branchId: item.branchId,
      branchName: branchNames[item.branchId] || item.branchId,
      data: item.data,
    }));

    return comparison;
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setBranch: (state, action: PayloadAction<string>) => {
      state.branch = action.payload;
    },
    setDate: (state, action: PayloadAction<string>) => {
      state.date = action.payload;
    },
    setComparisonMode: (state, action: PayloadAction<boolean>) => {
      state.comparisonMode = action.payload;
      if (!action.payload) {
        // Clear comparison data when exiting comparison mode
        state.selectedBranches = [];
        state.comparisonData = null;
        state.comparisonError = null;
      }
    },
    toggleBranchSelection: (state, action: PayloadAction<string>) => {
      const branchId = action.payload;
      const index = state.selectedBranches.indexOf(branchId);
      if (index >= 0) {
        state.selectedBranches.splice(index, 1);
      } else {
        state.selectedBranches.push(branchId);
      }
    },
    setSelectedBranches: (state, action: PayloadAction<string[]>) => {
      state.selectedBranches = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch branches
      .addCase(fetchBranches.pending, (state) => {
        state.branchesLoading = true;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.branchesLoading = false;
        state.branches = action.payload;
        // Set first branch as default if not set
        if (!state.branch && action.payload.length > 0) {
          state.branch = action.payload[0].id;
        }
      })
      .addCase(fetchBranches.rejected, (state) => {
        state.branchesLoading = false;
      })
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      })
      // Fetch branch comparison
      .addCase(fetchBranchComparison.pending, (state) => {
        state.comparisonLoading = true;
        state.comparisonError = null;
      })
      .addCase(fetchBranchComparison.fulfilled, (state, action) => {
        state.comparisonLoading = false;
        state.comparisonData = action.payload;
      })
      .addCase(fetchBranchComparison.rejected, (state, action) => {
        state.comparisonLoading = false;
        state.comparisonError = action.error.message || "Failed to fetch comparison data";
      });
  },
});

export const { 
  setBranch, 
  setDate, 
  setComparisonMode, 
  toggleBranchSelection, 
  setSelectedBranches 
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
