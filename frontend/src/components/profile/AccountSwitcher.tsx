import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllSessions, selectActiveSession, switchSession, setIsAddingAccount } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import { persistor } from '../../store';
import { X, Check, Plus } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcher = ({ isOpen, onClose }: AccountSwitcherProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  
  const sessions = useSelector(selectAllSessions);
  const activeSession = useSelector(selectActiveSession);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState('');
  const [switchingFrom, setSwitchingFrom] = useState('');
  const [switchingToAvatar, setSwitchingToAvatar] = useState('');
  const [switchingFromAvatar, setSwitchingFromAvatar] = useState('');
  
  if (!isOpen && !isSwitching) return null;

  const handleSwitch = async (userId: string) => {
    if (activeSession?.user.id !== userId) {
      const targetSession = sessions.find(s => s.user.id === userId);
      setSwitchingTo(targetSession?.user.username || 'user');
      setSwitchingFrom(activeSession?.user.username || 'user');
      setSwitchingFromAvatar(activeSession?.user.profilePicture || defaultProfile);
      setSwitchingToAvatar(targetSession?.user.profilePicture || defaultProfile);
      setIsSwitching(true);

      dispatch(switchSession(userId));

      try {
        // Flush state to disk to ensure localStorage has updated credentials before browser reload
        await persistor.flush();
      } catch (err) {
        console.warn('Failed to flush persistor:', err);
      }

      // Premium animation delay before hard-reload
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } else {
      onClose();
    }
  };

  const handleAddAccount = () => {
    onClose();
    // Dispatch Redux action to persist intent across auth pages
    dispatch(setIsAddingAccount(true));
    // Navigate to login
    navigate('/login');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`
            relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl
            ${isDarkMode ? 'bg-[#1C1C1C] text-white border border-white/10' : 'bg-white text-black border border-black/10'}
          `}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <h3 className="text-sm font-semibold mx-auto">Switch accounts</h3>
            <button 
              onClick={onClose}
              className="absolute right-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
            </button>
          </div>

          {/* Accounts List */}
          <div className="max-h-[300px] overflow-y-auto">
            {sessions.map((session) => {
              const isActive = activeSession?.user.id === session.user.id;
              
              return (
                <button
                  key={session.user.id}
                  onClick={() => handleSwitch(session.user.id)}
                  className={`
                    w-full flex items-center justify-between p-4 transition-colors
                    ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={session.user.profilePicture || defaultProfile} 
                      alt={session.user.username}
                      className="w-12 h-12 rounded-full object-cover border border-black/10 dark:border-white/10"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{session.user.username}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        {session.user.primaryRole?.category || 'User'}
                      </p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500' : 'bg-blue-500'}`}>
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <button 
              onClick={handleAddAccount}
              className={`
                w-full flex items-center gap-3 p-4 text-sm font-semibold transition-colors
                ${isDarkMode ? 'hover:bg-white/5 text-blue-400' : 'hover:bg-black/5 text-blue-600'}
              `}
            >
              <Plus size={20} />
              Log into an existing account
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-screen Switcher Processing Overlay */}
      {isSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-8 max-w-md w-full px-6 text-center">
            
            {/* Visual Account Switcher Transition Animation */}
            <div className="flex items-center justify-between w-full max-w-[320px] relative">
              
              {/* Left Side: Current Profile */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <img
                    src={switchingFromAvatar}
                    alt="Current Account"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  />
                  {/* Active dot indicator fading out */}
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900"
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-400 max-w-[85px] truncate">
                  {switchingFrom}
                </span>
              </motion.div>

              {/* Middle: Moving Data particles along a bridge */}
              <div className="flex-1 mx-4 h-1 relative flex items-center justify-center">
                {/* Connecting Bridge Line */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-purple-900 to-blue-900 h-[2px] w-full rounded-full opacity-60" />
                <div className="absolute inset-0 border-b border-dashed border-zinc-600 w-full h-[1px] opacity-40" />

                {/* Flowing Particles */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ left: "0%", opacity: 0 }}
                    animate={{ 
                      left: ["0%", "100%"], 
                      opacity: [0, 1, 1, 0],
                      scale: [0.8, 1.2, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_8px_#8b5cf6,0_0_12px_#3b82f6]"
                  />
                ))}
              </div>

              {/* Right Side: Target Profile */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 0 0px rgba(59, 130, 246, 0)",
                        "0 0 0 8px rgba(59, 130, 246, 0.3)",
                        "0 0 0 16px rgba(139, 92, 246, 0)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full"
                  />
                  <img
                    src={switchingToAvatar}
                    alt="Target Account"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  />
                  <motion.span 
                    animate={{ scale: [0, 1] }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-zinc-900 flex items-center justify-center"
                  >
                    <Check size={8} className="text-white" />
                  </motion.span>
                </div>
                <span className="text-xs font-semibold text-white max-w-[85px] truncate">
                  {switchingTo}
                </span>
              </motion.div>

            </div>

            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Migrating Workspace</h3>
              <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto">
                Setting up environment for <span className="text-blue-400 font-semibold">@{switchingTo}</span>. Please wait...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
