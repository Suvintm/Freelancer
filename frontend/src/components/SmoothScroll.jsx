import React, { forwardRef } from 'react';
import { ReactLenis } from 'lenis/react';

const SmoothScroll = forwardRef(({ children, className = "", root = false }, ref) => {
  return (
    <ReactLenis
      ref={ref}
      root={root}
      options={{
        lerp: 0.1,              // super smooth damping
        duration: 1.2,          // Length of scroll animation
        smoothWheel: true,
        syncTouch: true,        // Sync with touch device momentum
        smoothTouch: true,      // ENABLED: provides momentum on mobile
        touchMultiplier: 1.8,   // Tune for "premium" feel (not too fast/slow)
      }}
      className={root ? className : `h-full w-full overflow-y-auto overflow-x-hidden ${className}`}
    >
      {root ? children : (
        <div className="w-full min-h-max">
          {children}
        </div>
      )}
    </ReactLenis>
  );
});

export default SmoothScroll;
