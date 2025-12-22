import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';

const MobileBottomSheet = ({ children, isOpen = true }) => {
  const { isDark } = useTheme();
  const [sheetState, setSheetState] = useState('minimized'); // 'minimized' | 'half' | 'full'
  const constraintsRef = useRef(null);

  // Sheet heights based on viewport
  const heights = {
    minimized: 100,
    half: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
    full: typeof window !== 'undefined' ? window.innerHeight * 0.85 : 700,
  };

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 300) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('minimized');
    } else if (velocity < -300) {
      if (sheetState === 'minimized') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else {
      const currentHeight = heights[sheetState];
      const newY = currentHeight - offset;
      const distToMinimized = Math.abs(newY - heights.minimized);
      const distToHalf = Math.abs(newY - heights.half);
      const distToFull = Math.abs(newY - heights.full);

      if (distToMinimized <= distToHalf && distToMinimized <= distToFull) {
        setSheetState('minimized');
      } else if (distToHalf <= distToFull) {
        setSheetState('half');
      } else {
        setSheetState('full');
      }
    }
  };

  const cycleState = () => {
    if (sheetState === 'minimized') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('minimized');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {sheetState !== 'minimized' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={() => setSheetState('minimized')}
          />
        )}
      </AnimatePresence>

      {/* The Sheet */}
      <motion.div
        ref={constraintsRef}
        className={`fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl shadow-2xl md:hidden ${
          isDark 
            ? 'bg-black border-t border-green-800/50' 
            : 'bg-white border-t border-gray-200'
        }`}
        style={{ height: heights[sheetState] }}
        animate={{ height: heights[sheetState] }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div
          onClick={cycleState}
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className={`w-12 h-1.5 rounded-full mb-2 ${isDark ? 'bg-green-700' : 'bg-gray-300'}`} />
          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-green-500' : 'text-gray-500'}`}>
            {sheetState === 'minimized' ? (
              <>
                <HiOutlineChevronUp /> Swipe up for editors
              </>
            ) : sheetState === 'half' ? (
              <>
                <HiOutlineChevronUp /> <HiOutlineChevronDown />
              </>
            ) : (
              <>
                <HiOutlineChevronDown /> Swipe down
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto px-4 pb-4 scrollbar-hide">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default MobileBottomSheet;
