import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
});


describe("Main Server API", () => {
  
  it("GET /api/health - should return healthy status", async () => {
    const res = await request(app).get("/api/health");
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET / - should return welcome message", async () => {
    const res = await request(app).get("/");
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("SuviX Backend is running");
  });

  it("POST /api/auth/login - should fail with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@suvix.com",
        password: "wrongpassword123"
      });
    
    // The specific status code might vary (401, 400, or 404 depending on implementation)
    // We just want to ensure it doesn't return 200/Success
    expect(res.status).not.toBe(200);
    expect(res.body.success).toBe(false);
  });
});
