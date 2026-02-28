import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiOutlineChevronLeft, 
    HiOutlineMagnifyingGlass, 
    HiOutlineVideoCamera,
    HiOutlineSparkles
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelGridItem from "../components/ReelGridItem.jsx";
import ReelPreviewModal from "../components/ReelPreviewModal.jsx";
import Loader from "../components/Loader.jsx";

const ReelsExplore = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState(null);
    const [previewReel, setPreviewReel] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/reels/tags/unique`);
                setTags(data.tags || []);
            } catch (err) {
                console.error("Failed to fetch tags:", err);
            }
        };

        const fetchInitialReels = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/reels/feed?limit=15`);
                setReels(data.reels || []);
                setHasMore(data.pagination?.hasMore);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch reels:", err);
                setLoading(false);
            }
        };

        fetchTags();
        fetchInitialReels();
    }, [backendURL]);

    // Handle Search/Filter
    const filteredReels = reels.filter(reel => {
        const matchesQuery = !searchQuery || 
            reel.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reel.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesTag = !selectedTag || 
            reel.title?.toLowerCase().includes(selectedTag.replace('#', '').toLowerCase()) ||
            reel.description?.toLowerCase().includes(selectedTag.replace('#', '').toLowerCase());

        return matchesQuery && matchesTag;
    });

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#050509] text-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-[100] bg-[#050509]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 sm:px-8">
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <HiOutlineChevronLeft className="text-xl" />
                    </button>
                    
                    <div className="relative flex-1">
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Explore creative reels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                {/* Tag Pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mt-4 pb-2 max-w-7xl mx-auto">
                    <button 
                        onClick={() => setSelectedTag(null)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                            !selectedTag 
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                    >
                        <HiOutlineSparkles className="text-sm" />
                        Explore All
                    </button>
                    {tags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                                selectedTag === tag 
                                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reel Grid */}
            <div className="max-w-7xl mx-auto px-1 sm:px-8 py-6">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-4">
                    {filteredReels.map((reel) => (
                        <ReelGridItem 
                            key={reel._id} 
                            reel={reel} 
                            onPreviewStart={setPreviewReel}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {filteredReels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <HiOutlineVideoCamera className="text-6xl opacity-20 mb-4" />
                        <p className="text-sm font-medium">No reels found matching your search</p>
                    </div>
                )}
            </div>

            {/* HOLD TO PREVIEW MODAL */}
            <AnimatePresence>
                {previewReel && (
                    <ReelPreviewModal 
                        reel={previewReel} 
                        onClose={() => setPreviewReel(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReelsExplore;
