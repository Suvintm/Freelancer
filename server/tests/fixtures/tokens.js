import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../../server.js";

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

/**
 * Get a token by actually calling the login API.
 * Use this when you want to test the full login flow.
 */
export const loginAndGetToken = async (email, password) => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
};

/**
 * Generate a JWT token directly — faster, no API call needed.
 * Use this in tests where you just need a valid auth header.
 */
export const generateTestToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Get Authorization header string ready for supertest .set()
 */
export const authHeader = (user) => ({
  Authorization: `Bearer ${generateTestToken(user)}`,
});
