import axios from "axios";

/**
 * AnalyticsService — Product-Grade Network Accumulator.
 * 
 * DSA CONCEPT: Queue & Batch Processing.
 * Instead of firing a network request for every single user interaction (O(N)),
 * we buffer events into a High-Efficiency Queue and "flush" them in batches (O(1) relative to intervals).
 * 
 * FEATURES:
 * 1. Periodic Flush: Sends accumulated data every 30 seconds.
 * 2. Beaconing: Uses navigator.sendBeacon (if applicable) or visibilitychange to 
 *    ensure data is captured even if the user closes the app.
 * 3. Deduplication: Ensures we don't send redundant signals in a single batch.
 */

class AnalyticsService {
    constructor() {
        this.queue = [];
        this.flushInterval = 30000; // 30 seconds
        this.timer = null;
        this.backendURL = "";
        this.userToken = "";

        // Bind for event listeners
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init(backendURL, userToken) {
        this.backendURL = backendURL;
        this.userToken = userToken;
        
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.flush(), this.flushInterval);

        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    pushEvent(event) {
        // Event format: { reelId, seconds, watchPercent, type: 'watch' | 'skip' }
        if (!event.reelId) return;
        
        // Simple deduplication for the current batch
        const existingIdx = this.queue.findIndex(e => e.reelId === event.reelId && e.type === event.type);
        if (existingIdx !== -1 && event.type === 'watch') {
            // Accumulate watch time if it's the same reel in the same batch
            this.queue[existingIdx].seconds += event.seconds;
            this.queue[existingIdx].watchPercent = Math.max(this.queue[existingIdx].watchPercent, event.watchPercent);
        } else {
            this.queue.push(event);
        }

        // If queue gets too large (e.g. 20 events), flush immediately as a safety valve
        if (this.queue.length >= 20) {
            this.flush();
        }
    }

    async flush() {
        if (this.queue.length === 0 || !this.backendURL || !this.userToken) return;

        const eventsToFlush = [...this.queue];
        this.queue = []; // Clear queue immediately to avoid race conditions during async req

        try {
            await axios.post(
                `${this.backendURL}/api/reels/analytics/batch`,
                { events: eventsToFlush },
                { headers: { Authorization: `Bearer ${this.userToken}` } }
            );
        } catch (err) {
            console.error("Failed to flush analytics batch:", err);
            // Optionally: Put events back in queue if it's a transient network error
            // this.queue = [...eventsToFlush, ...this.queue];
        }
    }

    handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
            this.flush();
        }
    }

    // Cleanup for HMR or logout
    destroy() {
        clearInterval(this.timer);
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        this.flush();
    }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
