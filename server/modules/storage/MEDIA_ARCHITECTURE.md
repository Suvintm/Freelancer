# SuviX Production Media Architecture
### Complete Storage & Processing Blueprint

---

## 🏗️ Architecture Overview

```
Client (Mobile App)
       │
       ├─── [Phase 4] Direct PUT via Pre-signed URL ──────────────┐
       │                                                           │
       └─── [Phase 1] POST /api/media/upload                      │
                      │                                            │
                      ▼                                            ▼
              Backend (Node.js)                           S3 / R2 (PRIVATE)
                      │                                   [raw/ folder]
                      │ fires job                               │
                      ▼                                         │
              BullMQ Media Queue ◄──────────────────────────────┘
                      │
                      ▼
              Media Processor Worker
              ┌───────────────────────────────┐
              │  Images: sharp                 │
              │  Videos: ffmpeg / MediaConvert │
              │  Validation: MIME + ClamAV     │
              │  Safety: Rekognition / Vision  │
              └───────────────────────────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
     S3 (processed/)     R2 (processed/)
             │                 │
             └────────┬────────┘
                      ▼
              Cloudflare CDN
              (cdn.suvix.in)
                      │
                      ▼
              User Feed / Stories / Reels
```

---

## 🗂️ S3 Bucket Structure (PRIVATE)

```
suvix-media/
│
├── raw/                          ← Originals. Auto-deleted 24h after processing.
│   ├── images/{userId}/{uploadId}.jpg
│   └── videos/{userId}/{uploadId}.mp4
│
├── images/
│   └── {userId}/
│       └── {postId}/
│           ├── original.webp     ← Full quality archive
│           ├── 1080.webp         ← Standard view
│           ├── 720.webp          ← Feed view
│           ├── 360.webp          ← Thumbnail / lazy-load
│           ├── thumb.jpg         ← OG image fallback (SEO)
│           └── blurhash.txt      ← Tiny placeholder for instant feel
│
├── videos/
│   └── {userId}/
│       └── {postId}/
│           ├── master.m3u8       ← HLS manifest (Adaptive Bitrate)
│           ├── 1080p/
│           │   ├── index.m3u8
│           │   └── seg000.ts ... ← 2-second HLS chunks
│           ├── 720p/
│           ├── 360p/
│           └── poster.jpg        ← Freeze frame at 0.5s for feed preview
│
├── stories/
│   └── {userId}/
│       └── {storyId}/            ← Same as images/videos + TTL lifecycle rule
│
├── avatars/
│   └── {userId}/
│       ├── original.webp
│       ├── large.webp            ← Profile page (200x200)
│       └── small.webp            ← Mentions / comments (40x40)
│
└── protected/
    └── deliverables/             ← Signed URL ONLY. Never CDN-public.
        └── {orderId}/...
```

---

## ☁️ R2 Bucket Structure (Mirror — Zero Egress)

```
suvix-media-r2/                   ← Identical structure to S3.
│                                    R2 serves as the CDN origin for Cloudflare.
│                                    When R2 is active, S3 is backup/archive only.
├── images/ ...
├── videos/ ...
├── stories/ ...
├── avatars/ ...
└── protected/ ...
```

---

## ⚙️ Media Processing Pipeline (Step by Step)

### Step 1: Client Pre-Compression
> Done BEFORE upload to save bandwidth
- **Images**: Resize to max 1920px, JPEG quality 85 via `browser-image-compression`
- **Videos**: Cap mobile upload at 720p before hitting server

### Step 2: Upload to `raw/` Folder
- Multipart upload for files > 5MB (parallel chunks, retry per chunk)
- Validate MIME type server-side (not extension)
- Rate-limit: 50 uploads/hour per user
- Size caps: Images 20MB, Videos 500MB

### Step 3: BullMQ Job Fired
- Upload API responds **immediately** with `{ status: "processing", mediaId }`
- User sees a loading state — non-blocking UX
- Job carries: `{ userId, postId, rawS3Key, mediaType }`

