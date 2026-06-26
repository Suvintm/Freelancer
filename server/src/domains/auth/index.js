// src/domains/auth/index.js
export { default as authRouter } from './authRoutes.js';
export { default as oauthRouter } from './oauthRoutes.js';
export { verifyAccessToken, generateAccessToken } from './services/token.service.js';
export { resolvePrimaryIdentity, formatAuthResponse } from './services/identity.service.js';
