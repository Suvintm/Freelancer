/**
 * Proposal Routes - For Open Briefs feature
 */
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import {
  submitProposal,
  getProposalsForBrief,
  getMyProposals,
  shortlistProposal,
  acceptProposal,
  verifyAcceptancePayment,
  rejectProposal,
  withdrawProposal,
  getProposalStats,
} from "../controllers/proposalController.js";

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// ============ EDITOR ROUTES ============
// Submit proposal
router.post("/", protect, submitProposal);

// Get my proposals (editor)
router.get("/my", protect, getMyProposals);

// Get proposal stats (editor)
router.get("/stats", protect, getProposalStats);

// Withdraw proposal
router.delete("/:id", protect, withdrawProposal);

// ============ CLIENT ROUTES ============
// Get proposals for a brief
router.get("/brief/:briefId", protect, getProposalsForBrief);

// Shortlist/unshortlist proposal
router.patch("/:id/shortlist", protect, shortlistProposal);

// Accept proposal (creates Razorpay order)
router.post("/:id/accept", protect, acceptProposal);

// Verify payment and finalize acceptance
router.post("/verify-payment", protect, verifyAcceptancePayment);

// Reject proposal
router.patch("/:id/reject", protect, rejectProposal);

export default router;
