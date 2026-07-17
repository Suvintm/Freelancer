import express from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { createPoll, respondToPoll, getPollPosts, getMyPolls, getPollDetails, likePoll } from "./controllers/pollController.js";
import { interactionLimiter } from "../../shared/middleware/rate-limiter.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/polls
 * @desc    Get recent polls
 * @access  Private/Public (Authenticated to see if voted)
 */
router.get("/", authenticate, getPollPosts);

/**
 * @route   POST /api/polls
 * @desc    Create a new poll (multiple choice or open-ended)
 * @access  Private
 */
router.post("/", authenticate, interactionLimiter, createPoll);

/**
 * @route   POST /api/polls/:id/respond
 * @desc    Submit a response or vote to a poll
 * @access  Private
 */
router.post("/:id/respond", authenticate, interactionLimiter, respondToPoll);

/**
 * @route   GET /api/polls/my-polls
 * @desc    Get polls created by current user
 * @access  Private
 */
router.get("/my-polls", authenticate, getMyPolls);

router.get("/:id/details", authenticate, getPollDetails);

/**
 * @route   POST /api/polls/:id/like
 * @desc    Like / Unlike a poll
 * @access  Private
 */
router.post("/:id/like", authenticate, likePoll);

export default router;
