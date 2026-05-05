import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, LayoutGrid, Compass, Film, Briefcase, 
  MessageSquare, Wallet, Settings, Shield, 
  HelpCircle, LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import auth1 from '../../assets/auth/auth_1.png';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const NAV_SECTIONS = [
    {
      label: 'GENERAL',
      items: [
        { icon: LayoutGrid, label: 'Dashboard', path: '/home' },
        { icon: Compass, label: 'Discovery', path: '/explore' },
        { icon: Film, label: 'Reels Feed', path: '/reels' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { icon: Briefcase, label: 'My Projects', path: '/projects' },
        { icon: MessageSquare, label: 'Messages', path: '/chats' },
        { icon: Wallet, label: 'Payments', path: '/payments' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: Shield, label: 'Security', path: '/security' },
        { icon: HelpCircle, label: 'Help & Support', path: '/help' },
      ]
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 🌑 ADAPTIVE BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* 💎 ELITE PANE */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-[101] w-[82%] max-w-[320px] bg-container border-r border-border-main shadow-2xl flex flex-col lg:hidden"
          >
            {/* Header / Profile Identity */}
            <div className="relative p-6 pt-10 overflow-hidden border-b border-border-secondary">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent-primary/10 to-transparent pointer-events-none" />
              
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <img
                    src={user?.profilePicture || auth1}
                    alt={user?.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-accent-primary ring-4 ring-accent-primary/5"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-container" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-text-main truncate tracking-tight">{user?.name || 'User'}</h3>
                  <div className="flex items-center gap-1 mt-0.5 opacity-70">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent-primary">
                      {user?.primaryRole?.category || 'Elite Member'}
                    </span>
                  </div>
                </div>
                
                <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="space-y-3">
                  <h4 className="text-[10px] font-black text-text-muted px-4 tracking-[0.2em] uppercase opacity-50">
                    {section.label}
                  </h4>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavigate(item.path)}
                          className={`
                            w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200
                            ${isActive 
                              ? 'bg-accent-primary/10 text-accent-primary' 
                              : 'text-text-secondary hover:bg-white/5 active:scale-[0.98]'
                            }
                          `}
                        >
                          <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                          <span className={`text-[14px] flex-1 text-left ${isActive ? 'font-bold' : 'font-semibold'}`}>
                            {item.label}
                          </span>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border-secondary space-y-4 bg-page/30">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-sm hover:bg-rose-500/20 transition-colors"
              >
                <LogOut size={18} />
                End Session
              </button>
              
              <div className="flex items-center justify-center gap-2 opacity-30">
                <span className="text-[10px] font-bold text-text-muted">SuviX Workspace v1.2</span>
                <div className="w-1 h-1 rounded-full bg-text-muted" />
                <span className="text-[10px] font-bold text-text-muted">Enterprise</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
