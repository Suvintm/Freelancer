import express from 'express';
const router = express.Router();

import communityController from './controllers/communityController.js';
import * as memberController from './controllers/communityMemberController.js';
import * as postController from './controllers/communityPostController.js';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { requireCommunityExists, requireMembership, requireRole } from './middleware/community.middleware.js';
import { 
  feedLimiter, 
  interactionLimiter, 
  heavyLimiter, 
  publicApiLimiter 
} from '../../shared/middleware/rate-limiter.middleware.js';

// ── PUBLIC ROUTES ──────────────────────────────────────────────────────────
router.get('/discover', publicApiLimiter, communityController.discover);
router.get('/s/:slug', publicApiLimiter, communityController.getBySlug);

// ── PROTECTED ROUTES ────────────────────────────────────────────────────────
router.use(authenticate);

// Community CRUD
router.get('/me', publicApiLimiter, communityController.getMyCommunities);
router.post('/', heavyLimiter, communityController.create);

// Middleware for ID-based routes
router.use('/:id', requireCommunityExists);
router.get('/:id', publicApiLimiter, communityController.getById);

// Admin only community routes
router.patch('/:id', requireMembership, requireRole('ADMIN'), heavyLimiter, communityController.update);
router.delete('/:id', requireMembership, requireRole('ADMIN'), heavyLimiter, communityController.delete);

// ── MEMBERS ────────────────────────────────────────────────────────────────
router.post('/:id/join', interactionLimiter, memberController.joinCommunity);
router.delete('/:id/leave', interactionLimiter, requireMembership, memberController.leaveCommunity);

router.get('/:id/members', publicApiLimiter, memberController.listMembers);
router.delete('/:id/members/:userId', requireMembership, requireRole('ADMIN', 'MODERATOR'), interactionLimiter, memberController.kickMember);
router.post('/:id/members/:userId/ban', requireMembership, requireRole('ADMIN'), interactionLimiter, memberController.banMember);
router.patch('/:id/members/:userId/role', requireMembership, requireRole('ADMIN'), interactionLimiter, memberController.promoteMember);

// ── POSTS (Broadcast Channel) ─────────────────────────────────────────────
// Member only routes
router.use('/:id/posts', requireMembership);
router.get('/:id/posts', feedLimiter, postController.listPosts);
router.get('/:id/posts/:postId', feedLimiter, postController.getPost);
router.post('/:id/posts/:postId/react', interactionLimiter, postController.reactToPost);

// Admin/Mod only posting routes
router.post('/:id/posts', requireRole('ADMIN', 'MODERATOR'), interactionLimiter, postController.createPost);
router.patch('/:id/posts/:postId/pin', requireRole('ADMIN', 'MODERATOR'), interactionLimiter, postController.pinPost);

// Post deletion is custom checked (Author or Admin/Mod)
router.delete('/:id/posts/:postId', interactionLimiter, postController.deletePost);

export default router;
