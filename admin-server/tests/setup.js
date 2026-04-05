import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

// Mock Redis to prevent hangs/connection issues in tests
vi.mock("../config/redisClient.js", () => ({
  default: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve("OK")),
    del: vi.fn(() => Promise.resolve(1)),
    call: vi.fn(() => Promise.resolve(1)),
    ping: vi.fn().mockResolvedValue("PONG"),
  },
  redisAvailable: false, // Set to false so rate limiters fallback to memory
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve("OK")),
  delCache: vi.fn(() => Promise.resolve(1)),
  publish: vi.fn(() => Promise.resolve(1)),
  subscribe: vi.fn(() => Promise.resolve()),
  redis: {
    ping: vi.fn().mockResolvedValue("PONG"),
  },
}));

// Mock Prisma for admin authentication
vi.mock("../config/prisma.js", () => ({
  default: {
    superAdmin: {
      findUnique: vi.fn(),
    },
    adminMember: {
      findUnique: vi.fn(),
    },
    adminActivityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

let mongoServer;

beforeAll(async () => {
  // Use a local mongo memory server instead of a real DB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Close existing connections if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear collections between tests to ensure isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
