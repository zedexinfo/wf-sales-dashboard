"use client";

import {
  fetchBranches,
  fetchBranchComparison,
  fetchDashboardData,
  setBranch,
  setDate,
  setComparisonMode,
  setSelectedBranches,
  toggleBranchSelection,
} from "@/src/store/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import type { DashboardPeriod, PaymentAnalytics } from "@/src/types/dashboard";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PAYMENT_COLORS = [
  "#7C3AED",
  "#34D399",
  "#F97316",
  "#EC4899",
  "#10B981",
  "#6366F1",
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PERIOD_OPTIONS: DashboardPeriod[] = ["Day", "Week"];

const PERIOD_CONTEXT_LABEL: Record<DashboardPeriod, string> = {
  Day: "today",
  Week: "this week",
  Month: "this month",
  Year: "this year",
  Custom: "this range",
};

function parseInputDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatFriendlyPeriodLabel(
  dateValue: string,
  period: DashboardPeriod,
  customRange?: { start?: string; end?: string },
): string {
  if (period === "Custom") {
    if (!customRange?.start || !customRange?.end) {
      return "Choose a valid range";
    }

    const rangeStart = parseInputDate(customRange.start);
    const rangeEnd = parseInputDate(customRange.end);

    if (!rangeStart || !rangeEnd) {
      return "Choose a valid range";
    }

    const startLabel = rangeStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endLabel = rangeEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startLabel} – ${endLabel}`;
  }

  const parsedDate = parseInputDate(dateValue);

  if (!parsedDate) {
    if (period === "Year") {
      return "Choose a year";
    }
    if (period === "Month") {
      return "Choose a month";
    }
    return "Choose a date";
  }

  if (period === "Day") {
    return parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (period === "Week") {
    const start = new Date(parsedDate);
    start.setDate(parsedDate.getDate() - 6);

    const startLabel = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const endLabel = parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startLabel} – ${endLabel}`;
  }

  if (period === "Month") {
    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (period === "Year") {
    return parsedDate.getFullYear().toString();
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { 
    branch, 
    date, 
    data, 
    branches, 
    branchesLoading, 
    loading, 
    error,
    comparisonMode,
    selectedBranches,
    comparisonData,
    comparisonLoading,
    comparisonError,
  } = useAppSelector((state) => state.dashboard);
  const [period, setPeriod] = useState<DashboardPeriod>("Day");
  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  }>(() => ({
    start: date,
    end: date,
  }));
  const [comparisonRange, setComparisonRange] = useState<{
    start: string;
    end: string;
  }>(() => ({
    start: date,
    end: date,
  }));
  const [activeTab, setActiveTab] = useState<
    "overview" | "metrics" | "highlights"
  >("overview");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [useLocalTime, setUseLocalTime] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const isCustomRangeValid = useMemo(() => {
    if (!customRange.start || !customRange.end) {
      return false;
    }
    return customRange.start <= customRange.end;
  }, [customRange.start, customRange.end]);

  const isComparisonRangeValid = useMemo(() => {
    if (!comparisonRange.start || !comparisonRange.end) {
      return false;
    }
    // Check if range is within 1-7 days (inclusive)
    const start = new Date(comparisonRange.start);
    const end = new Date(comparisonRange.end);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);
    // daysDiff represents the difference, add 1 for inclusive count
    // e.g., Jan 1 to Jan 1 = 0 diff = 1 day, Jan 1 to Jan 7 = 6 diff = 7 days
    const daysInRange = daysDiff + 1;
    return comparisonRange.start <= comparisonRange.end && daysInRange >= 1 && daysInRange <= 7;
  }, [comparisonRange.start, comparisonRange.end]);

  const monthValue = useMemo(() => date.slice(0, 7), [date]);
  const yearValue = useMemo(() => date.slice(0, 4), [date]);

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    if (comparisonMode || !branch) {
      return;
    }

    if (period === "Custom") {
      if (isCustomRangeValid) {
        dispatch(fetchDashboardData({ branch, date, period, customRange }));
      }
      return;
    }

    dispatch(fetchDashboardData({ branch, date, period }));
  }, [branch, comparisonMode, customRange, date, dispatch, isCustomRangeValid, period]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setBranch(e.target.value));
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(event.target.value as DashboardPeriod);
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      dispatch(setDate(`${value}-01`));
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, 4);
    if (value) {
      dispatch(setDate(`${value}-01-01`));
    }
  };

  const handleCustomRangeChange =
    (key: "start" | "end") => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomRange((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDate(e.target.value));
  };

  const handleComparisonRangeChange =
    (key: "start" | "end") => (event: React.ChangeEvent<HTMLInputElement>) => {
      setComparisonRange((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const handleToggleComparisonMode = () => {
    dispatch(setComparisonMode(!comparisonMode));
  };

  const handleBranchSelectionToggle = (branchId: string) => {
    dispatch(toggleBranchSelection(branchId));
  };

  const handleSelectAllBranches = () => {
    if (!branches || branches.length === 0) {
      return;
    }
    if (selectedBranches.length === branches.length) {
      dispatch(setSelectedBranches([]));
    } else {
      dispatch(setSelectedBranches(branches.map(b => b.id)));
    }
  };

  const handleCompareNow = () => {
    if (selectedBranches.length === 0 || !isComparisonRangeValid || !branches || branches.length === 0) {
      return;
    }

    const branchNames = branches.reduce((acc, b) => {
      acc[b.id] = b.name;
      return acc;
    }, {} as Record<string, string>);

    dispatch(
      fetchBranchComparison({
        branches: selectedBranches,
        startDate: comparisonRange.start,
        endDate: comparisonRange.end,
        branchNames,
      })
    );
  };

  const handleRefresh = () => {
    if (!branch) {
      return;
    }

    if (period === "Custom") {
      if (isCustomRangeValid) {
        dispatch(fetchDashboardData({ branch, date, period, customRange }));
      }
      return;
    }

    dispatch(fetchDashboardData({ branch, date, period }));
  };

  const averageOrderValue = data?.summary.totalOrders
    ? data.summary.totalSales / data.summary.totalOrders
    : 0;

  const hourlyData = useMemo(
    () =>
      data?.ordersByHour.map((orders, hour) => ({
        hour: `${hour}:00`,
        orders,
      })) || [],
    [data?.ordersByHour],
  );

  const hourlyPerformance = hourlyData.map((point) => ({
    ...point,
    revenue: Math.round(point.orders * averageOrderValue),
  }));

  const weekdayData = useMemo(
    () => [
      { day: "Mon", orders: data?.ordersByWeekday[0] || 0 },
      { day: "Tue", orders: data?.ordersByWeekday[1] || 0 },
      { day: "Wed", orders: data?.ordersByWeekday[2] || 0 },
      { day: "Thu", orders: data?.ordersByWeekday[3] || 0 },
      { day: "Fri", orders: data?.ordersByWeekday[4] || 0 },
      { day: "Sat", orders: data?.ordersByWeekday[5] || 0 },
      { day: "Sun", orders: data?.ordersByWeekday[6] || 0 },
    ],
    [data?.ordersByWeekday],
  );

  // Payment Methods - Show all payment modes dynamically
  const paymentData = useMemo(() => {
    if (!data?.payments) return [];
    return Object.entries(data.payments)
      .map(([name, value]) => ({ name, value }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  // Channel/Platform data - from channels field
  const channelData = useMemo(() => {
    if (!data?.channels) return [];
    return Object.entries(data.channels)
      .map(([name, value]) => ({ name, value }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  // Helper to get cash amount (case-insensitive)
  const getCashAmount = (payments: PaymentAnalytics | undefined): number => {
    if (!payments) return 0;
    return payments.Cash || payments.cash || 0;
  };

  const peakHour = hourlyPerformance.reduce(
    (acc, point) => (point.orders > acc.orders ? point : acc),
    { hour: "—", orders: 0, revenue: 0 },
  );

  const selectedBranchName =
    branches.find((b) => b.id === branch)?.name || "Select a branch to begin";
  const friendlyDate = useMemo(
    () => formatFriendlyPeriodLabel(date, period, customRange),
    [customRange, date, period],
  );
  const rawContextLabel = PERIOD_CONTEXT_LABEL[period];
  const summaryContextLabel =
    period === "Custom" ? "over this range" : rawContextLabel;

  const summaryCards = data
    ? [
        {
          label: "Total Revenue",
          value: currencyFormatter.format(data.summary.totalSales),
          helper: `Net sales ${summaryContextLabel}`,
        },
        {
          label: "Total Orders",
          value: data.summary.totalOrders.toLocaleString(),
          helper: `${summaryContextLabel} orders`,
        },
        {
          label: "Avg Order Value",
          value: averageOrderValue
            ? currencyFormatter.format(averageOrderValue)
            : "—",
          helper: `${data.summary.totalOrders.toLocaleString()} orders`,
        },
        {
          label: "Total Transactions",
          value: data.summary.totalOrders.toLocaleString(),
          helper: `All channels ${summaryContextLabel}`,
        },
        {
          label: "Tax Collected",
          value: currencyFormatter.format(data.summary.totalTax),
          helper: `Reported to GSTN (${summaryContextLabel})`,
        },
        {
          label: "Discounts Given",
          value: currencyFormatter.format(data.summary.totalDiscount),
          helper: "Campaign adjustments",
        },
        {
          label: "Cash Inflow",
          value: currencyFormatter.format(getCashAmount(data.payments)),
          helper: `Physical tender ${summaryContextLabel}`,
        },
        {
          label: "Best Seller Units",
          value: data.topItem.qty.toLocaleString(),
          helper: `${data.topItem.name} • ${summaryContextLabel}`,
        },
      ]
    : [];

  const highlightCards = data
    ? [
        {
          label: "Peak Hour",
          value: peakHour.orders ? peakHour.hour : "Awaiting sales",
          helper: peakHour.orders
            ? `${peakHour.orders} orders`
            : "No orders logged",
          gradient: "from-[#F9D976] to-[#F39F86] text-[#5C2C0C]",
        },
        {
          label: "Best Seller",
          value: data.topItem.name,
          helper: `${data.topItem.qty} units ${summaryContextLabel}`,
          gradient: "from-[#A0F1EA] to-[#75C7F6] text-[#0A3555]",
        },
        {
          label: "Cash Share",
          value: `${Math.round(
            (getCashAmount(data.payments) /
              Math.max(
                Object.values(data.payments).reduce((sum, val) => sum + val, 0),
                1,
              )) *
              100,
          )}%`,
          helper: `${currencyFormatter.format(getCashAmount(data.payments))} collected ${summaryContextLabel}`,
          gradient: "from-[#FBC2EB] to-[#A18CD1] text-[#3F1E5B]",
        },
      ]
    : [];

  const topItemDetails = useMemo(
    () => (data?.topItems ? data.topItems.slice(0, 10) : []),
    [data],
  );

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: window.location.origin });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-gray-900">
      <header className="bg-[#0f1020] text-white shadow-lg shadow-black/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#2563EB] text-2xl">
              🧇
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/60">
                Waffle Forever
              </p>
              <p className="text-lg font-semibold">Sales Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setUseLocalTime(!useLocalTime)}
              className="hidden rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white md:inline-flex items-center gap-2"
            >
              <span>🕐</span>
              <span>{useLocalTime ? "Local Time" : "UTC Time"}</span>
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 md:flex">
              <span className="text-sm text-white/80">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <section className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {comparisonMode ? "Branch Comparison" : "Filters"}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleComparisonMode}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  comparisonMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {comparisonMode ? "Exit Comparison" : "Compare Branches"}
              </button>
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                {filtersCollapsed ? (
                  <>
                    <span>Show {comparisonMode ? "Options" : "Filters"}</span>
                    <span className="transform rotate-180 transition-transform">
                      ▼
                    </span>
                  </>
                ) : (
                  <>
                    <span>Hide {comparisonMode ? "Options" : "Filters"}</span>
                    <span className="transition-transform">▼</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!filtersCollapsed && comparisonMode && (
            <div className="space-y-4">
              {/* Date Range Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={comparisonRange.start}
                    onChange={handleComparisonRangeChange("start")}
                    disabled={comparisonLoading}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={comparisonRange.end}
                    onChange={handleComparisonRangeChange("end")}
                    disabled={comparisonLoading}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {!isComparisonRangeValid && comparisonRange.start && comparisonRange.end && (
                <p className="text-sm text-red-600">
                  Please select a valid date range (1 day to 1 week maximum).
                </p>
              )}

              {/* Branch Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Select Branches to Compare
                  </label>
                  <button
                    onClick={handleSelectAllBranches}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {(selectedBranches.length === (branches?.length || 0)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {branches && branches.length > 0 ? (
                    branches.map((b) => (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition ${
                          selectedBranches.includes(b.id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(b.id)}
                          onChange={() => handleBranchSelectionToggle(b.id)}
                          disabled={comparisonLoading}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {b.name}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="col-span-full text-sm text-gray-500">No branches available</p>
                  )}
                </div>
              </div>

              {/* Compare Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleCompareNow}
                  disabled={
                    comparisonLoading ||
                    selectedBranches.length === 0 ||
                    !isComparisonRangeValid
                  }
                  className="rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {comparisonLoading ? "Comparing..." : "Compare Now"}
                </button>
              </div>
            </div>
          )}

          {!filtersCollapsed && !comparisonMode && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr,1fr,2fr,auto]">
              <div className="flex flex-col">
                <label
                  htmlFor="branch"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Branch
                </label>
                <select
                  id="branch"
                  value={branch}
                  onChange={handleBranchChange}
                  disabled={branchesLoading || loading}
                  className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  {branchesLoading ? (
                    <option value="">Loading branches…</option>
                  ) : branches.length === 0 ? (
                    <option value="">No branches available</option>
                  ) : (
                    branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.location ? `• ${b.location}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="period"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Period
                </label>
                <select
                  id="period"
                  value={period}
                  onChange={handlePeriodChange}
                  disabled={loading}
                  className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {period === "Month"
                    ? "Month"
                    : period === "Year"
                      ? "Year"
                      : period === "Custom"
                        ? "Custom Range"
                        : "Date"}
                </label>
                {(period === "Day" || period === "Week") && (
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    disabled={loading}
                    className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                )}
                {period === "Month" && (
                  <input
                    id="month"
                    type="month"
                    value={monthValue}
                    onChange={handleMonthChange}
                    disabled={loading}
                    className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                )}
                {period === "Year" && (
                  <input
                    id="year"
                    type="number"
                    min="2015"
                    max="2100"
                    value={yearValue}
                    onChange={handleYearChange}
                    disabled={loading}
                    className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                )}
                {period === "Custom" && (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={handleCustomRangeChange("start")}
                      disabled={loading}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                      aria-label="Start date"
                    />
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={handleCustomRangeChange("end")}
                      disabled={loading}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                      aria-label="End date"
                    />
                  </div>
                )}
                {period === "Custom" && !isCustomRangeValid && (
                  <p className="mt-2 text-xs text-red-500">
                    Start date must be on or before end date.
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRefresh}
                  disabled={
                    loading || (period === "Custom" && !isCustomRangeValid)
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>
          )}

          {!filtersCollapsed && !comparisonMode && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                  Reporting Period
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {friendlyDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                  Branch
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBranchName}
                </p>
              </div>
            </div>
          )}

          {!comparisonMode && (
            <>
              {/* Tabs - Centered */}
              <div className="mt-6 flex justify-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === "overview"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === "metrics"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab("highlights")}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === "highlights"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Highlights
            </button>
          </div>
            </>
          )}
        </section>

        {comparisonMode && comparisonError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            Error: {comparisonError}
          </div>
        )}

        {comparisonMode && comparisonLoading && (
          <div className="rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg shadow-slate-900/5">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-transparent"></div>
            <p className="font-medium text-gray-700">
              Comparing branch data...
            </p>
          </div>
        )}

        {comparisonMode && comparisonData && !comparisonLoading && (
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Branch Comparison Results
            </h3>
            
            {/* Comparison Table */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5 overflow-x-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary Comparison</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Branch</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Revenue</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Orders</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Avg Order Value</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Tax Collected</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Discounts</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((branchData, idx) => {
                    const avgOrderValue = branchData.data.summary.totalOrders > 0
                      ? branchData.data.summary.totalSales / branchData.data.summary.totalOrders
                      : 0;
                    return (
                      <tr key={branchData.branchId} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-3 font-medium text-gray-900">{branchData.branchName}</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {currencyFormatter.format(branchData.data.summary.totalSales)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {branchData.data.summary.totalOrders.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {currencyFormatter.format(avgOrderValue)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {currencyFormatter.format(branchData.data.summary.totalTax)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {currencyFormatter.format(branchData.data.summary.totalDiscount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Revenue Comparison Chart */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={comparisonData.map(bd => ({
                    name: bd.branchName,
                    revenue: bd.data.summary.totalSales,
                    orders: bd.data.summary.totalOrders,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    formatter={(value: number) => currencyFormatter.format(value)}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Comparison Chart */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Orders Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={comparisonData.map(bd => ({
                    name: bd.branchName,
                    orders: bd.data.summary.totalOrders,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="orders" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Insights */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(() => {
                  // Find highest and lowest performers by revenue
                  const sortedByRevenue = [...comparisonData].sort((a, b) => 
                    b.data.summary.totalSales - a.data.summary.totalSales
                  );
                  const highestRevenue = sortedByRevenue[0];
                  const lowestRevenue = sortedByRevenue[sortedByRevenue.length - 1];
                  
                  // Find highest and lowest performers by orders
                  const sortedByOrders = [...comparisonData].sort((a, b) => 
                    b.data.summary.totalOrders - a.data.summary.totalOrders
                  );
                  const highestOrders = sortedByOrders[0];
                  const lowestOrders = sortedByOrders[sortedByOrders.length - 1];

                  return (
                    <>
                      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                          🏆 Highest Revenue
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {highestRevenue.branchName}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {currencyFormatter.format(highestRevenue.data.summary.totalSales)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-4 border border-red-200">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">
                          📉 Lowest Revenue
                        </p>
                        <p className="text-xl font-bold text-red-900">
                          {lowestRevenue.branchName}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {currencyFormatter.format(lowestRevenue.data.summary.totalSales)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                          🥇 Most Orders
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {highestOrders.branchName}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {highestOrders.data.summary.totalOrders.toLocaleString()} orders
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-200">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
                          📊 Least Orders
                        </p>
                        <p className="text-xl font-bold text-orange-900">
                          {lowestOrders.branchName}
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          {lowestOrders.data.summary.totalOrders.toLocaleString()} orders
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Top Selling Products Comparison */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products by Branch</h4>
              
              {/* Summary Section */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border border-purple-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-2">
                  📊 Overall Summary
                </p>
                {(() => {
                  // Aggregate products across all branches
                  const productMap = new Map<string, number>();
                  comparisonData.forEach(bd => {
                    bd.data.topItems.forEach(item => {
                      const current = productMap.get(item.name) || 0;
                      productMap.set(item.name, current + item.qty);
                    });
                  });
                  
                  // Sort by total quantity
                  const topProducts = Array.from(productMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                  
                  // Count how many branches sell each product
                  const productBranchCount = new Map<string, number>();
                  comparisonData.forEach(bd => {
                    const productNames = new Set(bd.data.topItems.map(item => item.name));
                    productNames.forEach(name => {
                      const count = productBranchCount.get(name) || 0;
                      productBranchCount.set(name, count + 1);
                    });
                  });
                  
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-900">
                        Top products across all branches:
                      </p>
                      {topProducts.map(([name, qty], idx) => {
                        const branchCount = productBranchCount.get(name) || 0;
                        return (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-700 font-semibold">{idx + 1}.</span>
                              <span className="text-purple-900 font-medium">{name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-700">{qty.toLocaleString()} total units</span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {branchCount}/{comparisonData.length} branches
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {comparisonData.map((branchData) => (
                  <div key={branchData.branchId} className="rounded-2xl bg-gray-50 p-4 border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3">{branchData.branchName}</h5>
                    <div className="space-y-2">
                      {branchData.data.topItems.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {idx + 1}
                            </span>
                            <span className="text-gray-900 font-medium truncate">{item.name}</span>
                          </div>
                          <span className="text-gray-600 ml-2 flex-shrink-0">{item.qty} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours Analysis */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Comparison</h4>
              
              {/* Summary Section */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                  ⏰ Peak Hours Summary
                </p>
                {(() => {
                  // Find peak hour for each branch
                  const branchPeaks = comparisonData.map(bd => {
                    const maxOrders = Math.max(...bd.data.ordersByHour);
                    const peakHour = bd.data.ordersByHour.indexOf(maxOrders);
                    return { branch: bd.branchName, hour: peakHour, orders: maxOrders };
                  }).sort((a, b) => b.orders - a.orders);
                  
                  // Find overall peak hour across all branches
                  const hourlyTotals = Array.from({ length: 24 }, (_, hour) => ({
                    hour,
                    total: comparisonData.reduce((sum, bd) => sum + (bd.data.ordersByHour[hour] || 0), 0)
                  }));
                  const overallPeak = hourlyTotals.reduce((max, curr) => curr.total > max.total ? curr : max);
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Busiest hour overall: {overallPeak.hour}:00 - {overallPeak.hour + 1}:00
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {overallPeak.total} total orders
                        </span>
                      </div>
                      <div className="text-sm text-blue-800">
                        Branch peaks: {branchPeaks.slice(0, 2).map(p => `${p.branch} (${p.hour}:00)`).join(', ')}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={(() => {
                    // Create combined data for all branches by hour
                    const hours = Array.from({ length: 24 }, (_, i) => i);
                    return hours.map(hour => {
                      const dataPoint: Record<string, string | number> = { hour: `${hour}:00` };
                      comparisonData.forEach(bd => {
                        dataPoint[bd.branchName] = bd.data.ordersByHour[hour] || 0;
                      });
                      return dataPoint;
                    });
                  })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {comparisonData.map((branchData, idx) => {
                    const colors = ['#7C3AED', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                    return (
                      <Line
                        key={branchData.branchId}
                        type="monotone"
                        dataKey={branchData.branchName}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Days Analysis */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Days Comparison</h4>
              
              {/* Summary Section */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                  📅 Peak Days Summary
                </p>
                {(() => {
                  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  
                  // Calculate total orders per day across all branches
                  const dayTotals = Array.from({ length: 7 }, (_, dayIdx) => ({
                    day: weekdays[dayIdx],
                    total: comparisonData.reduce((sum, bd) => sum + (bd.data.ordersByWeekday[dayIdx] || 0), 0)
                  }));
                  
                  const peakDay = dayTotals.reduce((max, curr) => curr.total > max.total ? curr : max);
                  const slowestDay = dayTotals.reduce((min, curr) => curr.total < min.total ? curr : min);
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">
                          Busiest day: {peakDay.day}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {peakDay.total} total orders
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">
                          Slowest day: {slowestDay.day}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {slowestDay.total} total orders
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={(() => {
                    // Create combined data for all branches by weekday
                    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return weekdays.map((day, dayIdx) => {
                      const dataPoint: Record<string, string | number> = { day };
                      comparisonData.forEach(bd => {
                        dataPoint[bd.branchName] = bd.data.ordersByWeekday[dayIdx] || 0;
                      });
                      return dataPoint;
                    });
                  })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {comparisonData.map((branchData, idx) => {
                    const colors = ['#7C3AED', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                    return (
                      <Bar
                        key={branchData.branchId}
                        dataKey={branchData.branchName}
                        fill={colors[idx % colors.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform/Channel Comparison */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Platform-wise Sales Comparison</h4>
              
              {/* Summary Section */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                  🏪 Platform Summary
                </p>
                {(() => {
                  // Collect all unique channels and calculate totals
                  const channelTotals = new Map<string, number>();
                  comparisonData.forEach(bd => {
                    Object.entries(bd.data.channels).forEach(([channel, value]) => {
                      const current = channelTotals.get(channel) || 0;
                      channelTotals.set(channel, current + value);
                    });
                  });
                  
                  // Sort by total revenue
                  const topChannels = Array.from(channelTotals.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                  
                  const totalRevenue = Array.from(channelTotals.values()).reduce((sum, val) => sum + val, 0);
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900">
                          Top performing platforms:
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          Total: {currencyFormatter.format(totalRevenue)}
                        </span>
                      </div>
                      {topChannels.map(([channel, revenue], idx) => {
                        const percentage = ((revenue / totalRevenue) * 100).toFixed(1);
                        return (
                          <div key={channel} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-700 font-semibold">{idx + 1}.</span>
                              <span className="text-amber-900 font-medium">{channel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-700">{currencyFormatter.format(revenue)}</span>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-6">
                {(() => {
                  // Collect all unique channels across all branches
                  const allChannels = new Set<string>();
                  comparisonData.forEach(bd => {
                    Object.keys(bd.data.channels).forEach(channel => allChannels.add(channel));
                  });

                  // Create data for each channel
                  return Array.from(allChannels).map(channel => {
                    const channelData = comparisonData.map(bd => ({
                      name: bd.branchName,
                      value: bd.data.channels[channel] || 0,
                    })).filter(d => d.value > 0);

                    if (channelData.length === 0) return null;

                    return (
                      <div key={channel} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <h5 className="font-semibold text-gray-900 mb-3">{channel}</h5>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart
                            data={channelData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis dataKey="name" type="category" stroke="#6b7280" width={90} />
                            <Tooltip
                              formatter={(value: number) => currencyFormatter.format(value)}
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.96)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </div>
          </section>
        )}

        {!comparisonMode && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            Error: {error}
          </div>
        )}

        {!comparisonMode && loading && (
          <div className="rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg shadow-slate-900/5">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-transparent"></div>
            <p className="font-medium text-gray-700">
              Crunching the latest sales numbers…
            </p>
          </div>
        )}

        {!comparisonMode && data && !loading && (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-gray-900">
                        {card.value}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {card.helper}
                      </p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        Weekly Performance
                      </p>
                      <span className="text-xs text-gray-400">
                        Orders by weekday
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={weekdayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0FF" />
                        <XAxis dataKey="day" stroke="#9AA1B9" />
                        <YAxis stroke="#9AA1B9" />
                        <Tooltip />
                        <Bar
                          dataKey="orders"
                          fill="#22C55E"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        Payment Methods
                      </p>
                      <span className="text-xs text-gray-400">Live split</span>
                    </div>
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {paymentData.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={PAYMENT_COLORS[index]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-3 text-sm text-gray-600">
                        {paymentData.map((entry, index) => (
                          <li
                            key={entry.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: PAYMENT_COLORS[index],
                                }}
                              ></span>
                              <p className="mr-3">{entry.name}</p>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {currencyFormatter.format(entry.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Platform Split Section */}
                {channelData.length > 0 && (
                  <section className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        Platform Breakdown
                      </p>
                      <span className="text-xs text-gray-400">
                        Channel split
                      </span>
                    </div>
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {channelData.map((entry, index) => (
                              <Cell
                                key={`cell-channel-${entry.name}`}
                                fill={
                                  PAYMENT_COLORS[
                                    (index + 3) % PAYMENT_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-3 text-sm text-gray-600">
                        {channelData.map((entry, index) => (
                          <li
                            key={entry.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    PAYMENT_COLORS[
                                      (index + 3) % PAYMENT_COLORS.length
                                    ],
                                }}
                              ></span>
                              <p className="mr-3">{entry.name}</p>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {currencyFormatter.format(entry.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Metrics Tab */}
            {activeTab === "metrics" && (
              <>
                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                          Revenue Trend
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          Hourly sales momentum
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                        {period}
                      </span>
                    </div>
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                      className="mt-6"
                    >
                      <AreaChart data={hourlyPerformance}>
                        <defs>
                          <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#C084FC"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#A855F7"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0FF" />
                        <XAxis dataKey="hour" stroke="#9AA1B9" />
                        <YAxis stroke="#9AA1B9" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8B5CF6"
                          fillOpacity={1}
                          fill="url(#revenueGradient)"
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                          Hourly Metrics
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          Orders vs revenue
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Local timezone
                      </span>
                    </div>
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                      className="mt-6"
                    >
                      <LineChart data={hourlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0FF" />
                        <XAxis dataKey="hour" stroke="#9AA1B9" />
                        <YAxis stroke="#9AA1B9" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Additional Metrics */}
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-lg shadow-slate-900/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Transaction Rate
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-gray-900">
                      {data?.summary.totalOrders || 0}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Total transactions {summaryContextLabel}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg shadow-slate-900/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Revenue Per Order
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-gray-900">
                      {averageOrderValue
                        ? currencyFormatter.format(averageOrderValue)
                        : "—"}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Average order value
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-lg shadow-slate-900/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Tax Revenue
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-gray-900">
                      {currencyFormatter.format(data?.summary.totalTax || 0)}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      GST collected {summaryContextLabel}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-orange-50 to-red-50 p-5 shadow-lg shadow-slate-900/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Discounts Given
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-gray-900">
                      {currencyFormatter.format(
                        data?.summary.totalDiscount || 0,
                      )}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Total discounts {summaryContextLabel}
                    </p>
                  </div>
                </section>

                {/* Payment Charts Section */}
                <section className="grid gap-6 lg:grid-cols-2">
                  {/* Payment Type Chart */}
                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        Payment Methods
                      </p>
                      <span className="text-xs text-gray-400">
                        Payment modes
                      </span>
                    </div>
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {paymentData.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={
                                  PAYMENT_COLORS[index % PAYMENT_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-3 text-sm text-gray-600">
                        {paymentData.map((entry, index) => (
                          <li
                            key={entry.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    PAYMENT_COLORS[
                                      index % PAYMENT_COLORS.length
                                    ],
                                }}
                              ></span>
                              {entry.name}
                            </div>
                            <span className="font-semibold text-gray-900">
                              {currencyFormatter.format(entry.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Channel/Platform Chart */}
                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        Sales Channels
                      </p>
                      <span className="text-xs text-gray-400">
                        Channel breakdown
                      </span>
                    </div>
                    {channelData.length > 0 ? (
                      <div className="flex flex-col gap-6 md:flex-row md:items-center">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={channelData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {channelData.map((entry, index) => (
                                <Cell
                                  key={`cell-${entry.name}`}
                                  fill={
                                    PAYMENT_COLORS[
                                      (index + 3) % PAYMENT_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <ul className="flex-1 space-y-3 text-sm text-gray-600">
                          {channelData.map((entry, index) => (
                            <li
                              key={entry.name}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      PAYMENT_COLORS[
                                        (index + 3) % PAYMENT_COLORS.length
                                      ],
                                  }}
                                ></span>
                                {entry.name}
                              </div>
                              <span className="font-semibold text-gray-900">
                                {currencyFormatter.format(entry.value)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex h-[220px] items-center justify-center text-gray-500">
                        <p className="text-sm">No channel data available</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Highlights Tab - Side by side layout on tablets+ */}
            {activeTab === "highlights" && (
              <section className="grid gap-6 md:grid-cols-[65fr,35fr]">
                {/* Top Selling Highlight - Left side (65%) on tablets+ */}
                <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                  <p className="text-lg font-semibold text-gray-900">
                    Top Selling Highlight
                  </p>
                  <div className="mt-4 flex flex-col gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.4em] text-gray-400">
                        Best Seller
                      </p>
                      <p className="text-3xl font-semibold text-gray-900">
                        {data.topItem.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {data.topItem.qty} units sold {summaryContextLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] px-6 py-4">
                      <p className="text-sm text-gray-600">Avg order value</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {averageOrderValue
                          ? currencyFormatter.format(averageOrderValue)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-gray-100 bg-white/70 max-h-96 overflow-y-auto">
                    {topItemDetails.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {topItemDetails.map((item, index) => (
                          <li
                            key={`${item.name}-${index}`}
                            className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-gray-600"
                          >
                            <div className="flex items-center gap-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.qty.toLocaleString()} units
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {currencyFormatter.format(item.revenue)}
                              </p>
                              <p className="text-xs text-gray-500">Revenue</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-6 text-sm text-gray-500">
                        No item-level sales recorded {summaryContextLabel}.
                      </p>
                    )}
                  </div>
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                    Seamlessly synced with Rista POS — every order, discount,
                    and cash adjustment stays reconciled with your source of
                    truth.
                  </div>
                </div>

                {/* Highlight Cards - Right side (35%) on tablets+ */}
                <div className="grid gap-4 md:grid-rows-3">
                  {highlightCards.map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-3xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg shadow-slate-900/5`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/70">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold">
                        {card.value}
                      </p>
                      <p className="mt-1 text-sm">{card.helper}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
