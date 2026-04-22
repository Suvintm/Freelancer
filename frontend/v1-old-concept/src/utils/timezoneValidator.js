/**
 * Timezone Validator (Client-side Fallback)
 * 
 * This is a secondary layer of defense to catch users who might be 
 * spoofing their IP but haven't changed their system timezone.
 */

export const validateTimezone = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // India uses 'Asia/Kolkata' or 'Asia/Calcutta'
    const validTimezones = ['Asia/Kolkata', 'Asia/Calcutta'];
    
    // In development/localhost, we might want to bypass this or allow it
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return true;
    }

    if (!validTimezones.includes(timezone)) {
        console.warn(`[Security] Timezone mismatch: ${timezone}`);
        return false;
    }

    return true;
};
