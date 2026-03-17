import { useState, useEffect } from "react";
import { 
  HiOutlineCloud, 
  HiOutlineTrash, 
  HiOutlineMagnifyingGlass, 
  HiOutlineFunnel,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineDocument,
  HiOutlineArrowDownTray,
  HiOutlinePencilSquare,
  HiOutlineEllipsisVertical,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { storageApi } from "../api/adminApi";
import { formatBytes } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, subValue, icon: Icon, color, percent }) => (
  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
        <Icon className="text-xl" />
      </div>
      {percent !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${percent > 80 ? 'red' : 'green'}-50 dark:bg-${percent > 80 ? 'red' : 'green'}-500/10 text-${percent > 80 ? 'red' : 'green'}-600`}>
          {percent}%
        </span>
      )}
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    
    {percent !== undefined && (
      <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full bg-${color}-500`}
        />
      </div>
    )}
  </div>
);

const AssetCard = ({ asset, isSelected, onToggle, onDelete, onRename }) => {
  const [isHovered, setIsHovered] = useState(false);
  const resourceType = asset.resource_type;
  const isImage = resourceType === "image";
  const isVideo = resourceType === "video";
  const date = new Date(asset.created_at).toLocaleDateString();

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 bg-white dark:bg-zinc-900 ${
        isSelected 
          ? "border-purple-500 ring-2 ring-purple-500/20" 
          : "border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm"
      }`}
    >
      {/* Thumbnail Area */}
      <div className="aspect-square relative bg-gray-50 dark:bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => onToggle(asset.public_id)}>
        {isImage ? (
          <img 
            src={asset.secure_url.replace('/upload/', '/upload/w_400,c_fill/')} 
            alt={asset.public_id}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineVideoCamera className="text-4xl text-gray-300" />
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="bg-white/90 dark:bg-zinc-800/90 p-2 rounded-full text-purple-600">
                  <HiOutlineVideoCamera size={20} />
               </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineDocument className="text-4xl text-gray-300" />
          </div>
        )}

        {/* Selection Overlay */}
        <div className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${isSelected ? "opacity-100" : isHovered ? "opacity-100" : "opacity-0"}`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-purple-600 border-purple-600" : "bg-white/80 border-gray-300"}`}>
            {isSelected && <HiOutlineCheck size={12} className="text-white" />}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`absolute top-3 right-3 z-10 flex gap-2 transition-all duration-200 ${isHovered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(asset.secure_url, '_blank') }}
            className="p-1.5 bg-white/90 dark:bg-zinc-800/90 rounded-lg text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors shadow-sm"
          >
            <HiOutlineArrowDownTray size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(asset) }}
            className="p-1.5 bg-white/90 dark:bg-zinc-800/90 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors shadow-sm"
          >
            <HiOutlineTrash size={14} />
          </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-[12px] font-bold text-gray-900 dark:text-white truncate" title={asset.public_id}>
              {asset.public_id.split('/').pop()}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span>{asset.format.toUpperCase()}</span>
              <span>•</span>
              <span>{formatBytes(asset.bytes)}</span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(asset) }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors text-gray-400"
          >
            <HiOutlinePencilSquare size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const CloudinaryManager = () => {
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [history, setHistory] = useState([null]); // Backstack for pagination
  const [page, setPage] = useState(1);
  const [resourceType, setResourceType] = useState("image");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await storageApi.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error("Failed to fetch storage stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async (cursor = null) => {
    try {
      setResourcesLoading(true);
      const params = {
        resource_type: resourceType,
        max_results: 20,
        next_cursor: cursor
      };
      
      if (folder) params.prefix = folder;

      const res = await storageApi.getResources(params);
      if (res.data.success) {
        setResources(res.data.resources);
        setNextCursor(res.data.next_cursor);
      }
    } catch (err) {
      toast.error("Failed to fetch resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchResources();
    setHistory([null]);
    setPage(1);
    setSelectedIds([]);
  }, [resourceType, folder]);

  const handleNextPage = () => {
    if (nextCursor) {
      setHistory([...history, nextCursor]);
      fetchResources(nextCursor);
      setPage(page + 1);
      setSelectedIds([]);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevCursor = history[page - 2];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      fetchResources(prevCursor);
      setPage(page - 1);
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleDeleteAsset = async (asset) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${asset.public_id}"? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      const res = await storageApi.deleteFile(asset.public_id);
      if (res.data.success) {
        toast.success("File deleted permanently");
        setResources(prev => prev.filter(r => r.public_id !== asset.public_id));
        fetchData(); // Refresh stats
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} files PERMANENTLY?`)) return;

    try {
      setIsDeleting(true);
      const res = await storageApi.bulkDelete(selectedIds);
      if (res.data.success) {
        toast.success(`Successfully deleted ${selectedIds.length} files`);
        setResources(prev => prev.filter(r => !selectedIds.includes(r.public_id)));
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      toast.error("Bulk deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async (asset) => {
    const newName = window.prompt("Enter new public ID (relative path):", asset.public_id);
    if (!newName || newName === asset.public_id) return;

    try {
      // Note: We need to add rename to adminApi.js first, or call it directly.
      // For now, let's just show a toast that this feature is coming soon if not implemented.
      toast.error("Rename feature is currently restricted. Please use delete and re-upload.");
    } catch (err) {
      toast.error("Failed to rename");
    }
  };

  const filteredResources = resources.filter(r => 
    r.public_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mb-1">
              <HiOutlineCloud size={24} />
              <span className="uppercase tracking-widest text-xs">Infrastructure</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Cloudinary Storage</h1>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">Manage global CDN assets, analyze usage, and clean up storage.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchData(); fetchResources(); }} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
              <HiOutlineArrowPath className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20">
              CDN Settings
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-zinc-900 rounded-2xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Storage Usage" 
              value={stats.storage.usedFormatted} 
              subValue={`Limit: ${stats.storage.limitFormatted}`}
              icon={HiOutlineCloud} 
              color="purple" 
              percent={stats.storage.percent}
            />
            <StatCard 
              title="Bandwidth (30d)" 
              value={stats.bandwidth.usedFormatted} 
              subValue={`Limit: ${stats.bandwidth.limitFormatted}`}
              icon={HiOutlineChartBar} 
              color="blue" 
              percent={stats.bandwidth.percent}
            />
            <StatCard 
              title="Transformations" 
              value={stats.resources.images + stats.resources.videos} 
              subValue={`${stats.resources.images} images, ${stats.resources.videos} videos`}
              icon={HiOutlinePhoto} 
              color="green" 
            />
             <StatCard 
              title="Service Plan" 
              value={stats.plan} 
              subValue={`Last Sync: ${new Date(stats.lastUpdated).toLocaleTimeString()}`}
              icon={HiOutlineCheckCircle} 
              color="orange" 
            />
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
             <HiOutlineExclamationTriangle className="mx-auto text-4xl text-amber-500 mb-4" />
             <h3 className="text-gray-900 dark:text-white font-bold">Analytics Unavailable</h3>
             <p className="text-gray-500 dark:text-zinc-500 text-sm">Verify your Cloudinary API credentials in .env</p>
          </div>
        )}

        {/* Explorer Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          
          {/* Controls Hook */}
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-zinc-950 rounded-xl">
               <button 
                  onClick={() => setResourceType("image")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${resourceType === "image" ? "bg-white dark:bg-zinc-800 text-purple-600 shadow-sm border border-gray-100 dark:border-zinc-700" : "text-gray-500"}`}
               >
                 Images
               </button>
               <button 
                  onClick={() => setResourceType("video")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${resourceType === "video" ? "bg-white dark:bg-zinc-800 text-purple-600 shadow-sm border border-gray-100 dark:border-zinc-700" : "text-gray-500"}`}
               >
                 Videos
               </button>
            </div>

            <div className="flex flex-1 items-center gap-3">
               <div className="relative flex-1">
                 <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search by public_id..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-purple-500 transition-colors dark:text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <div className="relative">
                  <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none appearance-none font-medium dark:text-white"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                   >
                    <option value="">All Folders</option>
                    <option value="profiles">Profiles</option>
                    <option value="advertisements">Ads</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="final-outputs">Deliveries</option>
                  </select>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <AnimatePresence>
                 {selectedIds.length > 0 && (
                   <motion.button 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 transition-all"
                   >
                     <HiOutlineTrash />
                     Delete Selected ({selectedIds.length})
                   </motion.button>
                 )}
               </AnimatePresence>
               <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={page === 1}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 dark:text-white"
                  >
                    <HiOutlineChevronLeft />
                  </button>
                  <span className="text-xs font-bold px-2 dark:text-white">Page {page}</span>
                  <button 
                    onClick={handleNextPage} 
                    disabled={!nextCursor}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 dark:text-white"
                  >
                    <HiOutlineChevronRight />
                  </button>
               </div>
            </div>
          </div>

          {/* Asset Grid */}
          <div className="flex-1 p-6">
            {resourcesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-50 dark:bg-zinc-950 rounded-2xl animate-pulse border border-gray-100 dark:border-zinc-900" />
                ))}
              </div>
            ) : filteredResources.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredResources.map((asset) => (
                    <AssetCard 
                      key={asset.public_id} 
                      asset={asset}
                      isSelected={selectedIds.includes(asset.public_id)}
                      onToggle={toggleSelect}
                      onDelete={handleDeleteAsset}
                      onRename={handleRename}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mb-4">
                  <HiOutlineMagnifyingGlass className="text-2xl text-gray-300" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold">No assets found</h3>
                <p className="text-gray-500 dark:text-zinc-500 text-sm max-w-xs mt-1">Try changing your filters or searching for a different public_id prefix.</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   Admin API Status: Connected
                </div>
             </div>
             <p className="text-[10px] text-gray-400 font-medium">Cloudinary Regional Region: Asia-Pacific (ap-south-1)</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CloudinaryManager;
