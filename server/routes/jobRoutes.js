/**
 * Job Routes - API routes for job portal
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createJob,
  getJobs,
  getJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  getMyJobs,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  hireEditor,
  getMyApplications,
  withdrawApplication,
  getJobStats,
} from "../controllers/jobController.js";

const router = express.Router();

// Public routes
router.get("/", getJobs);                              // List all active jobs

// IMPORTANT: /my/* routes MUST come BEFORE /:id routes to prevent "my" being captured as id
router.get("/my/posts", protect, getMyJobs);           // My posted jobs (client)
router.get("/my/stats", protect, getJobStats);         // Job stats (client)
router.get("/my/applications", protect, getMyApplications); // My applications (editor)

// Protected routes - Job management (Clients)
router.post("/", protect, createJob);                  // Create job
router.put("/:id", protect, updateJob);                // Update job
router.patch("/:id/status", protect, updateJobStatus); // Change status
router.delete("/:id", protect, deleteJob);             // Delete job

// Protected routes - Applications
router.post("/:id/apply", protect, applyToJob);                        // Apply to job
router.get("/:id/applications", protect, getJobApplications);          // View applicants
router.patch("/applications/:applicationId", protect, updateApplicationStatus); // Update status
router.post("/applications/:applicationId/hire", protect, hireEditor); // Hire editor
router.patch("/applications/:applicationId/withdraw", protect, withdrawApplication); // Withdraw

// Single job - MUST be last to not capture other routes
router.get("/:id", protect, getJob);                   // Get single job

export default router;
