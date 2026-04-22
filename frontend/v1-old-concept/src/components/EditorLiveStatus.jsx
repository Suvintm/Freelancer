
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUserCircle, HiSignal } from 'react-icons/hi2';

const EditorLiveStatus = ({ isLive = true }) => {
  if (!isLive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-[#0d0d12] border border-emerald-500/20 p-4 shadow-lg"
    >
      <div className="absolute top-0 right-0 p-3">
        <div className="relative">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <HiSignal className="text-2xl text-emerald-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Your Profile is Active</h3>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[8px] font-black text-white uppercase tracking-tighter">LIVE</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Clients can see you and send direct messages now.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default EditorLiveStatus;
