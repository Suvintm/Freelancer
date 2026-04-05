import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import User from "../models/User.js";
import { SiteSettings } from "../models/SiteSettings.js";
import SuperAdmin from "../models/SuperAdmin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const JWT_SECRET = "testsecret123";

describe("🛠️ Admin Actions Integration Tests", () => {
  let adminToken;
  let testUser;

  beforeEach(async () => {
    // 1. Create a SuperAdmin
    const hashedPassword = await bcrypt.hash("adminpass123", 10);
    const admin = await SuperAdmin.create({
      name: "Test Admin",
      email: "admin@suvix.com",
      password: hashedPassword,
      role: "superadmin"
    });

    // Mock Prisma behavior for protectAdmin middleware
    prisma.superAdmin.findUnique.mockResolvedValue({
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: "superadmin",
      is_active: true,
      permissions: {
        users: true,
        settings: true,
        analytics: true
      }
    });

    // Generate Token
    adminToken = jwt.sign({ id: admin._id.toString(), role: "superadmin", isAdmin: true }, JWT_SECRET);

    // 2. Create a User to ban
    testUser = await User.create({
      name: "Bad User",
      email: "baduser@test.com",
      password: "password123",
      role: "client",
      country: "IN"
    });

    // 3. Initialize Site Settings
    await SiteSettings.create({
      maintenanceMode: false,
      maintenanceMessage: "Down for maintenance"
    });

    process.env.JWT_SECRET = JWT_SECRET;
  });

  // ─── User Moderation Tests ──────────────────────────────────────────────────

  describe("User Moderation", () => {
    it("should allow banning a user", async () => {
      const res = await request(app)
        .post("/api/admin/users/bulk-status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userIds: [testUser._id],
          isBanned: true,
          banReason: "Spamming"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isBanned).toBe(true);
      expect(updatedUser.banReason).toBe("Spamming");
    });

    it("should allow unbanning a user", async () => {
      // First ban them
      testUser.isBanned = true;
      await testUser.save();

      const res = await request(app)
        .post("/api/admin/users/bulk-status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userIds: [testUser._id],
          isBanned: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isBanned).toBe(false);
    });
  });

  // ─── Site Settings Tests ────────────────────────────────────────────────────

  describe("Site Settings & Maintenance", () => {
    it("should allow toggling maintenance mode ON", async () => {
      const res = await request(app)
        .patch("/api/admin/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          maintenanceMode: true,
          maintenanceMessage: "Upgrading servers"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.maintenanceMode).toBe(true);

      // Verify in DB
      const settings = await SiteSettings.getSettings();
      expect(settings.maintenanceMode).toBe(true);
      expect(settings.maintenanceMessage).toBe("Upgrading servers");
    });

    it("GET /maintenance-status should handle public requests", async () => {
      // Toggle it ON first
      const settings = await SiteSettings.getSettings();
      settings.maintenanceMode = true;
      await settings.save();

      const res = await request(app).get("/api/admin/maintenance-status");
      
      expect(res.status).toBe(200);
      expect(res.body.maintenance.isActive).toBe(true);
    });
  });
});
