import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Star, MoreHorizontal, Bell, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// ── Mock Data ──────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  { id: 1, type: 'like', user: { name: 'Souvik Suman', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' }, content: 'liked your latest reel', time: '2m', preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', isVerified: true },
  { id: 2, type: 'follow', user: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' }, content: 'started following you', time: '15m', isVerified: false },
  { id: 3, type: 'comment', user: { name: 'Mayank Creative', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' }, content: 'commented: "This lighting is insane! 🔥"', time: '1h', preview: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=400', isVerified: true },
  { id: 4, type: 'mention', user: { name: 'VFX_Alex', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' }, content: 'mentioned you in a story', time: '3h', isVerified: false },
  { id: 5, type: 'verified', user: { name: 'SuviX Support', avatar: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' }, content: 'Your account has been officially verified', time: '5h', isVerified: true },
];

// ── Components ─────────────────────────────────────────────────────────────

const NotificationItem = ({ item, isDarkMode }: { item: any; isDarkMode: boolean }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'like': return <Heart className="text-rose-500 fill-rose-500" size={16} />;
      case 'follow': return <UserPlus className="text-blue-500" size={16} />;
      case 'comment': return <MessageCircle className="text-emerald-500" size={16} />;
      case 'verified': return <Star className="text-yellow-500 fill-yellow-500" size={16} />;
      default: return <Bell className="text-zinc-400" size={16} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-4 p-4 lg:p-6 transition-colors border-b ${isDarkMode ? 'border-zinc-900 hover:bg-white/5' : 'border-zinc-100 hover:bg-zinc-50'}`}
    >
      <div className="relative shrink-0">
        <img src={item.user.avatar} className="w-11 h-11 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-transparent group-hover:border-rose-500 transition-all" alt="" />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${isDarkMode ? 'bg-black border-black' : 'bg-white border-white'} shadow-lg`}>
          {getIcon()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[14px] lg:text-[15px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.user.name}</span>
          {item.isVerified && <CheckCircle2 size={13} className="text-rose-500 fill-rose-500/10" />}
          <span className={`text-[14px] lg:text-[15px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.content}</span>
          <span className="text-[12px] text-zinc-500 ml-1">• {item.time}</span>
        </div>
        
        {item.type === 'follow' && (
          <button className="mt-3 px-6 py-1.5 rounded-full bg-rose-600 text-white text-[12px] font-bold hover:bg-rose-700 transition-colors">
            Follow Back
          </button>
        )}
      </div>

      {item.preview && (
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img src={item.preview} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <button className="text-zinc-500 hover:text-white transition-colors">
        <MoreHorizontal size={18} />
      </button>
    </motion.div>
  );
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  const { isDarkMode } = useTheme();

  const TABS = ['All', 'Verified', 'Mentions'];

  return (
    <div className={`flex flex-col min-h-full ${isDarkMode ? 'bg-[#000000]' : 'bg-[#ffffff]'} transition-colors duration-300`}>
      
      {/* 🏙️ STICKY HEADER */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDarkMode ? 'bg-black/80 border-zinc-900' : 'bg-white/80 border-zinc-100'}`}>
        <div className="px-6 py-4">
          <h1 className={`text-xl lg:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications</h1>
        </div>

        {/* Tab Bar (Twitter/Instagram Style) */}
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 relative py-4 group"
            >
              <span className={`text-[14px] font-bold transition-colors ${activeTab === tab 
                ? (isDarkMode ? 'text-white' : 'text-black') 
                : 'text-zinc-500 group-hover:text-zinc-400'}`}
              >
                {tab}
              </span>
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 rounded-full mx-6"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 LIST AREA */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'All' ? (
              NOTIFICATIONS.map(notif => (
                <NotificationItem key={notif.id} item={notif} isDarkMode={isDarkMode} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                  <Bell className="text-zinc-500" size={32} />
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Nothing here yet</h3>
                <p className="text-sm text-zinc-500 mt-1">When you get {activeTab.toLowerCase()} notifications, they'll show up here.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
