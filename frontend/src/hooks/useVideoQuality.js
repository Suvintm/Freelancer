import { useState, useEffect } from 'react';

export function useVideoQuality() {
    const [preferredQuality, setPreferredQualityState] = useState(() => {
        const stored = localStorage.getItem('suvix_video_quality');
        return stored ? stored : 'Auto';
    });

    const setPreferredQuality = (newQuality) => {
        localStorage.setItem('suvix_video_quality', newQuality);
        setPreferredQualityState(newQuality);
        // Dispatch custom event to sync across multiple open components natively without React Context bloat
        window.dispatchEvent(new CustomEvent('suvix_quality_change', { detail: newQuality }));
    };

    useEffect(() => {
        const handleSync = (e) => {
            if (e.detail !== preferredQuality) setPreferredQualityState(e.detail);
        };
        window.addEventListener('suvix_quality_change', handleSync);
        return () => window.removeEventListener('suvix_quality_change', handleSync);
    }, [preferredQuality]);

    return [preferredQuality, setPreferredQuality];
}
