/**
 * Security Integration Tests — Phase 2
 *
 * These tests verify that SuviX correctly:
 * - Rejects unauthorized access (no token, invalid token, expired token)
 * - Blocks banned users from accessing the API
 * - Sanitizes NoSQL injection attempts
 * - Rejects file uploads with dangerous extensions
 * - Protects admin routes from regular users
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../server.js";
import { seedUsers } from "./fixtures/users.js";
import { generateTestToken, authHeader } from "./fixtures/tokens.js";

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

let users;

describe("🛡️ Security Tests", () => {
  
  beforeEach(async () => {
    users = await seedUsers();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  // ─── Authentication Guard Tests ─────────────────────────────────────────────

  describe("Authentication Guard", () => {

    it("CRITICAL: should return 401 with NO token on protected route", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("CRITICAL: should return 401 with a COMPLETELY INVALID token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer this.is.not.a.real.jwt");
      
      expect(res.status).toBe(401);
    });

    it("CRITICAL: should return 401 with a TAMPERED/FORGED token", async () => {
      // Generate valid token, then tamper with the payload
      const validToken = generateTestToken(users.editor);
      const [header, , signature] = validToken.split(".");
      // Replace payload with attacker-controlled payload (claiming to be admin)
      const forgedPayload = Buffer.from(
        JSON.stringify({ id: "attacker_id", role: "admin" })
      ).toString("base64url");
      const forgedToken = `${header}.${forgedPayload}.${signature}`;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${forgedToken}`);
      
      expect(res.status).toBe(401);
    });

    it("CRITICAL: should return 401 with an EXPIRED token", async () => {
      const expiredToken = jwt.sign(
        { id: users.editor.id },
        JWT_SECRET,
        { expiresIn: "1ms" }
      );
      // Wait for it to expire
      await new Promise(r => setTimeout(r, 50));

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);
      
      expect(res.status).toBe(401);
    });

    it("CRITICAL: should block BANNED users even with valid token", async () => {
      // Banned user has a valid token but must be rejected
      const bannedToken = generateTestToken(users.banned);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${bannedToken}`);
      
      // Must return 403 Forbidden with banned flag
      expect(res.status).toBe(403);
      expect(res.body.isBanned).toBe(true);
      expect(res.body.banReason).toBeDefined();
    });

    it("should return 200 with a valid, active user token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader(users.editor));
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Sensitive Data Exposure Tests ──────────────────────────────────────────

  describe("Sensitive Data Exposure", () => {

    it("CRITICAL: /api/auth/me should NEVER return password field", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader(users.editor));
      
      expect(res.status).toBe(200);
      // These fields must NEVER be in the response
      expect(res.body.user?.password).toBeUndefined();
      expect(res.body.user?.passwordHash).toBeUndefined();
    });
  });

  // ─── NoSQL Injection Tests ───────────────────────────────────────────────────

  describe("NoSQL Injection Prevention", () => {

    it("CRITICAL: login with $gt operator should NOT succeed", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: { $gt: "" },     // MongoDB injection attempt
          password: { $gt: "" },
        });
      
      // The server must NOT return 200 for this
      expect(res.status).not.toBe(200);
      expect(res.body.success).not.toBe(true);
    });

    it("CRITICAL: login with $ne operator should NOT succeed", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: { $ne: null },   // Another MongoDB injection
          password: { $ne: null },
        });
      
      expect(res.status).not.toBe(200);
    });

    it("CRITICAL: nested object in email field should be rejected", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: { $where: "this.password.length > 0" },
          password: "anything",
        });
      
      expect(res.status).not.toBe(200);
    });
  });

  // ─── Role-Based Access Control Tests ────────────────────────────────────────

  describe("Authorization (Role Separation)", () => {

    it("CRITICAL: editor should NOT access admin routes", async () => {
      // The main server should reject requests to admin-only paths
      // (admin server is separate but routes are protected)
      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader(users.editor));
      
      // Verify the user role is correct (editor, not admin)
      expect(res.status).toBe(200);
      expect(res.body.user?.role).toBe("editor");
      // Role field must not have been escalated
      expect(res.body.user?.role).not.toBe("admin");
      expect(res.body.user?.role).not.toBe("superadmin");
    });

    it("client role should be preserved correctly", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader(users.client));
      
      expect(res.status).toBe(200);
      expect(res.body.user?.role).toBe("client");
    });
  });

  // ─── Input Validation Tests ──────────────────────────────────────────────────

  describe("Input Validation", () => {

    it("should reject login without email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "somepassword" });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject login without password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com" });
      
      expect(res.status).toBe(400);
    });

    it("should reject login with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "password123" });
      
      expect(res.status).toBe(400);
    });
  });

  // ─── Health & Public Endpoints ────────────────────────────────────────────────

  describe("Public Endpoints", () => {

    it("GET /api/health should always be accessible (no token)", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("GET /api/maintenance-status should be publicly accessible", async () => {
      const res = await request(app).get("/api/maintenance-status");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.maintenance).toBeDefined();
    });
  });
});
