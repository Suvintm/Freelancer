import express, { Router } from "express";
import AuthController from "./auth.controller.js";
import { protectAdmin } from "./auth.guard.js";

const router: Router = express.Router();

/**
 * Public Routes
 */
router.post("/login", AuthController.login);

/**
 * Protected Routes
 */
router.post("/logout", protectAdmin, AuthController.logout);
router.get("/me", protectAdmin, AuthController.getMe);

export default router;
