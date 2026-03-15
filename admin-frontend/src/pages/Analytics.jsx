import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FaChartLine, FaRupeeSign, FaUsers, FaShoppingCart, 
  FaBriefcase, FaSync, FaCalendarAlt, FaChevronRight, FaArrowUp, FaArrowDown
} from "react-icons/fa";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area 
} from "recharts";
import { analyticsApi } from "../api/adminApi";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";

const Analytics = () => {
  const [period, setPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState("revenue");

  // ── Queries ──────────────────────────────────────────────────────────────

  const revenueQuery = useQuery({
    queryKey: ["analytics", "revenue", period],
    queryFn: () => analyticsApi.getRevenue(period),
    enabled: activeTab === "revenue" || activeTab === "overview"
  });

  const usersQuery = useQuery({
    queryKey: ["analytics", "users", period],
    queryFn: () => analyticsApi.getUsers(period),
    enabled: activeTab === "users" || activeTab === "overview"
  });

  const ordersQuery = useQuery({
    queryKey: ["analytics", "orders", period],
    queryFn: () => analyticsApi.getOrders(period),
    enabled: activeTab === "orders" || activeTab === "overview"
  });

  const categoriesQuery = useQuery({
    queryKey: ["analytics", "categories"],
    queryFn: analyticsApi.getCategories,
    enabled: activeTab === "categories"
  });

  // ── Constants ────────────────────────────────────────────────────────────

  const periodOptions = [
    { value: "7", label: "7 Days" },
    { value: "14", label: "14 Days" },
    { value: "30", label: "30 Days" },
    { value: "90", label: "90 Days" },
  ];

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  // ── Render Helpers ───────────────────────────────────────────────────────

  const renderRevenueTab = () => {
    const data = revenueQuery.data?.data?.analytics;
    const isLoading = revenueQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={data?.summary?.totalRevenue || 0}
            prefix="₹"
            change={data?.summary?.revenueGrowth}
            color="green"
            loading={isLoading}
          />
          <StatCard 
            title="Platform Fees" 
            value={data?.summary?.totalPlatformFees || 0}
            prefix="₹"
            color="violet"
            loading={isLoading}
          />
          <StatCard 
            title="Total Orders" 
            value={data?.summary?.totalOrders || 0}
            color="blue"
            loading={isLoading}
          />
          <StatCard 
            title="Avg Order Value" 
            value={data?.summary?.avgOrderValue || 0}
            prefix="₹"
            color="amber"
            loading={isLoading}
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FaChartLine className="text-violet-500" /> Revenue Trend
          </h3>
          <div className="h-80">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="_id" stroke="#71717a" fontSize={10} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                  <YAxis stroke="#71717a" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    const data = usersQuery.data?.data?.analytics;
    const isLoading = usersQuery.isLoading;

    return (
      <div className="space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Users" 
            value={data?.summary?.totalUsers || 0}
            color="blue"
            loading={isLoading}
          />
          <StatCard 
            title="New Signups" 
            value={data?.summary?.newUsers || 0}
            color="green"
            loading={isLoading}
          />
          <StatCard 
            title="Active Editors" 
            value={data?.summary?.activeEditors || 0}
            color="violet"
            loading={isLoading}
          />
          <StatCard 
            title="Banned Users" 
            value={data?.summary?.bannedUsers || 0}
            color="red"
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Signup Activity</h3>
            <div className="h-64">
              {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.dailySignups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="_id" stroke="#71717a" fontSize={10} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                    <YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }} />
                    <Bar dataKey="clients" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="editors" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">User Distribution</h3>
            <div className="h-64">
              {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.userDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="_id"
                      label
                    >
                      {data?.userDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    const data = ordersQuery.data?.data?.analytics;
    const isLoading = ordersQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Orders" value={data?.summary?.totalOrders || 0} color="blue" loading={isLoading} />
          <StatCard title="Completed" value={data?.summary?.completedOrders || 0} color="green" loading={isLoading} />
          <StatCard title="Completion Rate" value={data?.summary?.completionRate || 0} suffix="%" color="violet" loading={isLoading} />
          <StatCard title="Avg Time to Complete" value={data?.summary?.avgCompletionHours || 0} suffix="h" color="amber" loading={isLoading} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Order Volume</h3>
          <div className="h-80">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="_id" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <PageHeader 
          title="Business Analytics" 
          subtitle="Real-time dashboard of platform performance"
          icon={<FaChartLine className="text-violet-500" />}
        />
        
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === opt.value ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: "revenue", label: "Financials", icon: FaRupeeSign },
          { id: "users", label: "User Growth", icon: FaUsers },
          { id: "orders", label: "Order Ops", icon: FaShoppingCart },
          { id: "categories", label: "Gig Market", icon: FaBriefcase },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${activeTab === tab.id ? "text-violet-500 border-b-2 border-violet-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <tab.icon className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "revenue" && renderRevenueTab()}
        {activeTab === "users" && renderUsersTab()}
        {activeTab === "orders" && renderOrdersTab()}
        {activeTab === "categories" && (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-3xl opacity-50">
             <FaBriefcase className="text-4xl mb-4" />
             <p className="text-lg">Category analytics coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
