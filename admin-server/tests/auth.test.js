import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import AdminRole from "../models/AdminRole.js";
import SuperAdmin from "../models/SuperAdmin.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

describe("Admin Auth API", () => {
  
  beforeEach(async () => {
    // Seed some initial data for testing
    // We use findOneAndUpdate with upsert to avoid duplicate errors if beforeEach runs
    await AdminRole.findOneAndUpdate(
      { value: "editor_manager" },
      {
        name: "Editor Manager",
        value: "editor_manager",
        isActive: true,
        permissions: { users: true }
      },
      { upsert: true, new: true }
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("testpass123", salt);
    
    await SuperAdmin.findOneAndUpdate(
      { email: "test@suvix.com" },
      {
        name: "Test SuperAdmin",
        email: "test@suvix.com",
        password: hashedPassword,
        role: "superadmin"
      },
      { upsert: true, new: true }
    );
  });

  it("GET /api/admin/auth/roles - should return list of roles", async () => {
    // Verify seeded data exists in DB
    const count = await AdminRole.countDocuments();
    console.log("DEBUG: AdminRole count in DB before request:", count);

    const res = await request(app).get("/api/admin/auth/roles");
    
    if (res.status !== 200 || !res.body.roles?.some(r => r.id === "editor_manager")) {
      console.log("ROLES DEBUG:", JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.roles).toBeDefined();
    // Superadmin should be there by default from the route logic
    expect(res.body.roles.some(r => r.id === "superadmin")).toBe(true);
    // Our seeded role should be there
    expect(res.body.roles.some(r => r.id === "editor_manager")).toBe(true);
  });

  it("POST /api/admin/auth/login - should fail with wrong credentials", async () => {
    const res = await request(app)
      .post("/api/admin/auth/login")
      .send({
        email: "test@suvix.com",
        password: "wrongpassword",
        role: "superadmin"
      });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/admin/auth/login - should succeed with correct credentials", async () => {
    // Force env vars for test consistency
    process.env.SUPER_ADMIN_EMAIL = "test@suvix.com";
    process.env.SUPER_ADMIN_PASSWORD = "testpass123";
    process.env.JWT_SECRET = "testsecret123";

    const res = await request(app)
      .post("/api/admin/auth/login")
      .send({
        email: "test@suvix.com",
        password: "testpass123",
        role: "superadmin"
      });
    
    if (res.status !== 200) console.log("LOGIN ERROR:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});
