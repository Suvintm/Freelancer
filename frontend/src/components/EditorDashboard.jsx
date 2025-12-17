/**
 * EditorDashboard - Advanced Dashboard Component
 * Professional Light Corporate Theme with Charts and Stats
 * Uses recharts for visualizations
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaClipboardList,
  FaBriefcase,
  FaChartLine,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
  FaUniversity,
  FaMoneyBillWave,
  FaFire,
  FaEye,
  FaStar,
  FaUserCheck,
  FaRocket,
  FaCalendarAlt,
  FaBell,
  FaWallet,
  FaTrophy,
  FaTasks,
  FaNewspaper,
} from 'react-icons/fa';
import { HiTrendingUp, HiTrendingDown, HiLightningBolt, HiSparkles } from 'react-icons/hi';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Sample data for charts
const earningsData = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 180 },
  { name: 'Wed', value: 150 },
  { name: 'Thu', value: 280 },
  { name: 'Fri', value: 220 },
  { name: 'Sat', value: 350 },
  { name: 'Sun', value: 300 },
];

const ordersData = [
  { name: 'W1', orders: 4 },
  { name: 'W2', orders: 7 },
  { name: 'W3', orders: 5 },
  { name: 'W4', orders: 9 },
];

const pieData = [
  { name: 'Completed', value: 65, color: '#22C55E' },
  { name: 'In Progress', value: 25, color: '#3B82F6' },
  { name: 'Pending', value: 10, color: '#F59E0B' },
];

const EditorDashboard = ({ user, stats }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Quick stat cards config
  const quickStats = [
    { 
      label: 'Total Orders', 
      value: stats?.totalOrders || 0, 
      icon: FaClipboardList, 
      color: '#22C55E',
      bgColor: 'bg-emerald-50',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Active Gigs', 
      value: stats?.activeGigs || 0, 
      icon: FaBriefcase, 
      color: '#3B82F6',
      bgColor: 'bg-blue-50',
      trend: '+3',
      trendUp: true
    },
    { 
      label: 'Profile Views', 
      value: 248, 
      icon: FaEye, 
      color: '#A855F7',
      bgColor: 'bg-purple-50',
      trend: '+18%',
      trendUp: true
    },
    { 
      label: 'Response Rate', 
      value: '94%', 
      icon: FaUserCheck, 
      color: '#F59E0B',
      bgColor: 'bg-amber-50',
      trend: '-2%',
      trendUp: false
    },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Create Gig', icon: FaRocket, path: '/create-gig', color: '#22C55E', bgColor: 'bg-emerald-50' },
    { label: 'View Orders', icon: FaClipboardList, path: '/my-orders', color: '#3B82F6', bgColor: 'bg-blue-50' },
    { label: 'Analytics', icon: FaChartLine, path: '/editor-analytics', color: '#A855F7', bgColor: 'bg-purple-50' },
    { label: 'Payments', icon: FaWallet, path: '/payments', color: '#F59E0B', bgColor: 'bg-amber-50' },
  ];

  // Recent activity
  const recentActivity = [
    { type: 'order', text: 'New order received', time: '2 min ago', icon: FaClipboardList, color: '#22C55E' },
    { type: 'view', text: 'Profile viewed by client', time: '15 min ago', icon: FaEye, color: '#A855F7' },
    { type: 'message', text: 'New message from buyer', time: '1 hour ago', icon: FaBell, color: '#3B82F6' },
    { type: 'review', text: 'You received a 5-star review!', time: '3 hours ago', icon: FaStar, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header with Greeting */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white light:bg-white rounded-2xl p-5 border border-slate-200 light:border-slate-200 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-50 light:from-emerald-50 to-teal-50 light:to-teal-50 rounded-xl">
            <HiSparkles className="text-2xl text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 light:text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {greeting()}, {user?.name?.split(' ')[0] || 'Editor'}!
            </h2>
            <p className="text-slate-500 light:text-slate-500 text-sm">
              Here's what's happening with your account today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 light:text-slate-500 bg-slate-50 light:bg-slate-50 px-4 py-2 rounded-xl">
          <FaCalendarAlt className="text-slate-400 light:text-slate-400" />
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 light:hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor} light:${stat.bgColor}`}>
                <stat.icon className="text-sm" style={{ color: stat.color }} />
              </div>
              <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full ${
                stat.trendUp 
                  ? 'text-emerald-600 light:text-emerald-600 bg-emerald-50 light:bg-emerald-50' 
                  : 'text-red-600 light:text-red-600 bg-red-50 light:bg-red-50'
              }`}>
                {stat.trendUp ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 light:text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.value}</p>
            <p className="text-xs text-slate-500 light:text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Earnings Chart - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <FaMoneyBillWave className="text-emerald-500" />
                Earnings Overview
              </h3>
              <p className="text-xs text-slate-500 light:text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600 light:text-emerald-600">₹1,600</p>
              <p className="text-xs text-emerald-500 light:text-emerald-500 flex items-center gap-1 justify-end">
                <HiTrendingUp /> +24% from last week
              </p>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fill="url(#colorEarnings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaTasks className="text-blue-500" />
            Order Status
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-500 light:text-slate-500">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaRocket className="text-purple-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center gap-2 p-4 ${action.bgColor} light:${action.bgColor} border border-transparent rounded-xl hover:border-slate-200 light:hover:border-slate-200 transition-all group`}
              >
                <div className="w-10 h-10 bg-white light:bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <action.icon className="text-sm" style={{ color: action.color }} />
                </div>
                <span className="text-xs text-slate-600 light:text-slate-600 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaBell className="text-amber-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-50 light:bg-slate-50 rounded-xl"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${activity.color}15` }}
                >
                  <activity.icon className="text-xs" style={{ color: activity.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 light:text-slate-700 truncate">{activity.text}</p>
                  <p className="text-xs text-slate-400 light:text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Orders Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white light:bg-white border border-slate-200 light:border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaNewspaper className="text-cyan-500" />
            Weekly Orders
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Achievements & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-br from-amber-50 light:from-amber-50 to-orange-50 light:to-orange-50 border border-amber-200 light:border-amber-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaTrophy className="text-amber-500" />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: FaStar, label: 'Top Rated', color: '#F59E0B' },
              { icon: FaFire, label: '10 Orders', color: '#EF4444' },
              { icon: FaRocket, label: 'Fast Delivery', color: '#3B82F6' },
              { icon: FaUserCheck, label: 'Verified', color: '#22C55E' },
            ].map((badge) => (
              <div 
                key={badge.label}
                className="flex items-center gap-2 px-3 py-2 bg-white light:bg-white rounded-xl border border-slate-200 light:border-slate-200 shadow-sm"
              >
                <badge.icon className="text-sm" style={{ color: badge.color }} />
                <span className="text-xs text-slate-700 light:text-slate-700 font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-emerald-50 light:from-emerald-50 to-teal-50 light:to-teal-50 border border-emerald-200 light:border-emerald-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-slate-900 light:text-slate-900 flex items-center gap-2 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FaChartLine className="text-emerald-500" />
            Performance Score
          </h3>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-white light:stroke-white" cx="50" cy="50" r="40" strokeWidth="8" />
                <circle 
                  className="fill-none stroke-emerald-500" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset="40"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600 light:text-emerald-600">84</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 light:text-slate-600">
                Your performance is <span className="text-emerald-600 light:text-emerald-600 font-semibold">Excellent</span>
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 light:text-slate-500">Response Time</span>
                  <span className="text-emerald-600 light:text-emerald-600 font-medium">Fast</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 light:text-slate-500">Completion Rate</span>
                  <span className="text-emerald-600 light:text-emerald-600 font-medium">98%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditorDashboard;
