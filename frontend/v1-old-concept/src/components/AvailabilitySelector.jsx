import { useState, useEffect, useRef } from 'react';
import { FaCircle, FaCalendarAlt, FaChevronDown, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AvailabilitySelector = ({ compact = false }) => {
  const { user, setUser, backendURL } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Parse initial state safely
  const [status, setStatus] = useState(user?.availability?.status || 'available');
  const [date, setDate] = useState(
    user?.availability?.busyUntil ? new Date(user.availability.busyUntil).toISOString().split('T')[0] : ''
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (s) => {
    switch(s) {
      case 'available': return 'text-emerald-500';
      case 'busy': return 'text-yellow-500';
      case 'small_only': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (s) => {
    switch(s) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'small_only': return 'Small Projects';
      default: return 'Unknown';
    }
  };

  const handleUpdate = async (newStatus, newDate = null) => {
    setLoading(true);
    try {
        const payload = { status: newStatus, busyUntil: newDate };
        
        // Basic validation
        if (newStatus === 'busy' && !newDate) {
            // If switching to busy but no date set, don't API call yet, just update UI state to show date picker needs input?
            // Actually, for better UX, we can default to tomorrow if not set, or keep it local until date picked.
            // But let's enforce date selection in the UI before calling this if possible.
            // Here, we assume date is passed if needed.
            if (!date && !newDate) {
                toast.error("Please select a date until when you are busy");
                setLoading(false);
                return;
            }
            if (!newDate) payload.busyUntil = date;
        }

        const res = await axios.put(`${backendURL}/api/user/availability`, payload, {
            headers: { Authorization: `Bearer ${user.token}` }
        });

        if (res.data.success) {
            // Update local user context
            setUser(prev => ({
                ...prev,
                availability: res.data.availability
            }));
            setStatus(newStatus);
            if (newDate) setDate(newDate);
            toast.success(res.data.message);
            setIsOpen(false);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
        setLoading(false);
    }
  };

  // If user is client, don't show
  if (user?.role !== 'editor') return null;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <FaCircle className={`text-[10px] ${getStatusColor(status)}`} />
        {!compact && (
            <span className="font-medium text-gray-200">
                {getStatusLabel(status)}
                {status === 'busy' && user?.availability?.busyUntil && (
                    <span className="text-gray-500 ml-1 text-xs">
                        until {new Date(user.availability.busyUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </span>
        )}
        <FaChevronDown className={`text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 bg-[#111319] border border-[#262A3B] rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {['available', 'small_only', 'busy'].map((option) => (
                <div key={option}>
                    <button
                        onClick={() => {
                            if (option !== 'busy') handleUpdate(option);
                            else setStatus('busy'); // Just expand date picker
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${status === option ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <FaCircle className={`text-[10px] ${getStatusColor(option)}`} />
                            <span className="text-sm text-gray-300">{getStatusLabel(option)}</span>
                        </div>
                        {status === option && <FaCheck className="text-emerald-500 text-xs" />}
                    </button>
                    
                    {/* Date Picker for Busy Status */}
                    {option === 'busy' && status === 'busy' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="px-3 pb-2 pt-1 border-t border-white/5 mt-1 bg-black/20"
                        >
                            <label className="text-xs text-gray-500 mb-1 block">Busy until:</label>
                            <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="flex-1 bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button 
                                    onClick={() => handleUpdate('busy', date)}
                                    disabled={!date || loading}
                                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvailabilitySelector;
