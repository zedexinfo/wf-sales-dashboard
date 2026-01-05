import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, DashboardData } from '../types/dashboard';

// Initial state
const initialState: DashboardState = {
  branch: 'BR001',
  date: new Date().toISOString().split('T')[0], // Today's date
  data: null,
  loading: false,
  error: null,
};

// Async thunk to fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async ({ branch, date }: { branch: string; date: string }) => {
    const response = await fetch(
      `/api/dashboard/branch?branch=${encodeURIComponent(branch)}&date=${encodeURIComponent(date)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const data: DashboardData = await response.json();
    return data;
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
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
        state.error = action.error.message || 'Failed to fetch data';
      });
  },
});

export const { setBranch, setDate } = dashboardSlice.actions;
export default dashboardSlice.reducer;
