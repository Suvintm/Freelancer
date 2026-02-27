import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaCheck, FaChevronLeft, FaSearch, FaFilter, FaUsers } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import ClientNavbar from "../components/ClientNavbar";
import AdvancedSearchBar from "../components/AdvancedSearchBar";
import DiscoverCategories from "../components/DiscoverCategories";

const FollowSuggestionsPage = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followStates, setFollowStates] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user?.token) return;
            try {
                const res = await axios.get(`${backendURL}/api/user/suggestions?limit=30`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSuggestions(res.data.suggestions);
                
                const states = {};
                res.data.suggestions.forEach(s => {
                    states[s._id] = { loading: false, isFollowing: false, isPending: false };
                });
                setFollowStates(states);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user?.token, backendURL]);

    const handleFollow = async (e, targetUser) => {
        e.stopPropagation();
        const targetId = targetUser._id;
        if (followStates[targetId]?.loading) return;

        setFollowStates(prev => ({
            ...prev,
            [targetId]: { ...prev[targetId], loading: true }
        }));

        try {
            const res = await axios.post(`${backendURL}/api/user/follow/${targetId}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setFollowStates(prev => ({
                ...prev,
                [targetId]: { 
                    loading: false, 
                    isFollowing: !!res.data.isFollowing, 
                    isPending: !!res.data.isPending 
                }
            }));

            if (res.data.isPending) {
                toast.info("Follow request sent");
            } else if (res.data.isFollowing) {
                toast.success(`Following ${targetUser.name}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
            setFollowStates(prev => ({
                ...prev,
                [targetId]: { ...prev[targetId], loading: false }
            }));
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
            <ClientNavbar />
            
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-10 pb-24 md:px-8">
                {/* Header & Search */}
                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => navigate(-1)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                            >
                                <FaChevronLeft className="text-[10px]" />
                            </button>
                            <div className="flex items-center gap-2">
                                <FaUsers className="text-indigo-400 text-sm" />
                                <h1 className="text-sm font-black tracking-widest uppercase">Discover</h1>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <AdvancedSearchBar 
                            variant="pill"
                            suggestionType="users"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSearch={(val) => setSearchQuery(val)}
                            placeholder="Search people..."
                            className="!w-full"
                        />
                    </div>
                </div>

                {/* Discovery Categories */}
                {!loading && <DiscoverCategories />}

                {/* Main Grid Header */}
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Recommended for You</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence>
                            {suggestions.map((item, idx) => {
                                const state = followStates[item._id] || {};
                                return (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => navigate(item.role === 'editor' ? `/editor/${item._id}` : `/public-profile/${item._id}`)}
                                        className="bg-[#111116] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center group cursor-pointer hover:border-white/10 transition-all relative overflow-hidden"
                                    >
                                        {/* Professional Editor Header */}
                                        {item.role === 'editor' && (
                                            <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-center gap-1 z-20">
                                                <MdVerified className="text-blue-400 text-xs" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Editor</span>
                                            </div>
                                        )}
                                        
                                        <div className="relative mb-4 z-10 mt-4">
                                            <div className="w-20 h-20 rounded-full p-[2px] bg-white/10 group-hover:bg-white/20 transition-colors">
                                                <img 
                                                    src={item.profilePicture} 
                                                    alt={item.name}
                                                    className="w-full h-full rounded-full object-cover border-4 border-[#111116]"
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full mb-6 z-10">
                                            <h3 className="text-sm font-bold text-white truncate w-full mb-1">{item.name}</h3>
                                            <p className="text-[11px] text-gray-500 font-medium truncate w-full">
                                                {item.country || "Global User"}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => handleFollow(e, item)}
                                            disabled={state.loading || state.isFollowing || state.isPending}
                                            className={`w-full py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 z-10 ${
                                                state.isFollowing 
                                                    ? "bg-white/10 text-white cursor-default" 
                                                    : state.isPending
                                                        ? "bg-zinc-800 text-zinc-400 cursor-default"
                                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                                            }`}
                                        >
                                            {state.loading ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : state.isFollowing ? (
                                                <>
                                                    <FaCheck className="text-[10px]" />
                                                    Following
                                                </>
                                            ) : state.isPending ? (
                                                "Requested"
                                            ) : (
                                                <>
                                                    <FaUserPlus className="text-[10px]" />
                                                    Follow
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FollowSuggestionsPage;
