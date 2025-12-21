import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const SHEET_HEIGHTS = {
  minimized: 120,
  half: window.innerHeight * 0.5,
  full: window.innerHeight * 0.9,
};

const SwipeableBottomSheet = ({ children, isOpen = true, onClose }) => {
  const [sheetState, setSheetState] = useState('half'); // 'minimized' | 'half' | 'full'
  const y = useMotionValue(SHEET_HEIGHTS.half);
  const dragConstraints = { top: SHEET_HEIGHTS.full, bottom: SHEET_HEIGHTS.minimized };

  useEffect(() => {
    // Update height when sheet state changes
    y.set(window.innerHeight - SHEET_HEIGHTS[sheetState]);
  }, [sheetState, y]);

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;
    const screenHeight = window.innerHeight;

    // Determine next state based on velocity and position
    if (velocity > 500) {
      // Fast swipe down
      setSheetState(sheetState === 'full' ? 'half' : 'minimized');
    } else if (velocity < -500) {
      // Fast swipe up
      setSheetState(sheetState === 'minimized' ? 'half' : 'full');
    } else {
      // Slow drag - snap to nearest state
      const distanceFromTop = currentY;
      const distanceFromMiddle = Math.abs(currentY - screenHeight * 0.5);
      const distanceFromBottom = Math.abs(currentY - (screenHeight - SHEET_HEIGHTS.minimized));

      if (distanceFromTop < distanceFromMiddle && distanceFromTop < distanceFromBottom) {
        setSheetState('full');
      } else if (distanceFromMiddle < distanceFromBottom) {
        setSheetState('half');
      } else {
        setSheetState('minimized');
      }
    }
  };

  const backdropOpacity = useTransform(
    y,
    [window.innerHeight - SHEET_HEIGHTS.full, window.innerHeight - SHEET_HEIGHTS.minimized],
    [0.5, 0]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {sheetState !== 'minimized' && (
        <motion.div
          className="fixed inset-0 bg-black z-40"
          style={{ opacity: backdropOpacity }}
          onClick={() => setSheetState('minimized')}
        />
      )}

      {/* Bottom Sheet */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ 
          y,
          height: sheetState === 'minimized' ? SHEET_HEIGHTS.minimized : sheetState === 'half' ? SHEET_HEIGHTS.half : SHEET_HEIGHTS.full
        }}
        drag="y"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={{ 
          y: window.innerHeight - SHEET_HEIGHTS[sheetState],
          transition: { type: 'spring', damping: 30, stiffness: 300 }
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default SwipeableBottomSheet;
