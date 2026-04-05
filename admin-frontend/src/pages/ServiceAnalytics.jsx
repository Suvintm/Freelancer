import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloud, FaDatabase, FaCreditCard, FaSync, FaChartLine,
  FaImage, FaVideo, FaFile, FaExclamationTriangle, FaCheckCircle,
  FaServer, FaNetworkWired, FaHdd, FaClock, FaExternalLinkAlt
} from "react-icons/fa";
import {
  HiOutlineChartBar, HiOutlineCurrencyRupee, HiOutlineServer, HiOutlineCloud
} from "react-icons/hi2";
import { analyticsApi } from "../api/adminApi";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

const ServiceAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Queries ──────────────────────────────────────────────────────────────

  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.getOverview().then(res => res.data.data),
    enabled: activeTab === "overview"
  });

  const cloudinaryQuery = useQuery({
    queryKey: ["analytics", "cloudinary"],
    queryFn: () => analyticsApi.getCloudinary().then(res => res.data.data),
    enabled: activeTab === "cloudinary"
  });

  const mongoQuery = useQuery({
    queryKey: ["analytics", "mongodb"],
    queryFn: () => analyticsApi.getMongoDB().then(res => res.data.data),
    enabled: activeTab === "mongodb"
  });

  const razorpayQuery = useQuery({
    queryKey: ["analytics", "razorpay"],
    queryFn: () => analyticsApi.getRazorpay().then(res => res.data.data),
    enabled: activeTab === "razorpay"
  });

  const healthQuery = useQuery({
    queryKey: ["analytics", "health"],
    queryFn: () => analyticsApi.getServiceHealth().then(res => res.data.data),
    refetchInterval: 15000 // Polling every 15s for "live" feel
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ProgressBar = ({ percent, color = "violet" }) => {
    const colorClasses = {
      violet: "bg-brand",
      blue: "bg-info",
      green: "bg-success",
      amber: "bg-warning",
      red: "bg-danger"
    };

    const displayColor = percent > 90 ? "red" : percent > 75 ? "amber" : color;

    return (
      <div className="h-1.5 w-full bg-base rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${colorClasses[displayColor]}`}
        />
      </div>
    );
  };

  // ── Tab Renderers ───────────────────────────────────────────────────────

  const renderOverview = () => {
    const data = overviewQuery.data;
    const isLoading = overviewQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Cloudinary" 
            value={data?.cloudinary?.storage || "0 B"} 
            icon={<FaCloud />} 
            color="violet" 
            loading={isLoading}
          />
          <StatCard 
            title="MongoDB Size" 
            value={data?.mongodb?.size || "0 B"} 
            icon={<FaDatabase />} 
            color="green" 
            loading={isLoading}
          />
          <StatCard 
            title="Total Revenue" 
            value={data?.platform?.revenue || 0} 
            prefix="₹"
            icon={<FaCreditCard />} 
            color="blue" 
            loading={isLoading}
          />
          <StatCard 
            title="Platform Orders" 
            value={data?.platform?.orders || 0} 
            icon={<FaServer />} 
            color="amber" 
            loading={isLoading}
          />
        </div>

        <div className="bg-surface border border-border-default rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
             <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Monitor</span>
             </div>
          </div>
          <h3 className="text-xl font-bold text-primary mb-6">Service Health Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { 
                name: "PostgreSQL Identity", 
                status: healthQuery.data?.postgresql?.status || "Checking...", 
                latency: healthQuery.data?.postgresql?.latency,
                icon: FaNetworkWired, 
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              { 
                name: "MongoDB Persistence", 
                status: healthQuery.data?.mongodb?.status || "Checking...", 
                latency: healthQuery.data?.mongodb?.latency,
                icon: FaDatabase, 
                color: "text-success",
                bg: "bg-success/10"
              },
              { 
                name: "Cloudinary CDN", 
                status: healthQuery.data?.cloudinary?.status || "Checking...", 
                icon: FaCloud, 
                color: "text-brand",
                bg: "bg-brand/10"
              },
              { 
                name: "Razorpay Gateway", 
                status: healthQuery.data?.razorpay?.status || "Checking...", 
                icon: FaCreditCard, 
                color: "text-info",
                bg: "bg-info/10"
              }
            ].map(service => (
              <div key={service.name} className="flex flex-col gap-4 p-6 bg-elevated/40 backdrop-blur-sm rounded-2xl border border-border-default hover:border-brand/30 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.bg} ${service.color} group-hover:scale-110 transition-transform`}>
                  <service.icon className="text-2xl" />
                </div>
                <div>
                  <p className="font-bold text-primary text-sm">{service.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${service.status === "operational" ? "bg-success" : "bg-warning animate-pulse"}`} />
                      <p className="text-xs text-secondary font-medium uppercase tracking-tighter">
                        {service.status?.replace("_", " ")}
                      </p>
                    </div>
                    {service.latency !== undefined && (
                      <span className="text-[10px] font-mono text-muted">{service.latency}ms</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCloudinary = () => {
    const data = cloudinaryQuery.data;
    const isLoading = cloudinaryQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border-default p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-muted uppercase tracking-widest">Storage</span>
               <FaHdd className="text-brand" />
             </div>
             <div>
               <p className="text-2xl font-bold text-primary leading-none">{data?.storage?.usedFormatted}</p>
               <p className="text-xs text-muted mt-2">of {data?.storage?.limitFormatted}</p>
             </div>
             <ProgressBar percent={data?.storage?.percent} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bandwidth</span>
               <FaNetworkWired className="text-blue-500" />
             </div>
             <div>
               <p className="text-2xl font-bold text-white leading-none">{data?.bandwidth?.usedFormatted}</p>
               <p className="text-xs text-zinc-500 mt-2">of {data?.bandwidth?.limitFormatted}</p>
             </div>
             <ProgressBar percent={data?.bandwidth?.percent} color="blue" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Credits</span>
               <FaCreditCard className="text-emerald-500" />
             </div>
             <div>
               <p className="text-2xl font-bold text-white leading-none">{data?.credits?.used}</p>
               <p className="text-xs text-zinc-500 mt-2">of {data?.credits?.limit} credits</p>
             </div>
             <ProgressBar percent={data?.credits?.percent} color="green" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resources</span>
               <FaImage className="text-amber-500" />
             </div>
             <div>
               <p className="text-2xl font-bold text-white leading-none">{data?.resources?.total || 0}</p>
               <p className="text-xs text-zinc-500 mt-2">Files stored</p>
             </div>
             <div className="flex gap-1">
               <div className="h-1.5 flex-1 bg-blue-500 rounded-full" title="Images" />
               <div className="h-1.5 flex-1 bg-violet-500 rounded-full" title="Videos" />
               <div className="h-1.5 flex-1 bg-zinc-800 rounded-full" title="Raw" />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h3 className="font-bold text-white mb-6">Resource Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                 <div className="p-6 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 text-center">
                    <FaImage className="mx-auto text-3xl text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{data?.resources?.images || 0}</p>
                    <p className="text-xs text-zinc-500">Images</p>
                 </div>
                 <div className="p-6 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 text-center">
                    <FaVideo className="mx-auto text-3xl text-violet-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{data?.resources?.videos || 0}</p>
                    <p className="text-xs text-zinc-500">Videos</p>
                 </div>
                 <div className="p-6 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 text-center">
                    <FaFile className="mx-auto text-3xl text-amber-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{data?.resources?.raw || 0}</p>
                    <p className="text-xs text-zinc-500">Documents</p>
                 </div>
              </div>
           </div>

            <div className="bg-surface border border-border-default rounded-3xl p-8">
               <h3 className="font-bold text-primary mb-6">Account Plan</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-brand-light rounded-2xl border border-brand/20">
                     <span className="text-brand font-medium">{data?.plan} Plan</span>
                     <FaExternalLinkAlt className="text-xs text-brand" />
                  </div>
                  <div className="p-5 bg-elevated rounded-2xl space-y-2">
                     <p className="text-xs text-muted uppercase tracking-widest">Est. Monthly Cost</p>
                     <p className="text-2xl font-bold text-primary">${data?.estimatedCost?.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-secondary px-2 italic">
                     Based on current credit usage and free tier limits.
                  </p>
               </div>
            </div>
        </div>
      </div>
    );
  };

  const renderMongoDB = () => {
    const data = mongoQuery.data;
    const isLoading = mongoQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Storage Used" value={data?.storage?.usedFormatted} color="green" loading={isLoading} />
          <StatCard title="Collections" value={data?.collections?.count} color="blue" loading={isLoading} />
          <StatCard title="Documents" value={data?.documents?.total?.toLocaleString()} color="violet" loading={isLoading} />
          <StatCard title="Active Conn" value={data?.connections?.current} color="amber" loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface border border-border-default rounded-3xl overflow-hidden shadow-sm">
               <div className="p-8 border-b border-border-default flex justify-between items-center bg-elevated/20">
                  <h3 className="font-bold text-primary">Collections Data Usage</h3>
                  <span className="text-xs text-muted">Top 20 by size</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-elevated/30">
                        <tr className="text-muted text-[10px] font-bold uppercase tracking-widest">
                           <th className="px-8 py-4">Collection</th>
                           <th className="px-8 py-4">Docs</th>
                           <th className="px-8 py-4">Size</th>
                           <th className="px-8 py-4 text-right">Indices</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border-default">
                        {data?.collections?.details?.map(coll => (
                           <tr key={coll.name} className="hover:bg-elevated/30 transition">
                              <td className="px-8 py-4 font-medium text-primary text-sm">{coll.name}</td>
                              <td className="px-8 py-4 text-secondary text-sm">{coll.count.toLocaleString()}</td>
                              <td className="px-8 py-4 text-secondary text-sm">{coll.sizeFormatted}</td>
                              <td className="px-8 py-4 text-secondary text-right text-sm">{coll.indexes}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-sm">
                  <h3 className="font-bold text-primary mb-6">Storage Quota</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Quota (M0 Free)</span>
                        <span className="text-primary font-bold">{data?.storage?.freeTierLimitFormatted || "512 MB"}</span>
                     </div>
                     <ProgressBar percent={data?.storage?.percentUsed || 0} color="green" />
                     <p className="text-xs text-muted text-center">
                        {data?.storage?.percentUsed || 0}% of Atlas free tier used
                     </p>
                  </div>
               </div>

               <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-sm">
                  <h3 className="font-bold text-primary mb-6">Operation Counters</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-elevated rounded-2xl border border-border-default/50">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Queries</p>
                        <p className="text-xl font-bold text-info">{data?.operations?.queries?.toLocaleString() || 0}</p>
                     </div>
                     <div className="p-4 bg-elevated rounded-2xl border border-border-default/50">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Inserts</p>
                        <p className="text-xl font-bold text-success">{data?.operations?.inserts?.toLocaleString() || 0}</p>
                     </div>
                     <div className="p-4 bg-elevated rounded-2xl border border-border-default/50">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Updates</p>
                        <p className="text-xl font-bold text-warning">{data?.operations?.updates?.toLocaleString() || 0}</p>
                     </div>
                     <div className="p-4 bg-elevated rounded-2xl border border-border-default/50">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Deletes</p>
                        <p className="text-xl font-bold text-danger">{data?.operations?.deletes?.toLocaleString() || 0}</p>
                     </div>
                  </div>
               </div>
            </div>
        </div>
      </div>
    );
  };

  const renderRazorpay = () => {
    const data = razorpayQuery.data;
    const isLoading = razorpayQuery.isLoading;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Revenue (MTD)" value={data?.revenue?.month || 0} prefix="₹" color="blue" loading={isLoading} />
          <StatCard title="Transactions" value={data?.transactions?.month || 0} color="violet" loading={isLoading} />
          <StatCard title="Platform Fees" value={data?.platformFees?.month || 0} prefix="₹" color="green" loading={isLoading} />
          <StatCard title="Refunds" value={data?.refunds?.totalAmount || 0} prefix="₹" color="red" loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-surface border border-border-default rounded-3xl p-8 shadow-sm">
              <h3 className="font-bold text-primary mb-6">Recent Activity</h3>
              <div className="space-y-4">
                 {(data?.recentPayments || []).length === 0 ? (
                    <div className="py-12 text-center">
                       <p className="text-sm text-muted">No recent payment activity.</p>
                    </div>
                 ) : data?.recentPayments?.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-elevated rounded-2xl border border-border-default">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === "completed" ? "bg-success/10 text-success" : "bg-muted/10 text-muted"}`}>
                             <FaCreditCard />
                          </div>
                          <div>
                             <p className="font-bold text-primary text-sm">₹{p.amount.toLocaleString()}</p>
                             <p className="text-xs text-muted font-medium">{p.client} ➔ {p.editor}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${p.status === "completed" ? "text-success" : "text-muted"}`}>{p.status}</p>
                          <p className="text-[10px] text-muted mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-sm">
              <h3 className="font-bold text-primary mb-6">Financial Overview</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-2">Total Gross Volume</p>
                    <p className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(data?.revenue?.total || 0)}</p>
                 </div>
                 
                 <div className="pt-6 border-t border-border-default space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-secondary font-medium">Platform Fees</span>
                       <span className="text-sm font-bold text-success">{formatCurrency(data?.platformFees?.total || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-secondary font-medium">Gateway Costs (Est)</span>
                       <span className="text-sm font-bold text-warning">-{formatCurrency(data?.razorpayFees?.estimated || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-elevated rounded-2xl border border-border-default/50">
                       <span className="text-sm font-bold text-primary">Net Profit</span>
                       <span className="text-sm font-bold text-brand">{formatCurrency((data?.platformFees?.total || 0) - (data?.razorpayFees?.estimated || 0))}</span>
                    </div>
                 </div>

                 <div className="pt-4">
                    <a 
                      href="https://dashboard.razorpay.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold transition shadow-lg shadow-brand/20 text-sm"
                    >
                       Razorpay Dashboard <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <PageHeader 
          title="Infrastructure Monitoring" 
          subtitle="Real-time health and usage of platform services"
          icon={<FaChartLine className="text-brand" />}
        />
        
        <button
          onClick={() => {
            overviewQuery.refetch();
            cloudinaryQuery.refetch();
            mongoQuery.refetch();
            razorpayQuery.refetch();
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-elevated border border-border-default text-primary rounded-xl font-bold transition text-sm shadow-sm"
        >
          <FaSync className={(overviewQuery.isFetching || cloudinaryQuery.isFetching || mongoQuery.isFetching || razorpayQuery.isFetching) ? "animate-spin" : ""} />
          Manual Refetch
        </button>
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border-default bg-surface/30 px-2 rounded-t-2xl">
        {[
          { id: "overview", label: "Health Overview", icon: HiOutlineChartBar },
          { id: "cloudinary", label: "Cloudinary CDN", icon: HiOutlineCloud },
          { id: "mongodb", label: "MongoDB Atlas", icon: HiOutlineServer },
          { id: "razorpay", label: "Razorpay Gateway", icon: HiOutlineCurrencyRupee },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap text-sm ${activeTab === tab.id ? "text-brand border-b-2 border-brand" : "text-secondary hover:text-primary hover:bg-elevated/50 rounded-t-lg"}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "cloudinary" && renderCloudinary()}
        {activeTab === "mongodb" && renderMongoDB()}
        {activeTab === "razorpay" && renderRazorpay()}
      </div>
      
      <div className="mt-8 pt-6 border-t border-border-default flex justify-between items-center text-muted text-xs">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-medium">
               <div className={`w-2.5 h-2.5 rounded-full ${healthQuery.data?.postgresql?.status === 'operational' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} /> 
               Identity Core (PG)
            </div>
            <div className="flex items-center gap-2 font-medium">
               <div className={`w-2.5 h-2.5 rounded-full ${healthQuery.data?.mongodb?.status === 'operational' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} /> 
               Transactional Data (Mongo)
            </div>
         </div>
         <div className="flex items-center gap-2 font-medium">
            <FaClock size={12} /> Last global sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
};

export default ServiceAnalytics;
