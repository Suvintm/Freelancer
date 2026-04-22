import { useCallback, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useUIStore } from '../store/useUIStore';

/**
 * Hook to hide/show the bottom tab bar based on scroll direction.
 * Similar to Instagram or Twitter navigation behavior.
 */
export const useScrollToHideTabBar = () => {
  const { setTabBarVisible, isTabBarVisible } = useUIStore();
  const lastOffsetY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const diff = currentOffset - lastOffsetY.current;

    // 1. Scrolling Down (Hide)
    if (diff > scrollThreshold && currentOffset > 100) {
      if (isTabBarVisible) {
        setTabBarVisible(false);
      }
    } 
    // 2. Scrolling Up (Show)
    else if (diff < -scrollThreshold || currentOffset < 50) {
      if (!isTabBarVisible) {
        setTabBarVisible(true);
      }
    }

    lastOffsetY.current = currentOffset;
  }, [isTabBarVisible, setTabBarVisible]);

  return { onScroll };
};
