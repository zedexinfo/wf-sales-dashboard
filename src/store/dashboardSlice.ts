import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Branch,
  DashboardData,
  DashboardPeriod,
  DashboardState,
} from "../types/dashboard";

// Initial state
const initialState: DashboardState = {
  branch: "",
  date: new Date().toISOString().split("T")[0], // Today's date
  data: null,
  branches: [],
  branchesLoading: false,
  loading: false,
  error: null,
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
      });
  },
});

export const { setBranch, setDate } = dashboardSlice.actions;
export default dashboardSlice.reducer;
