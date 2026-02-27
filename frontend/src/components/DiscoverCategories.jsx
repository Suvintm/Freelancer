import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaFire, FaRegClock, FaMapMarkerAlt, FaChevronRight } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const CategorySection = ({ title, icon: Icon, type, limit = 5 }) => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/user/suggestions?limit=${limit}&type=${type}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        if (res.data.success) {
          setProfiles(res.data.suggestions);
        }
      } catch (err) {
        console.error(`Failed to fetch ${type} profiles`, err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchCategory();
  }, [backendURL, user?.token, type, limit]);

  if (loading) return null;
  if (profiles.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
            <Icon size={14} />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">{title}</h3>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
        {profiles.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(item.role === 'editor' ? `/editor/${item._id}` : `/public-profile/${item._id}`)}
            className="min-w-[140px] max-w-[140px] bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group cursor-pointer hover:border-white/10 transition-all relative overflow-hidden"
          >
            {item.role === 'editor' && (
              <div className="absolute top-2 left-0 right-0 px-2 flex items-center justify-center gap-1">
                <MdVerified className="text-blue-400 text-[10px]" />
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Editor</span>
              </div>
            )}
            
            <div className="mt-3 mb-3">
              <img 
                src={item.profilePicture} 
                className="w-14 h-14 rounded-full object-cover border border-white/10 group-hover:border-white/20 transition-colors" 
                alt="" 
              />
            </div>

            <div className="w-full">
              <h4 className="text-[12px] font-bold text-white truncate mb-0.5 group-hover:text-indigo-400 transition-colors">
                {item.name}
              </h4>
              <p className="text-[9px] text-gray-500 truncate">{item.country || "Member"}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const DiscoverCategories = () => {
  return (
    <div className="w-full">
      <CategorySection title="Trending Now" icon={FaFire} type="trending" />
      <CategorySection title="Recently Joined" icon={FaRegClock} type="new" />
      <CategorySection title="Near You" icon={FaMapMarkerAlt} type="nearby" />
    </div>
  );
};

export default DiscoverCategories;
