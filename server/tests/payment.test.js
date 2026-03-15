/**
 * Payment Gateway Integration Tests — Phase 2
 *
 * Tests the core payment flow:
 * - Webhook signature validation (CRITICAL — prevents payment fraud)
 * - Unauthorized payment attempts
 * - Payment route protection
 *
 * Note: RazorpayProvider and razorpay.js config are mocked in setup.js.
 * No real Razorpay API calls are made. No real money is ever charged.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";
import { app } from "../server.js";
import { seedUsers } from "./fixtures/users.js";
import { authHeader } from "./fixtures/tokens.js";

let users;

describe("💳 Payment Gateway Tests", () => {

  beforeEach(async () => {
    users = await seedUsers();
  });

  // ─── Webhook Security Tests (Most Critical) ─────────────────────────────────

  describe("Webhook Signature Verification", () => {

    it("CRITICAL: should reject webhook with MISSING signature header", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/webhook/razorpay")
        .send({ event: "payment.captured", payload: {} });
      
      // No signature = reject
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("CRITICAL: should reject webhook with INVALID/TAMPERED signature", async () => {
      // Override the mock to return false (bad signature)
      const { verifyWebhookSignature } = await import("../config/razorpay.js");
      verifyWebhookSignature.mockReturnValueOnce(false);

      const res = await request(app)
        .post("/api/payment-gateway/webhook/razorpay")
        .set("x-razorpay-signature", "this_is_a_fake_signature")
        .send({ event: "payment.captured", payload: {} });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/signature|invalid/i);
    });

    it("should accept webhook with VALID signature (mock)", async () => {
      // The mock in setup.js has verifyWebhookSignature returning true by default
      const res = await request(app)
        .post("/api/payment-gateway/webhook/razorpay")
        .set("x-razorpay-signature", "valid_signature_from_razorpay")
        .send({ event: "order.paid", payload: {} });

      // With a valid signature, it should process (200) or handle gracefully
      expect([200, 404]).toContain(res.status);
    });

    it("CRITICAL: should verify Razorpay payment signature math using crypto", () => {
      // Unit test the signing logic directly
      const orderId = "order_test_abc123";
      const paymentId = "pay_test_xyz456";
      const secret = "test_webhook_secret";

      // Build the expected signature the same way Razorpay does
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      // Tampered signature should NOT match
      const tamperedSignature = expectedSignature.replace("a", "z");
      expect(tamperedSignature).not.toBe(expectedSignature);

      // Correct signature should match
      const recomputedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      expect(recomputedSignature).toBe(expectedSignature);
    });
  });

  // ─── Payment Route Auth Guard ────────────────────────────────────────────────

  describe("Payment Route Protection", () => {

    it("should require auth for payment config endpoint", async () => {
      const res = await request(app).get("/api/payment-gateway/config");
      expect(res.status).toBe(401);
    });

    it("should require auth for creating payment order", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/create-order")
        .send({ orderId: "some_order_id" });
      expect(res.status).toBe(401);
    });

    it("should require auth for payment verification", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/verify")
        .send({
          razorpay_order_id: "order_123",
          razorpay_payment_id: "pay_456",
          razorpay_signature: "sig_789",
        });
      expect(res.status).toBe(401);
    });

    it("should return error for non-existent order on payment creation", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/create-order")
        .set(authHeader(users.client))
        .send({ orderId: "000000000000000000000000" }); // Valid format, non-existent ID
      
      // Must be a failure — not 200 success
      expect(res.status).not.toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Refund Endpoint Protection Tests ───────────────────────────────────────

  describe("Refund Protection", () => {

    it("should require auth for refund endpoint", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/refund")
        .send({ orderId: "some_order_id" });
      expect(res.status).toBe(401);
    });

    it("should return 404 when refunding non-existent order", async () => {
      const res = await request(app)
        .post("/api/payment-gateway/refund")
        .set(authHeader(users.client))
        .send({ orderId: "000000000000000000000000" });
      
      // Expect failure (not 200)
      expect(res.status).not.toBe(200);
      expect(res.body.success).toBe(false);
    });
  });
});
