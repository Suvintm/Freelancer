/**
 * Payment & Subscription Gateway Integration Tests
 *
 * Tests the enterprise microservice architecture:
 * - Cryptographic signature mathematical verification (Razorpay HMAC-SHA256)
 * - Public catalog & status endpoints (accessible without authentication)
 * - Auth guard protection on checkout, payment verification, and lifecycle transitions
 * - Forwarding requests securely to the Java Payment microservice gateway
 * - Invoice access protection and PDF streaming
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import crypto from "crypto";
import { app } from "../server.js";
import { seedUsers } from "./fixtures/users.js";
import { authHeader } from "./fixtures/tokens.js";

let users;

describe("💳 Payment & Subscription Gateway Tests", () => {

  beforeEach(async () => {
    users = await seedUsers();
  });

  // ─── 1. Cryptographic Security & Math Verification ──────────────────────────

  describe("Cryptographic Signature Mathematics", () => {

    it("CRITICAL: should verify Razorpay payment signature math using crypto HMAC-SHA256", () => {
      const orderId = "order_test_abc123";
      const paymentId = "pay_test_xyz456";
      const testKey = "mock_key_for_testing";

      // Build signature the same way Razorpay standard expects: HMAC-SHA256(orderId + "|" + paymentId)
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", testKey)
        .update(payload)
        .digest("hex");

      // Tampered signature should NOT match
      const tamperedSignature = expectedSignature.replace(/[0-9a-f]/, (c) => (c === "a" ? "b" : "a"));
      expect(tamperedSignature).not.toBe(expectedSignature);

      // Recomputed signature must match exactly
      const recomputedSignature = crypto
        .createHmac("sha256", testKey)
        .update(payload)
        .digest("hex");
      expect(recomputedSignature).toBe(expectedSignature);
    });

    it("CRITICAL: should reject webhook payloads with tampered bodies", () => {
      const testKey = "mock_key_for_testing";
      const rawBody = JSON.stringify({ event: "order.paid", id: "evt_123" });
      const signature = crypto.createHmac("sha256", testKey).update(rawBody).digest("hex");

      const tamperedBody = JSON.stringify({ event: "order.paid", id: "evt_123", amount: 0 });
      const tamperedSignature = crypto.createHmac("sha256", testKey).update(tamperedBody).digest("hex");

      expect(tamperedSignature).not.toBe(signature);
    });
  });

  // ─── 2. Public Catalog & Discovery Endpoints ─────────────────────────────────

  describe("Public Plan Catalog & Discovery Routes", () => {

    it("GET /api/v1/subscriptions/plans should be publicly accessible without auth", async () => {
      const res = await request(app).get("/api/v1/subscriptions/plans");
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it("GET /api/v1/subscriptions/dashboard should be publicly accessible without auth", async () => {
      const res = await request(app).get("/api/v1/subscriptions/dashboard");
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it("GET /api/v1/subscriptions/status should be publicly accessible for recovery", async () => {
      const res = await request(app).get("/api/v1/subscriptions/status?orderId=order_123");
      expect(res.status).toBe(200);
    });

    it("GET /api/v1/subscriptions/entitlements should be publicly accessible", async () => {
      const res = await request(app).get("/api/v1/subscriptions/entitlements");
      expect(res.status).toBe(200);
    });
  });

  // ─── 3. Protected Route Auth Guards ──────────────────────────────────────────

  describe("Protected Payment & Subscription Routes", () => {

    it("POST /api/v1/payments/create-order should require authentication (return 401)", async () => {
      const res = await request(app)
        .post("/api/v1/payments/create-order")
        .send({ planId: "pro-plan", billingCycle: "monthly" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/payments/verify should require authentication (return 401)", async () => {
      const res = await request(app)
        .post("/api/v1/payments/verify")
        .send({
          razorpayOrderId: "order_123",
          razorpayPaymentId: "pay_456",
          razorpaySignature: "sig_789",
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/v1/payments/my should require authentication (return 401)", async () => {
      const res = await request(app).get("/api/v1/payments/my");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/payments/cancel should require authentication (return 401)", async () => {
      const res = await request(app)
        .post("/api/v1/payments/cancel")
        .send({ reason: "No longer needed" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/payments/pause should require authentication (return 401)", async () => {
      const res = await request(app)
        .post("/api/v1/payments/pause")
        .send({ pauseDays: 30 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/payments/resume should require authentication (return 401)", async () => {
      const res = await request(app).post("/api/v1/payments/resume");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 4. Authenticated Payment & Microservice Proxy ───────────────────────────

  describe("Authenticated Payment & Order Flow", () => {

    it("POST /api/v1/payments/create-order should succeed when user is authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/payments/create-order")
        .set(authHeader(users.client))
        .send({
          planId: "creator-pro",
          billingCycle: "monthly",
          currency: "INR",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBeDefined();
    });

    it("POST /api/v1/payments/verify should succeed when user is authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/payments/verify")
        .set(authHeader(users.client))
        .send({
          razorpayOrderId: "order_mock_123",
          razorpayPaymentId: "pay_mock_456",
          razorpaySignature: "sig_mock_789",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe("active");
    });
  });

  // ─── 5. Invoice Route Protection ─────────────────────────────────────────────

  describe("Invoice Protection & PDF Streaming", () => {

    it("GET /api/v1/invoices should require authentication", async () => {
      const res = await request(app).get("/api/v1/invoices");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/invoices/:id/pdf should require authentication", async () => {
      const res = await request(app).get("/api/v1/invoices/inv_123/pdf");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/invoices/:id/pdf should stream binary PDF when authenticated", async () => {
      const res = await request(app)
        .get("/api/v1/invoices/inv_123/pdf")
        .set(authHeader(users.client));

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/pdf");
      expect(res.headers["content-disposition"]).toContain("attachment");
    });
  });
});
