'use client';

import { motion } from 'framer-motion';
import { 
  Plus, ChevronRight, MoreHorizontal, Search, Filter, 
  ArrowUpRight, Wallet, Landmark, BarChart3, TrendingUp, RefreshCw, ChevronDown
} from 'lucide-react';

const WALLETS = [
  { currency: 'USD', country: 'US', flag: '🇺🇸', amount: '$22,678.00', limit: '$10k a month', status: 'Active' },
  { currency: 'EUR', country: 'EU', flag: '🇪🇺', amount: '€18,345.00', limit: '€8k a month', status: 'Active' },
  { currency: 'BDT', country: 'BD', flag: '🇧🇩', amount: '৳1,22,678.00', limit: '৳10k a month', status: 'Active' },
  { currency: 'GBP', country: 'UK', flag: '🇬🇧', amount: '£15,000.00', limit: '£7.5k a month', status: 'Inactive' },
];

const ACTIVITIES = [
  { activity: 'Software License', id: 'INV_000076', date: '17 Apr, 2026', time: '03:45 PM', price: '$25,500', status: 'Completed', color: 'bg-emerald-500' },
  { activity: 'Flight Ticket', id: 'INV_000077', date: '15 Apr, 2026', time: '11:20 AM', price: '$2,750', status: 'Pending', color: 'bg-amber-500' },
  { activity: 'Office Suply', id: 'INV_000078', date: '12 Apr, 2026', time: '09:00 AM', price: '$1,200', status: 'Cancelled', color: 'bg-red-500' },
];

