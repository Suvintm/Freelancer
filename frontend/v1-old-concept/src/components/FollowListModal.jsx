import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiUserGroup, HiMagnifyingGlass } from "react-icons/hi2";
import { FaUserPlus, FaCheck, FaUser } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { repairUrl } from "../utils/urlHelper.jsx";

const FollowListModal = ({ isOpen, onClose, userId, type }) => {
  const { user, setUser, backendURL } = useAppContext();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchList();
    }
  }, [isOpen, userId, type]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const endpoint = type === "followers" ? `/api/user/followers/${userId}` : `/api/user/following/${userId}`;
      const res = await axios.get(`${backendURL}${endpoint}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = type === "followers" ? res.data.followers : res.data.following;
      setList(data || []);
      
      // Initialize follow states
      const states = {};
      (data || []).forEach(u => {
        const isFollowed = user?.following?.some(id => id.toString() === u._id.toString());
        states[u._id] = { loading: false, isFollowing: !!isFollowed };
      });
      setFollowStates(states);
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
      toast.error(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (e, targetUser) => {
    e.stopPropagation();
    const targetId = targetUser._id;
    if (followStates[targetId]?.loading) return;

    setFollowStates(prev => ({ ...prev, [targetId]: { ...prev[targetId], loading: true } }));

    try {
      const res = await axios.post(`${backendURL}/api/user/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.data.isFollowing) {
        setFollowStates(prev => ({
          ...prev,
          [targetId]: { loading: false, isFollowing: true, isPending: false },
        }));
        setUser(prev => ({ ...prev, following: [...(prev?.following || []), targetId] }));
      } else {
        setFollowStates(prev => ({
          ...prev,
          [targetId]: { loading: false, isFollowing: false, isPending: !!res.data.isPending },
        }));
        if (!res.data.isPending) {
          setUser(prev => ({
            ...prev,
            following: (prev?.following || []).filter(id => id.toString() !== targetId.toString()),
          }));
        }
        if (res.data.isPending) toast.info("Follow request sent");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
      setFollowStates(prev => ({ ...prev, [targetId]: { ...prev[targetId], loading: false } }));
    }
  };

  const filteredList = list.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          className="relative w-full md:max-w-md bg-[#0c0c10] border border-zinc-800 md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col h-[85vh] md:h-[600px] shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-[#0c0c10] flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <HiUserGroup className="text-emerald-500 text-sm" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                {type === "followers" ? "Followers" : "Following"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
            >
              <HiXMark size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-zinc-900/50">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/30 transition-colors"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Loading...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-30">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                  <FaUser size={24} className="text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-white">No users found</p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Try a different search</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredList.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      onClose();
                      navigate(u.role === "editor" ? `/editor/${u._id}` : `/public-profile/${u._id}`);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800/30 transition-all cursor-pointer group"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-br from-zinc-800 to-transparent group-hover:from-emerald-500/20 transition-all">
                        <img
                          src={repairUrl(u.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png")}
                          alt=""
                          className="w-full h-full rounded-full object-cover bg-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {u.name}
                        </span>
                        {u.role === "editor" && <MdVerified className="text-blue-500 text-[10px]" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          {u.role}
                        </span>
                        {u.country && (
                          <span className="text-[9px] text-zinc-600">• {u.country}</span>
                        )}
                      </div>
                    </div>

                    {/* Follow Button (Only if not self) */}
                    {u._id !== user?._id && (
                      <button
                        onClick={(e) => handleFollowToggle(e, u)}
                        className={`
                          px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                          ${followStates[u._id]?.isFollowing
                            ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                            : "bg-white text-black hover:bg-zinc-200"
                          }
                          ${followStates[u._id]?.loading ? "opacity-50 cursor-wait" : ""}
                        `}
                      >
                        {followStates[u._id]?.loading ? "..." : 
                         followStates[u._id]?.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Fade */}
          <div className="h-4 bg-gradient-to-t from-[#0c0c10] to-transparent pointer-events-none absolute bottom-0 left-0 right-0" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FollowListModal;
