import { useEffect } from 'react';
import Lenis from 'lenis';

export function useSmoothScroll(wrapperRef) {
  useEffect(() => {
    if (!wrapperRef || !wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    
    // In scenarios where 'root' is false, Lenis requires both wrapper and content
    // We assume the first child of the wrapper is the content.
    const content = wrapper.firstElementChild;
    if (!content) return;

    const lenis = new Lenis({
      wrapper: wrapper,
      content: content,
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      syncTouch: true,
      smoothTouch: true,
      touchMultiplier: 1.8,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Patch lenis scroll events back out to the wrapper if needed
    // lenis.on('scroll', (e) => {
    //   // Custom logic if standard onScroll fails
    // });

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, [wrapperRef]);
}
