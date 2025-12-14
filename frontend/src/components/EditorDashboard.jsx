/**
 * EditorDashboard - Advanced Dashboard Component
 * Features: Charts, Stats, Activity Feed, Quick Actions
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
import { HiTrendingUp, HiTrendingDown, HiLightningBolt } from 'react-icons/hi';
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
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Active Gigs', 
      value: stats?.activeGigs || 0, 
      icon: FaBriefcase, 
      color: '#3B82F6',
      trend: '+3',
      trendUp: true
    },
    { 
      label: 'Profile Views', 
      value: 248, 
      icon: FaEye, 
      color: '#A855F7',
      trend: '+18%',
      trendUp: true
    },
    { 
      label: 'Response Rate', 
      value: '94%', 
      icon: FaUserCheck, 
      color: '#F59E0B',
      trend: '-2%',
      trendUp: false
    },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Create Gig', icon: FaRocket, path: '/create-gig', color: '#22C55E' },
    { label: 'View Orders', icon: FaClipboardList, path: '/my-orders', color: '#3B82F6' },
    { label: 'Analytics', icon: FaChartLine, path: '/editor-analytics', color: '#A855F7' },
    { label: 'Payments', icon: FaWallet, path: '/payments', color: '#F59E0B' },
  ];

  // Recent activity
  const recentActivity = [
    { type: 'order', text: 'New order received', time: '2 min ago', icon: FaClipboardList, color: '#22C55E' },
    { type: 'view', text: 'Profile viewed by client', time: '15 min ago', icon: FaEye, color: '#A855F7' },
    { type: 'message', text: 'New message from buyer', time: '1 hour ago', icon: FaBell, color: '#3B82F6' },
    { type: 'review', text: 'You received a 5-star review!', time: '3 hours ago', icon: FaStar, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Greeting */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <HiLightningBolt className="text-amber-400" />
            {greeting()}, {user?.name?.split(' ')[0] || 'Editor'}!
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5">
            Here's what's happening with your account
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaCalendarAlt className="text-gray-600" />
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Quick Stats Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0a0a0c] border border-white/5 rounded-xl p-3 md:p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="text-sm" style={{ color: stat.color }} />
              </div>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                stat.trendUp ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.trendUp ? <FaArrowUp className="text-[8px]" /> : <FaArrowDown className="text-[8px]" />}
                {stat.trend}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        
        {/* Earnings Chart - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FaMoneyBillWave className="text-emerald-400 text-xs" />
                Earnings Overview
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">₹1,600</p>
              <p className="text-[10px] text-emerald-400/70 flex items-center gap-1 justify-end">
                <HiTrendingUp /> +24% from last week
              </p>
            </div>
          </div>
          <div className="h-36 md:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px'
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
          className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FaTasks className="text-blue-400 text-xs" />
            Order Status
          </h3>
          <div className="h-28 md:h-32">
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
          <div className="flex justify-center gap-3 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FaRocket className="text-purple-400 text-xs" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.05] hover:border-white/10 transition-all group"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="text-sm" style={{ color: action.color }} />
                </div>
                <span className="text-[10px] text-gray-400 group-hover:text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FaBell className="text-amber-400 text-xs" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg"
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${activity.color}15` }}
                >
                  <activity.icon className="text-[10px]" style={{ color: activity.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{activity.text}</p>
                  <p className="text-[10px] text-gray-500">{activity.time}</p>
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
          className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FaNewspaper className="text-cyan-400 text-xs" />
            Weekly Orders
          </h3>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Achievements & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FaTrophy className="text-amber-400 text-xs" />
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/30 rounded-full border border-white/5"
              >
                <badge.icon className="text-[10px]" style={{ color: badge.color }} />
                <span className="text-[10px] text-gray-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/10 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <FaChartLine className="text-emerald-400 text-xs" />
            Performance Score
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-white/5" cx="50" cy="50" r="40" strokeWidth="8" />
                <circle 
                  className="fill-none stroke-emerald-400" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset="40"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-400">84</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Your performance is <span className="text-emerald-400 font-semibold">Excellent</span></p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Response Time</span>
                  <span className="text-emerald-400">Fast</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Completion Rate</span>
                  <span className="text-emerald-400">98%</span>
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
