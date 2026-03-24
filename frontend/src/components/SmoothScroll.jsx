import React, { forwardRef } from 'react';
import { ReactLenis } from 'lenis/react';

const SmoothScroll = forwardRef(({ children, className = "", root = false }, ref) => {
  return (
    <ReactLenis
      ref={ref}
      root={root}
      options={{
        lerp: 0.08,             // Super smooth momentum interpolation
        duration: 1.2,          // Length of scroll animation
        syncTouch: true,        // Sync with touch device momentum
        smoothTouch: false,     // Native mobile scroll is usually better
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
