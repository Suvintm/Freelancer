import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaUserFriends, FaUserPlus, FaSearch } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import axios from 'axios';
import { toast } from 'react-toastify';

import { useAppContext } from '../context/AppContext';

const ConnectionsPage = () => {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendURL } = useAppContext();
  
  const initialTab = searchParams.get('tab') || 'followers';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [activeTab, userId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'followers' 
        ? `${backendURL}/api/user/followers/${userId}` 
        : `${backendURL}/api/user/following/${userId}`;
        
      const response = await axios.get(endpoint);
      setUsers(response.data[activeTab] || []);
    } catch (error) {
      toast.error(`Failed to fetch ${activeTab}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-4 md:pt-8">
      {/* Header */}
      <div className="px-4 md:px-8 flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all"
        >
          <FaChevronLeft size={12} />
        </button>
        <h1 className="text-base font-normal uppercase tracking-widest text-zinc-200">Connections</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 border-b border-white/5 flex gap-8 mb-6">
        <button
          onClick={() => handleTabChange('followers')}
          className={`pb-4 text-[10px] font-normal uppercase tracking-[0.25em] transition-all relative ${
            activeTab === 'followers' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Followers
          {activeTab === 'followers' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
            />
          )}
        </button>
        <button
          onClick={() => handleTabChange('following')}
          className={`pb-4 text-[10px] font-normal uppercase tracking-[0.25em] transition-all relative ${
            activeTab === 'following' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Following
          {activeTab === 'following' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
            />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 md:px-8 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-[11px] font-normal focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 pb-20">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Loading {activeTab}...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user) => (
                <motion.div 
                  key={user._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3.5 rounded-[20px] bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img 
                        src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5 group-hover:ring-purple-500/30 transition-all"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-normal text-white">{user.name}</span>
                        {user.role === 'editor' && <MdVerified className="text-blue-500 text-[10px]" />}
                      </div>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-tighter font-normal">{user.role}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/public-profile/${user._id}`)}
                    className="px-4 py-1.5 rounded-lg bg-white text-black text-[9px] font-normal uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all"
                  >
                    View
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center opacity-40">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              {activeTab === 'followers' ? <FaUserFriends size={32} /> : <FaUserPlus size={32} />}
            </div>
            <p className="text-zinc-400 text-sm font-normal uppercase tracking-widest">No {activeTab} found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPage;
