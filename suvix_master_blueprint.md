# SuviX: Master Technical Blueprint

This document provides a comprehensive, production-grade overview of the SuviX application ecosystem. It covers the architectural foundations, folder structures, and functional descriptions of both the backend and frontend systems.

---

## 🏗️ Architectural Foundations

SuviX is built on a modern, scalable **Client-Server-Cloud** architecture.

### Technology Stack
- **Frontend**: React Native (via Expo SDK 52+), React Navigation (Expo Router), Zustand (State), Axios (API), Socket.io-client.
- **Backend**: Node.js, Express.js, Socket.io (Real-time), Prisma (ORM), TypeScript.
- **Database**: PostgreSQL (Production-grade relational data).
- **Core Services**:
  - **Media Engine**: AWS S3 for high-performance storage, `expo-video` for Reels.
  - **Identity**: JWT with secure Vault rotation, custom Multi-Account architecture.
  - **Ad Engine**: Google AdMob integration.
  - **External Integrations**: YouTube Data API (v3) for creator metrics and content sync.

### Detailed Backend Structure (`server/`)
- `prisma/`
  - `schema.prisma`: PostgreSql schema and entity relations.
  - `migrations/`: SQL migration history.
- `modules/` (Core Logic)
  - `auth/`: Identity management system.
    - `controllers/authController.js`, `kycController.js`
    - `services/vaultService.js` (Identity rotation)
    - `routes/authRoutes.js`
  - `storage/`: Media processing & CDN layer.
    - `media.controller.js` (Upload orchestration)
    - `processors/image.processor.js`, `video.processor.js`
    - `providers/s3.provider.js` (AWS interface)
  - `profile/`: Account metadata and role management.
    - `profile.controller.js`, `profile.routes.js`
  - `youtube-creator/`: External API integration.
    - `syncService.js`, `youtube.controller.js`
- `config/`: `s3.config.js`, `db.config.js`, `passport.js`.
- `middleware/`: `authMiddleware.js`, `uploadMiddleware.js`, `rateLimiter.js`.

---

## 📱 Frontend Blueprint: `suvix-mobile/`

The frontend is a highly modular Expo application centered around the **Zustand State Engine** and **Expo Router**.

### Detailed Frontend Structure (`suvix-mobile/src/`)

#### 1. `store/` (The State Brain)
- `useAuthStore.ts`: Global session, account switching, and multi-vault logic.
- `useDashboardStore.ts`: Dashboard stats and real-time sync states.
- `useSocketStore.ts`: Real-time listener for server signals.

#### 2. `api/` (Network Layer)
- `client.ts`: Axios wrapper with interceptors for token injection and 401 handling.
- `endpoints.ts`: Map of all REST resources.

#### 3. `modules/` (Domain-Driven Components)
- `creators/profiles/`:
  - `YouTubeCreatorProfile.tsx`: Complex multi-channel aggregator and stats view.
  - `FitnessInfluencerProfile.tsx`: Media-heavy professional profile.
- `clients/profiles/`: `ClientProfile.tsx` (Consumption-focused view).
- `shared/`:
  - `content/`: `ContentGrid.tsx`, `ContentCard.tsx`, `PremiumMediaEngine.tsx`.
  - `profiles/`: `ProfileContentTabs.tsx`, `DefaultProfile.tsx`.

### Navigation Architecture (`app/`)
Uses File-based routing (Expo Router).
- `_layout.tsx`: The Root Keyed Stack engine.
- `(tabs)/`: Tab-bar orchestration (`index.tsx`, `explore.tsx`, `reels.tsx`, `profile.tsx`).
- `settings.tsx`: The master control for multi-account switching.
- `reels/[userId].tsx`: Full-screen immersive video player.

---

## 🛰️ Integration & Data Flows

### 1. Multi-Account Switching (Atomic Reset)
When a user switches accounts:
1. `useAuthStore` updates the `user` object and rotates the token in the Vault.
2. The `RootKeyedStack` in `app/_layout.tsx` detects the change in `user.id`.
3. React uses this ID as a `key`, forcing the **entire navigation tree** to unmount and remount.
4. This guarantees zero data leakage between accounts.

### 2. Media Upload Pipeline
1. Client requests an S3 Pre-signed URL from `media.controller.js`.
2. Client uploads directly to S3.
3. Client notifies Backend of completion.
4. Backend `mediaProcessor` triggers (via Worker) to generate thumbnails and HLS streams.
5. Socket.io pushes a `SYNC_COMPLETE` signal to the mobile UI to refresh the gallery.

---

## 📊 Database Schema Summary (Prisma)
- `User`: Base identity, Auth provider, Ban status.
- `UserProfile`: Extended metadata (Bio, Role, Categories).
- `YouTubeProfile`: Linked channel statistics and sync timestamps.
- `YouTubeVideo`: Cached metadata for YouTube content.
- `Post` / `Media`: Native SuviX social content.
- `UserFollow`: Bi-directional follower graph.

---
> [!NOTE]
> This blueprint is a living document and should be updated whenever new core modules or architectural patterns are introduced.
![alt text](image.png)