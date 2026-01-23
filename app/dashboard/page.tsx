'use client';

import {
  fetchBranches,
  fetchDashboardData,
  setBranch,
  setDate,
} from '@/src/store/dashboardSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import type { DashboardPeriod } from '@/src/types/dashboard';
import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
} from 'recharts';

const PAYMENT_COLORS = ['#7C3AED', '#34D399', '#F97316'];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const PERIOD_OPTIONS: DashboardPeriod[] = ['Day', 'Week'];

const PERIOD_CONTEXT_LABEL: Record<DashboardPeriod, string> = {
  Day: 'today',
  Week: 'this week',
  Month: 'this month',
  Year: 'this year',
  Custom: 'this range',
};

function parseInputDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

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
  customRange?: { start?: string; end?: string }
): string {
  if (period === 'Custom') {
    if (!customRange?.start || !customRange?.end) {
      return 'Choose a valid range';
    }

    const rangeStart = parseInputDate(customRange.start);
    const rangeEnd = parseInputDate(customRange.end);

    if (!rangeStart || !rangeEnd) {
      return 'Choose a valid range';
    }

    const startLabel = rangeStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endLabel = rangeEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startLabel} – ${endLabel}`;
  }

  const parsedDate = parseInputDate(dateValue);

  if (!parsedDate) {
    if (period === 'Year') {
      return 'Choose a year';
    }
    if (period === 'Month') {
      return 'Choose a month';
    }
    return 'Choose a date';
  }

  if (period === 'Day') {
    return parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (period === 'Week') {
    const start = new Date(parsedDate);
    start.setDate(parsedDate.getDate() - 6);

    const startLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const endLabel = parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startLabel} – ${endLabel}`;
  }

  if (period === 'Month') {
    return parsedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  if (period === 'Year') {
    return parsedDate.getFullYear().toString();
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { branch, date, data, branches, branchesLoading, loading, error } = useAppSelector(
    (state) => state.dashboard
  );
  const [period, setPeriod] = useState<DashboardPeriod>('Day');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => ({
    start: date,
    end: date,
  }));
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'highlights'>('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const isCustomRangeValid = useMemo(() => {
    if (!customRange.start || !customRange.end) {
      return false;
    }
    return customRange.start <= customRange.end;
  }, [customRange.start, customRange.end]);

  const monthValue = useMemo(() => date.slice(0, 7), [date]);
  const yearValue = useMemo(() => date.slice(0, 4), [date]);

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    if (!branch) {
      return;
    }

    if (period === 'Custom') {
      if (isCustomRangeValid) {
        dispatch(fetchDashboardData({ branch, date, period, customRange }));
      }
      return;
    }

    dispatch(fetchDashboardData({ branch, date, period }));
  }, [branch, customRange, date, dispatch, isCustomRangeValid, period]);

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
    (key: 'start' | 'end') => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomRange((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDate(e.target.value));
  };

  const handleRefresh = () => {
    if (!branch) {
      return;
    }

    if (period === 'Custom') {
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
    [data?.ordersByHour]
  );

  const hourlyPerformance = hourlyData.map((point) => ({
    ...point,
    revenue: Math.round(point.orders * averageOrderValue),
  }));

  const weekdayData = useMemo(
    () => [
      { day: 'Mon', orders: data?.ordersByWeekday[0] || 0 },
      { day: 'Tue', orders: data?.ordersByWeekday[1] || 0 },
      { day: 'Wed', orders: data?.ordersByWeekday[2] || 0 },
      { day: 'Thu', orders: data?.ordersByWeekday[3] || 0 },
      { day: 'Fri', orders: data?.ordersByWeekday[4] || 0 },
      { day: 'Sat', orders: data?.ordersByWeekday[5] || 0 },
      { day: 'Sun', orders: data?.ordersByWeekday[6] || 0 },
    ],
    [data?.ordersByWeekday]
  );

  const paymentData = [
    { name: 'Cash', value: data?.payments.cash || 0 },
    { name: 'UPI', value: data?.payments.upi || 0 },
    { name: 'Card', value: data?.payments.card || 0 },
  ];

  const peakHour = hourlyPerformance.reduce(
    (acc, point) => (point.orders > acc.orders ? point : acc),
    { hour: '—', orders: 0, revenue: 0 }
  );

  const selectedBranchName =
    branches.find((b) => b.id === branch)?.name || 'Select a branch to begin';
  const friendlyDate = useMemo(
    () => formatFriendlyPeriodLabel(date, period, customRange),
    [customRange, date, period]
  );
  const rawContextLabel = PERIOD_CONTEXT_LABEL[period];
  const summaryContextLabel = period === 'Custom' ? 'over this range' : rawContextLabel;

  const summaryCards = data
    ? [
        {
          label: 'Total Revenue',
          value: currencyFormatter.format(data.summary.totalSales),
          helper: `Net sales ${summaryContextLabel}`,
        },
        {
          label: 'Total Orders',
          value: data.summary.totalOrders.toLocaleString(),
          helper: `${summaryContextLabel} orders`,
        },
        {
          label: 'Avg Order Value',
          value: averageOrderValue
            ? currencyFormatter.format(averageOrderValue)
            : '—',
          helper: `${data.summary.totalOrders.toLocaleString()} orders`,
        },
        {
          label: 'Total Transactions',
          value: data.summary.totalOrders.toLocaleString(),
          helper: `All channels ${summaryContextLabel}`,
        },
        {
          label: 'Tax Collected',
          value: currencyFormatter.format(data.summary.totalTax),
          helper: `Reported to GSTN (${summaryContextLabel})`,
        },
        {
          label: 'Discounts Given',
          value: currencyFormatter.format(data.summary.totalDiscount),
          helper: 'Campaign adjustments',
        },
        {
          label: 'Cash Inflow',
          value: currencyFormatter.format(data.payments.cashInflow),
          helper: `Physical tender ${summaryContextLabel}`,
        },
        {
          label: 'Best Seller Units',
          value: data.topItem.qty.toLocaleString(),
          helper: `${data.topItem.name} • ${summaryContextLabel}`,
        },
      ]
    : [];

  const highlightCards = data
    ? [
        {
          label: 'Peak Hour',
          value: peakHour.orders ? peakHour.hour : 'Awaiting sales',
          helper: peakHour.orders ? `${peakHour.orders} orders` : 'No orders logged',
          gradient: 'from-[#F9D976] to-[#F39F86] text-[#5C2C0C]',
        },
        {
          label: 'Best Seller',
          value: data.topItem.name,
          helper: `${data.topItem.qty} units ${summaryContextLabel}`,
          gradient: 'from-[#A0F1EA] to-[#75C7F6] text-[#0A3555]',
        },
        {
          label: 'Cash Share',
          value: `${Math.round(
            (data.payments.cash /
              Math.max(
                data.payments.cash + data.payments.card + data.payments.upi,
                1
              )) *
              100
          )}%`,
          helper: `${currencyFormatter.format(data.payments.cash)} collected ${summaryContextLabel}`,
          gradient: 'from-[#FBC2EB] to-[#A18CD1] text-[#3F1E5B]',
        },
      ]
    : [];

  const topItemDetails = useMemo(
    () => (data?.topItems ? data.topItems.slice(0, 10) : []),
    [data]
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
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
              <p className="text-xs uppercase tracking-[0.5em] text-white/60">Waffle Forever</p>
              <p className="text-lg font-semibold">Sales Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr,1fr,2fr,auto]">
            <div className="flex flex-col">
              <label htmlFor="branch" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                      {b.name} {b.location ? `• ${b.location}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="period" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                {period === 'Month'
                  ? 'Month'
                  : period === 'Year'
                  ? 'Year'
                  : period === 'Custom'
                  ? 'Custom Range'
                  : 'Date'}
              </label>
              {(period === 'Day' || period === 'Week') && (
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  disabled={loading}
                  className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              )}
              {period === 'Month' && (
                <input
                  id="month"
                  type="month"
                  value={monthValue}
                  onChange={handleMonthChange}
                  disabled={loading}
                  className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              )}
              {period === 'Year' && (
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
              {period === 'Custom' && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={handleCustomRangeChange('start')}
                    disabled={loading}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                    aria-label="Start date"
                  />
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={handleCustomRangeChange('end')}
                    disabled={loading}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                    aria-label="End date"
                  />
                </div>
              )}
              {period === 'Custom' && !isCustomRangeValid && (
                <p className="mt-2 text-xs text-red-500">Start date must be on or before end date.</p>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={
                  loading || (period === 'Custom' && !isCustomRangeValid)
                }
                className="w-full rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Reporting Period</p>
              <p className="text-lg font-semibold text-gray-900">{friendlyDate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Branch</p>
              <p className="text-lg font-semibold text-gray-900">{selectedBranchName}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'metrics'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'highlights'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Highlights
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg shadow-slate-900/5">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-transparent"></div>
            <p className="font-medium text-gray-700">Crunching the latest sales numbers…</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <section className="grid gap-5 lg:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-gray-900">{card.value}</p>
                      <p className="mt-2 text-sm text-gray-500">{card.helper}</p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">Weekly Performance</p>
                      <span className="text-xs text-gray-400">Orders by weekday</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={weekdayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0FF" />
                        <XAxis dataKey="day" stroke="#9AA1B9" />
                        <YAxis stroke="#9AA1B9" />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#22C55E" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">Payment Methods</p>
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
                              <Cell key={`cell-${entry.name}`} fill={PAYMENT_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-3 text-sm text-gray-600">
                        {paymentData.map((entry, index) => (
                          <li key={entry.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: PAYMENT_COLORS[index] }}
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
                </section>
              </>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Revenue Trend</p>
                      <p className="text-lg font-semibold text-gray-900">Hourly sales momentum</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {period}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={280} className="mt-6">
                    <AreaChart data={hourlyPerformance}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C084FC" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
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
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Hourly Metrics</p>
                      <p className="text-lg font-semibold text-gray-900">Orders vs revenue</p>
                    </div>
                    <span className="text-xs text-gray-400">Local timezone</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280} className="mt-6">
                    <LineChart data={hourlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF0FF" />
                      <XAxis dataKey="hour" stroke="#9AA1B9" />
                      <YAxis stroke="#9AA1B9" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Highlights Tab */}
            {activeTab === 'highlights' && (
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg shadow-slate-900/5 lg:col-span-2">
                  <p className="text-lg font-semibold text-gray-900">Top Selling Highlight</p>
                  <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.4em] text-gray-400">Best Seller</p>
                      <p className="text-3xl font-semibold text-gray-900">{data.topItem.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {data.topItem.qty} units sold {summaryContextLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] px-6 py-4 text-right">
                      <p className="text-sm text-gray-600">Avg order value</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {averageOrderValue ? currencyFormatter.format(averageOrderValue) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-gray-100 bg-white/70">
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
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.qty.toLocaleString()} units</p>
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
                    Seamlessly synced with Rista POS — every order, discount, and cash adjustment
                    stays reconciled with your source of truth.
                  </div>
                </div>

                <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
                  {highlightCards.map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-3xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg shadow-slate-900/5`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/70">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold">{card.value}</p>
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
