'use client';

import {
  fetchBranches,
  fetchDashboardData,
  setBranch,
  setDate,
} from '@/src/store/dashboardSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PAYMENT_COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { branch, date, data, branches, branchesLoading, loading, error } = useAppSelector(
    (state) => state.dashboard
  );

  // Fetch branches on mount
  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  // Fetch dashboard data when branch or date changes (and branch is set)
  useEffect(() => {
    if (branch) {
      dispatch(fetchDashboardData({ branch, date }));
    }
  }, [branch, date, dispatch]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setBranch(e.target.value));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDate(e.target.value));
  };

  const handleRefresh = () => {
    if (branch) {
      dispatch(fetchDashboardData({ branch, date }));
    }
  };

  // Prepare chart data
  const hourlyData = data?.ordersByHour.map((orders, hour) => ({
    hour: `${hour}:00`,
    orders,
  })) || [];

  const weekdayData = [
    { day: 'Mon', orders: data?.ordersByWeekday[0] || 0 },
    { day: 'Tue', orders: data?.ordersByWeekday[1] || 0 },
    { day: 'Wed', orders: data?.ordersByWeekday[2] || 0 },
    { day: 'Thu', orders: data?.ordersByWeekday[3] || 0 },
    { day: 'Fri', orders: data?.ordersByWeekday[4] || 0 },
    { day: 'Sat', orders: data?.ordersByWeekday[5] || 0 },
    { day: 'Sun', orders: data?.ordersByWeekday[6] || 0 },
  ];

  const paymentData = [
    { name: 'Cash', value: data?.payments.cash || 0 },
    { name: 'UPI', value: data?.payments.upi || 0 },
    { name: 'Card', value: data?.payments.card || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Waffle Forever Sales Dashboard
          </h1>
          <p className="text-gray-600">Branch-wise sales analytics</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Branch
              </label>
              <select
                id="branch"
                value={branch}
                onChange={handleBranchChange}
                disabled={branchesLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {branchesLoading ? (
                  <option value="">Loading branches...</option>
                ) : branches.length === 0 ? (
                  <option value="">No branches available</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.location ? `- ${b.location}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={handleDateChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Sales
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{data.summary.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Orders
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {data.summary.totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Tax
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{data.summary.totalTax.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Discount
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{data.summary.totalDiscount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Orders by Hour */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Orders by Hour
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Orders by Weekday */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Orders by Weekday
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment and Top Item */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Analytics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ₹${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Cash Inflow:{' '}
                    <span className="font-semibold text-gray-900">
                      ₹{data.payments.cashInflow.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Top Item */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Best Seller
                </h3>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {data.topItem.name}
                    </h4>
                    <p className="text-gray-600">
                      Quantity Sold:{' '}
                      <span className="font-semibold text-gray-900">
                        {data.topItem.qty}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