### Step 4: Worker Picks Up Job

#### 4a — Image Processing (using `sharp`)
```
raw file
  → Validate (MIME, virus scan via ClamAV)
  → NSFW detection (AWS Rekognition / Google Vision API)
  → Strip EXIF metadata (removes GPS, device info)
  → Deduplicate (SHA-256 hash check — don't store memes twice)
  → Resize to 1080, 720, 360 versions
  → Convert ALL to WebP (30-50% smaller than JPEG)
  → Generate blurhash string (30 bytes, used as placeholder)
  → Upload processed versions to S3/R2 `images/{userId}/{postId}/`
  → Delete raw file from `raw/`
  → Update DB: status → "ready", store all CDN URLs
```

#### 4b — Video Processing (using `ffmpeg`)
```
raw video
  → Validate + virus scan
  → NSFW detection on key frames
  → Extract poster frame at 0.5s
  → Transcode to HLS with quality ladder:
      1080p @ 5Mbps
      720p  @ 2.5Mbps
      360p  @ 500kbps
  → Output: master.m3u8 + segmented .ts chunks (2-second segments)
  → Transcode audio to AAC
  → Upload all to S3/R2 `videos/{userId}/{postId}/`
  → Delete raw file from `raw/`
  → Update DB: status → "ready", store master.m3u8 CDN URL
```

### Step 5: DB Update + Socket Notification
- Update post status: `processing → ready`
- Push real-time socket event to user: `{ event: "media:ready", postId }`
- User's spinner disappears, post becomes live

---

## 🔐 Security Model

| Layer | What it does |
|---|---|
| **Private Bucket** | No direct public access — only backend & CDN origin can read |
| **IAM Roles** | Least-privilege: upload worker can only PUT, never DELETE manually |
| **Signed URLs (GET)** | Stories & DMs: 15-minute expiring access tokens |
| **Signed URLs (PUT)** | Direct upload flow: backend generates a 10-min PUT URL for client |
| **Cloudflare CDN** | Serves processed public content — S3 never hit by end users |
| **MIME Validation** | Server checks magic bytes, not just file extension |
| **ClamAV** | Virus scan every upload in the worker |
| **Rekognition** | NSFW auto-moderation before making content public |
| **EXIF Strip** | Removes GPS location from all images |
| **Rate Limiting** | 50 uploads/hour per user via Redis |
| **Deduplication** | SHA-256 hash prevents storing duplicate files |

---

## 💰 Storage Lifecycle Rules (Cost Optimization)

```
raw/              → Delete 24h after processing confirmation
images/           → S3 Standard (0–30 days)
                  → S3 Infrequent Access (30–180 days, 40% cheaper)
                  → S3 Glacier (180+ days, 80% cheaper)
stories/          → Auto-delete after 24h (S3 Lifecycle Policy)
deleted content   → Background job removes S3 files within 24h of post deletion
```

---

## 🌐 Feed API Response Format

Your API **never** returns raw S3 URLs. Always return CDN URLs:

```json
{
  "postId": "abc123",
  "status": "ready",
  "media": {
    "type": "image",
    "cdn_base": "https://cdn.suvix.in/images/user1/post1",
    "sizes": {
      "thumb": "360.webp",
      "feed": "720.webp",
      "full": "1080.webp",
      "og": "thumb.jpg"
    },
    "blurhash": "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    "width": 1080,
    "height": 1350
  }
}
```

```json
{
  "postId": "xyz789",
  "status": "ready",
  "media": {
    "type": "video",
    "hls_url": "https://cdn.suvix.in/videos/user1/post1/master.m3u8",
    "poster": "https://cdn.suvix.in/videos/user1/post1/poster.jpg",
    "duration": 30
  }
}
```

---

## 📦 Module File Structure

