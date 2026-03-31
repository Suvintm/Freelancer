# Comprehensive Reels Implementation Plan (Mobile Sync)

This document detailed the technical and UI steps required to bring the SuviX Reels experience to mobile, ensuring 100% feature parity with the web version and production-grade performance.

---

## 1. Core Architectural Strategy
To achieve the "Instagram-level" smoothness, the mobile app will use a **Virtualized Render-As-You-Scroll** architecture.

- **High-Performance List:** Use `@shopify/flash-list` for infinite scrolling. It is up to 5x faster than FlatList/PagerView for video content.
- **Video Optimization:** `react-native-video` will handle HLS (Adaptive Bitrate) (.m3u8) streams from Cloudinary.
- **Pre-loading Logic:** `VideoService.ts` will pre-buffer the next 2 reels while the user is watching the current one.
- **Telemetry:** Integration with `analytics/batch` to track "Watch Time" (%) and "Skips" (< 2s) for refined content recommendations.

---

## 2. Navigational Logic (Immersive Full-Screen)
The Reels page must have **Zero Boundaries**.

- **Tab Bar Suppression:** In `(tabs)/_layout.tsx`, the `tabBarVisible` property will be dynamically set to `false` when the Reels tab is active.
- **Status Bar:** Global `StatusBar` will be set to `hidden={true}` or `translucent={true}` with `light-content`.
- **Top Navigation:** No top header from the Stack. Custom floating "Back" arrow icon only (White/Translucent).

---

## 3. UI/UX Elements (Web -> Mobile Transfer)
We will rebuild Every single feature from the web's `ReelCard.jsx`.

### A. The Floating Sidebar (Right)
- **Animated Like Button:** Re-implement the `FaHeart` toggle with a secondary "Big Heart" overlay on double-tap (using Reanimated).
- **Comment Trigger:** Opens a Bottom-Sheet drawer (not a new page) to keep the video visible in the top 20%.
- **View Count:** Real-time sync with `viewsCount`.
- **Share Trigger:** Integration with `Share.share()` native API.
- **Mute Toggle:** Global audio control sync with a floating indicator overlay.

### B. The Information Stack (Bottom-Left)
- **Liker Avatars:** Horizontal stack of the 3 most recent likers (`latestLikers`) with a "and others" count label.
- **Editor Profile:** Rounded avatar, username, "EDITOR" badge, and the **Sleek Follow Button**. 
- **Live Status:** The "Follow" button will use a 2-second success animation after a successful network call.
- **Content Info:** 
    - **Reels Title:** Semi-bold, large typography.
    - **Description:** 2-line clamp with a "more..." button that expands the text or opens the details drawer.
- **Music Visualizer:** Animated equalizer bar synchronized with the `isPlaying` state.

### C. The Progress Bar
- A minimalist 2px height bar at the bottom edge.
- Subtle "Glow" effect to mimic the web version's high-end feel.
- Purely reactive: Updates directly from the `onProgress` event of `react-native-video`.

---

## 4. Advanced Logic Sync
- **Ad Injection:** Re-implement the "Guaranteed Ad every 3rd reel" logic.
    - `combinedFeed` algorithm will inject an `AdCard` at indices 3, 6, 9...
- **Deep Linking:** Support for `suvix://reels?id=REEL_ID`. The feed will prioritize the specific reel at Index 0.
- **Offline Resilience:** If the `axios` fetch fails, the app will instantly pull the last-viewed 10 reels from the `persistenceService` (AsyncStorage).

---

## 5. Visual Branding Assets
- **Main Logos:** Use `suvix-mobile/assets/logo.png`.
- **Watermark:** Floating text "SuviX" at the bottom right with 20% opacity.
- **"NEW" Badge:** A glowing badge with a breathing animation for reels uploaded in the last 24 hours.

---

# Verification Roadmap
1. [ ] Check `FlashList` memory usage: Ensure no buildup after 50+ reels.
2. [ ] Verify "View Increment": Confirm `/view` API is called exactly once per reel viewed.
3. [ ] Verify "Follow Status": Switching to a different reel and back should maintain the correct follow state.
4. [ ] Test Batch Analytics: Check the network tab to see if `watch-time` is sent in bulk.