export default function OverviewPage() {
  return (
    <div className="space-y-10 animate-fade-up px-2">
      
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ui-text-main tracking-tight">Financial Overview</h1>
          <p className="text-sm text-ui-text-dim mt-1">Real-time summary of your administrative data</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-ui-surface border border-ui-border rounded-xl text-[13px] font-semibold shadow-sm hover:bg-ui-surface-hover transition-all">
            This Month <ChevronDown size={14} className="text-ui-text-dim" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-ui-surface border border-ui-border rounded-xl text-[13px] font-semibold shadow-sm hover:bg-ui-surface-hover transition-all">
            <RefreshCw size={14} className="text-ui-text-dim" /> Reset Data
          </button>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Balance Card (Dynamic Forest Theme) */}
          <div className="bento-card p-8 bg-gradient-to-br from-[#00623D] to-[#004D30] text-white overflow-hidden relative group border-none">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all scale-150 rotate-12">
                  <Wallet size={120} />
              </div>
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Wallet size={20} />
                  </div>
                  <div>
                      <h4 className="text-[13px] font-semibold opacity-80">My balance</h4>
                      <p className="text-[10px] opacity-60">Wallet Overview & Spending</p>
                  </div>
              </div>
              <div className="flex items-end justify-between">
                  <div>
                      <h3 className="text-3xl font-bold tracking-tight text-white">$20,520.32</h3>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-white">
                          <TrendingUp size={10} /> +1.5% ↑
                      </div>
                  </div>
              </div>
              <button className="mt-8 w-full py-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold group text-white/80 hover:text-white transition-colors">
                  See details <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>

          {/* Savings Account */}
          <div className="bento-card p-8 group">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-ui-bg flex items-center justify-center border border-ui-border">
                      <Landmark size={20} className="text-brand-forest" />
                  </div>
                  <div>
                      <h4 className="text-[13px] font-semibold text-ui-text-main">Savings account</h4>
                      <p className="text-[10px] text-ui-text-dim">Steady Growth Savings</p>
                  </div>
              </div>
              <div className="flex items-end justify-between">
                  <div>
                      <h3 className="text-3xl font-bold tracking-tight text-ui-text-main">$15,800.45</h3>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold">
                           +3.2% ↑
                      </div>
                  </div>
              </div>
              <button className="mt-8 w-full py-4 border-t border-ui-border flex items-center justify-between text-[11px] font-bold text-ui-text-muted group hover:text-ui-text-main transition-colors">
                  View summary <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>

          {/* Investment Portfolio */}
          <div className="bento-card p-8 group">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-ui-bg flex items-center justify-center border border-ui-border">
                      <BarChart3 size={20} className="text-brand-forest" />
                  </div>
                  <div>
                      <h4 className="text-[13px] font-semibold text-ui-text-main">Investment portfolio</h4>
                      <p className="text-[10px] text-ui-text-dim">Track Your Wealth Growth</p>
                  </div>
              </div>
              <div className="flex items-end justify-between">
                  <div>
                      <h3 className="text-3xl font-bold tracking-tight text-ui-text-main">$50,120.78</h3>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold">
                           +4.7% ↑
                      </div>
                  </div>
              </div>
              <button className="mt-8 w-full py-4 border-t border-ui-border flex items-center justify-between text-[11px] font-bold text-ui-text-muted group hover:text-ui-text-main transition-colors">
                  Analyze performance <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
      </div>

      {/* Second Row: Wallet & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* My Wallet Section */}
          <div className="bento-card p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h3 className="text-lg font-bold text-ui-text-main">My Wallet</h3>
                      <p className="text-xs text-ui-text-dim">Today 1 USD = 122.20 BDT</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-ui-surface border border-ui-border rounded-xl text-[11px] font-bold shadow-sm hover:bg-ui-surface-hover transition-all text-ui-text-main">
                      <Plus size={14} /> Add New
                  </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  {WALLETS.map(w => (
                      <div key={w.currency} className="p-5 rounded-2xl bg-ui-bg border border-ui-border group hover:border-brand-forest/40 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                  <span className="text-xl">{w.flag}</span>
                                  <span className="text-xs font-bold text-ui-text-main">{w.currency}</span>
                              </div>
                              <button><MoreHorizontal size={14} className="text-ui-text-dim" /></button>
                          </div>
                          <h4 className="text-lg font-bold text-ui-text-main mb-1">{w.amount}</h4>
                          <p className="text-[10px] text-ui-text-dim mb-3">Limit is {w.limit}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${w.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {w.status}
                          </span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Cash Flow Chart Mockup */}
          <div className="bento-card p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h4 className="text-xs font-bold text-ui-text-dim mb-1 uppercase tracking-widest">Cash Flow</h4>
                      <h3 className="text-3xl font-bold text-ui-text-main tracking-tight">$342,323.44</h3>
                  </div>
                  <div className="flex bg-ui-bg p-1 rounded-xl border border-ui-border">
                      <button className="px-4 py-2 text-[11px] font-bold rounded-lg text-ui-text-dim">Monthly</button>
                      <button className="px-4 py-2 text-[11px] font-bold rounded-lg bg-[#004D30] text-white shadow-lg">Yearly</button>
                  </div>
              </div>
              
              <div className="flex-1 flex items-end justify-between gap-4 h-64 px-4 pb-4 bg-ui-bg/20 rounded-2xl relative">
                  {/* Decorative Chart Rails */}
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="absolute left-0 right-0 border-t border-ui-border/50" style={{ top: `${i * 20}%` }} />
                  ))}
                  
                  {/* Chart Columns */}
                  {[0.4, 0.6, 1, 0.7, 0.9, 0.5, 0.8].map((h, i) => (
                    <div key={i} className="relative group flex-1">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-500 overflow-hidden relative border-x border-t border-ui-border
                              ${i === 2 ? 'bg-brand-forest shadow-[0_0_20px_rgba(0,100,61,0.2)] border-transparent' : 'bg-ui-border/30 group-hover:bg-ui-text-dim/20'}`} 
                          style={{ height: `${h * 180}px` }} 
                        />
                        {/* Tooltip on active bar */}
                        {i === 2 && (
                            <div className="absolute -top-16 -right-12 w-32 p-3 bg-zinc-900 text-white rounded-xl shadow-2xl z-20 border border-white/5">
                                <p className="text-[10px] text-zinc-400 mb-1 font-bold italic">July 23, 2026</p>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-semibold">Cashflow</span>
                                    <span className="font-bold">$33,847</span>
                                </div>
                            </div>
                        )}
                    </div>
                  ))}
              </div>
              <div className="flex justify-between px-4 mt-4">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(m => (
                    <span key={m} className="text-[10px] font-bold text-ui-text-dim uppercase">{m}</span>
                  ))}
              </div>
          </div>
      </div>

      {/* Table Section: Recent Activities */}
      <div className="bento-card p-10 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-ui-text-main">Recent Activities</h3>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 h-10 px-4 bg-ui-bg border border-ui-border rounded-xl w-64">
                      <Search size={14} className="text-ui-text-dim" />
                      <input type="text" placeholder="Search" className="bg-transparent outline-none text-[12px] w-full text-ui-text-main placeholder:text-ui-text-dim" />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-ui-surface border border-ui-border rounded-xl text-[12px] font-bold shadow-sm hover:bg-ui-surface-hover transition-all text-ui-text-main">
                      <Filter size={14} /> Filter
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-ui-border">
                          <th className="pb-6 w-12"><div className="w-5 h-5 rounded-md border border-ui-border" /></th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4">Activity</th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4">Order ID</th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4">Date</th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4">Time</th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4 text-center">Price</th>
                          <th className="pb-6 text-[11px] font-bold text-ui-text-dim uppercase tracking-widest px-4 text-center">Status</th>
                          <th className="pb-6 w-12" />
                      </tr>
                  </thead>
                  <tbody>
                      {ACTIVITIES.map((a, i) => (
                          <tr key={i} className="group hover:bg-ui-bg transition-colors">
                              <td className="py-6"><div className="w-5 h-5 rounded-md border border-ui-border group-hover:border-ui-text-dim transition-colors" /></td>
                              <td className="py-6 px-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-ui-surface flex items-center justify-center font-black text-ui-text-main text-[10px] border border-ui-border shadow-sm">
                                          {a.activity[0]}
                                      </div>
                                      <span className="text-sm font-bold text-ui-text-main">{a.activity}</span>
                                  </div>
                              </td>
                              <td className="py-6 px-4 text-sm font-medium text-ui-text-muted">{a.id}</td>
                              <td className="py-6 px-4 text-sm font-medium text-ui-text-muted">{a.date}</td>
                              <td className="py-6 px-4 text-sm font-medium text-ui-text-dim font-mono tracking-tighter">{a.time}</td>
                              <td className="py-6 px-4 text-sm font-bold text-ui-text-main text-center">{a.price}</td>
                              <td className="py-6 px-4 text-center">
                                  <div className="inline-flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${a.color}`} />
                                      <span className="text-[12px] font-bold text-ui-text-main">{a.status}</span>
                                  </div>
                              </td>
                              <td className="py-6 text-right cursor-pointer"><MoreHorizontal size={14} className="text-ui-text-dim hover:text-ui-text-main ml-auto" /></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
}
