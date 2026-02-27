import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaCheck, FaChevronRight, FaStar, FaUser } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const FollowSuggestions = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followStates, setFollowStates] = useState({}); // { userId: { loading: bool, isFollowing: bool, isPending: bool } }

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user?.token) return;
            try {
                const res = await axios.get(`${backendURL}/api/user/suggestions?limit=10`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSuggestions(res.data.suggestions);
                
                // Initialize follow states
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

    if (loading) {
        return (
            <div className="flex gap-4 overflow-hidden py-2 px-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className="min-w-[140px] h-[180px] bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <h2 className="text-[13px] font-black text-white tracking-wider uppercase">Suggested for you</h2>
                    <p className="text-[10px] text-gray-500 font-medium">Connect with other creators</p>
                </div>
                <button 
                    onClick={() => navigate("/follow-suggestions")}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    View All
                    <FaChevronRight className="text-[9px]" />
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                <AnimatePresence>
                    {suggestions.map((item, idx) => {
                        const state = followStates[item._id] || {};
                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(item.role === 'editor' ? `/editor/${item._id}` : `/public-profile/${item._id}`)}
                                className="relative min-w-[155px] max-w-[155px] bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group cursor-pointer hover:border-white/10 transition-all"
                            >
                                {/* Professional Editor Header */}
                                {item.role === 'editor' && (
                                    <div className="absolute top-2 left-0 right-0 px-3 flex items-center justify-center gap-1">
                                        <MdVerified className="text-blue-400 text-[10px]" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Editor</span>
                                    </div>
                                )}

                                <div className="relative mb-3 mt-4">
                                    <img 
                                        src={item.profilePicture} 
                                        alt={item.name}
                                        className="w-16 h-16 rounded-full object-cover border border-white/10 group-hover:border-white/20 transition-colors"
                                    />
                                </div>

                                <div className="w-full mb-3">
                                    <h3 className="text-xs font-bold text-white truncate w-full">{item.name}</h3>
                                    <p className="text-[9px] text-gray-500 font-medium truncate w-full flex items-center justify-center gap-1">
                                         {item.country || "Global User"}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => handleFollow(e, item)}
                                    disabled={state.loading || state.isFollowing || state.isPending}
                                    className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                                        state.isFollowing 
                                            ? "bg-white/10 text-white cursor-default" 
                                            : state.isPending
                                                ? "bg-zinc-800 text-zinc-400 cursor-default"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                                    }`}
                                >
                                    {state.loading ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : state.isFollowing ? (
                                        <>
                                            <FaCheck className="text-[8px]" />
                                            Following
                                        </>
                                    ) : state.isPending ? (
                                        "Requested"
                                    ) : (
                                        <>
                                            <FaUserPlus className="text-[8px]" />
                                            Follow
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FollowSuggestions;
