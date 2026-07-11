import express from "express";
import { vpnCheckMiddleware } from "../../shared/middleware/vpn-check.middleware.js";

// Domain Public Contracts
import { authRouter, oauthRouter } from "../../domains/auth/index.js";
import { userRouter, profileRouter } from "../../domains/user/index.js";
import { notificationRouter } from "../../domains/notification/index.js";
import { paymentGatewayRouter, subscriptionRouter } from "../../domains/payment/index.js";
import { creatorRouter } from "../../domains/creator/index.js";
import { mediaRouter } from "../../domains/media/index.js";
import { postRouter, storyRouter, commentRouter } from "../../domains/content/index.js";
import { communityRouter } from "../../domains/community/index.js";

import { messagingRouter } from "../../domains/messaging/index.js";
import { pollRouter } from "../../domains/polls/index.js";

/**
 * 🚀 API GATEWAY - V1
 *
 * All version 1 routes are consolidated here.
 * This file serves as the centralized entry point for global V1 middleware
 * (e.g., analytics, tracing, payload sanitization specific to v1).
 */
const v1Router = express.Router();

// ─── AUTHENTICATION (VPN Checked) ──────────────────────────────────────────
v1Router.use("/auth", vpnCheckMiddleware, authRouter);
v1Router.use("/auth", vpnCheckMiddleware, oauthRouter);

// ─── DOMAINS ───────────────────────────────────────────────────────────────
v1Router.use("/user", userRouter);
v1Router.use("/notifications", notificationRouter);
v1Router.use("/media", mediaRouter);
v1Router.use("/social/stories", storyRouter);
v1Router.use("/social/comments", commentRouter);
v1Router.use("/social", postRouter); // Mount social base after specific sub-routes
v1Router.use("/profile", profileRouter);
v1Router.use("/youtube-creator", creatorRouter);
v1Router.use("/communities", communityRouter);
v1Router.use("/messages", messagingRouter);
v1Router.use("/polls", pollRouter);
v1Router.use("/payment-gateway", paymentGatewayRouter);
v1Router.use("/payments", subscriptionRouter);


export default v1Router;
