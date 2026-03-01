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
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
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
    const [showComments, setShowComments] = useState(false);
    const [activeReel, setActiveReel] = useState(null);



    const handleCommentClick = (reelId) => {
        const reel = reels.find(r => r._id === reelId);
        setActiveReel(reel);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        setReels((prev) =>
            prev.map((r) =>
                r._id === activeReel?._id ? { ...r, commentsCount: newCount } : r
            )
        );
        if (previewReel?._id === activeReel?._id) {
            setPreviewReel(prev => ({ ...prev, commentsCount: newCount }));
        }
    };

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
            {/* Sticky Header - Refined Pill Design */}
            <div className="sticky top-0 z-[100] bg-[#050509]/95 backdrop-blur-xl px-4 py-4 w-full">
                <div className="max-w-[500px] mx-auto flex flex-col gap-4">
                    {/* Search Pill */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                            <HiOutlineChevronLeft className="text-xl" />
                        </button>
                        
                        <div className="relative flex-1 flex items-center bg-white rounded-full overflow-hidden shadow-lg border border-white/20">
                            <HiOutlineMagnifyingGlass className="absolute left-4 text-zinc-400 text-lg" />
                            <input 
                                type="text" 
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent py-2.5 pl-11 pr-24 text-sm text-black focus:outline-none placeholder:text-zinc-400 font-semibold"
                            />
                            <button className="absolute right-1 top-1 bottom-1 px-5 bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-full hover:bg-zinc-800 transition-colors">
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Tag Pills - Minimalist */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button 
                            onClick={() => setSelectedTag(null)}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                !selectedTag 
                                ? "bg-black text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                                : "bg-transparent border-white/10 text-zinc-500 hover:text-white"
                            }`}
                        >
                            <HiOutlineSparkles className="text-sm" />
                            Explore
                        </button>
                        {tags.map(tag => (
                            <button 
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    selectedTag === tag 
                                    ? "bg-black text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                                    : "bg-transparent border-white/10 text-zinc-500 hover:text-white"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
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
                        onCommentClick={handleCommentClick}
                    />
                )}
            </AnimatePresence>

            {/* COMMENT SECTION DRAWER */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]"
                            onClick={() => setShowComments(false)}
                        />
                        <ReelCommentsDrawer
                            reel={activeReel}
                            onClose={() => setShowComments(false)}
                            onCommentAdded={handleCommentAdded}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReelsExplore;
