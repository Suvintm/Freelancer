/**
 * ⭐ STORAGE PROVIDER — ABSTRACTION LAYER
 *
 * THIS IS THE ONLY FILE THE REST OF THE APP SHOULD IMPORT.
 * Never import s3.service.js or r2.service.js directly.
 *
 * Controls which storage backend is active via:
 *   STORAGE_PROVIDER=s3   → uses AWS S3
 *   STORAGE_PROVIDER=r2   → uses Cloudflare R2
 *
 * This means switching from S3 to R2 (or back) is a single env variable change.
 * Zero code changes needed in controllers or services.
 *
 * Usage:
 *   import storage from "../storage/storageProvider.js";
 *   await storage.uploadObject(buffer, key, options);
 *   const url = await storage.getSignedUrl(key);
 */

// TODO (Phase 1): Import and switch based on STORAGE_PROVIDER env var
//
// import * as s3 from "./s3/s3.service.js";
// import * as r2 from "./r2/r2.service.js";
//
// const provider = process.env.STORAGE_PROVIDER === "r2" ? r2 : s3;
// export default provider;

export default {};