```
server/modules/storage/
│
├── MEDIA_ARCHITECTURE.md         ← This document
│
├── s3/
│   ├── s3.config.js              ← AWS S3Client init
│   ├── s3.service.js             ← Upload, Delete, SignedURL logic
│   ├── s3.constants.js           ← Bucket name, folder paths, cache policies
│   └── s3.utils.js               ← Key builders, content-type map, hash utils
│
├── r2/
│   ├── r2.config.js              ← Cloudflare R2 client (S3-compatible)
│   ├── r2.service.js             ← Same API surface as s3.service.js
│   ├── r2.constants.js           ← R2 bucket config, CDN base URL
│   └── r2.utils.js               ← Shared utils (or re-export from s3.utils.js)
│
├── processors/
│   ├── image.processor.js        ← sharp: resize, webp, blurhash, exif strip
│   ├── video.processor.js        ← ffmpeg: HLS, transcode, poster
│   ├── safety.processor.js       ← NSFW detection, virus scan, MIME validate
│   └── dedup.processor.js        ← SHA-256 deduplication logic
│
├── queue/
│   ├── media.queue.js            ← BullMQ queue definition
│   ├── media.worker.js           ← BullMQ worker (orchestrates processors)
│   └── media.jobs.js             ← Job payload types and enqueue helpers
│
├── cdn/
│   ├── cdn.config.js             ← CDN base URL, cache rule builder
│   └── cdn.utils.js              ← URL builder, cache headers, purge helpers
│
└── storageProvider.js            ← ⭐ THE ABSTRACTION LAYER
                                     Switch between S3 and R2 via env var
                                     All other modules import ONLY this file
```

---

## 🔄 Provider Abstraction (storageProvider.js)

This is the **most important file**. All app code imports this — never `s3.service.js` or `r2.service.js` directly. This allows a 1-line switch between providers.

```
STORAGE_PROVIDER=s3  → uses s3/ module
STORAGE_PROVIDER=r2  → uses r2/ module
```

---

## 🗓️ Phased Build Plan

### Phase 1 (NOW) — Foundation
- [x] Scaffold folder structure (S3 + R2 + processors + queue + cdn)
- [ ] Implement `s3.service.js` (upload, delete, signed URL)
- [ ] Implement `storageProvider.js` abstraction
- [ ] Basic image upload: validate + store original
- [ ] Update existing `utils/storageService.js` to delegate to new provider

### Phase 2 — Image Processing
- [ ] Install & configure `sharp`
- [ ] Implement `image.processor.js` (resize, webp, blurhash, EXIF strip)
- [ ] Implement `dedup.processor.js` (SHA-256)
- [ ] Wire BullMQ queue for async processing
- [ ] Update feed API to return multi-size CDN URLs

### Phase 3 — Video & Reels
- [ ] Install & configure `fluent-ffmpeg`
- [ ] Implement `video.processor.js` (HLS transcode, poster frame)
- [ ] HLS playback in mobile app
- [ ] Adaptive bitrate player integration

### Phase 4 — Safety & Security
- [ ] `safety.processor.js` — MIME validation
- [ ] ClamAV integration
- [ ] NSFW detection (AWS Rekognition)
- [ ] Rate limiting on upload endpoints

### Phase 5 — R2 & CDN
- [ ] Implement `r2.service.js`
- [ ] Implement `cdn.utils.js` + cache-control headers
- [ ] Set Cloudflare R2 as CDN origin
- [ ] S3 Lifecycle Rules (auto-delete raw, tiered storage)
- [ ] Provider switching via env var

---

## 🔧 Dependencies to Install

```bash
# Phase 1
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Phase 2
npm install sharp blurhash

# Phase 3
npm install fluent-ffmpeg

# Phase 5 (R2 uses same S3 SDK — no extra install)
```

---

## 📝 Environment Variables Needed

```env
# Provider Selection
STORAGE_PROVIDER=s3         # or r2

# AWS S3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=suvix-media
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Cloudflare R2
CF_ACCOUNT_ID=...
CF_R2_BUCKET=suvix-media-r2
CF_R2_ACCESS_KEY_ID=...
CF_R2_SECRET_ACCESS_KEY=...
CF_R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com

# CDN
CDN_BASE_URL=https://cdn.suvix.in
```
