// Synchronize environment for test mode
process.env.JWT_SECRET = "suvix_dev_secret";
process.env.NODE_ENV = "test";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

// ─── Mock Redis (Legacy & Monolith Paths) ────────────────────────────────────
const mockRedisClient = {
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve("OK")),
  del: vi.fn(() => Promise.resolve(1)),
  incr: vi.fn(() => Promise.resolve(1)),
  expire: vi.fn(() => Promise.resolve(1)),
  ping: vi.fn().mockResolvedValue("PONG"),
  call: vi.fn(() => Promise.resolve(null)),
  pipeline: vi.fn(() => ({
    get: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    del: vi.fn().mockReturnThis(),
    srem: vi.fn().mockReturnThis(),
    sadd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(() => Promise.resolve([])),
  })),
};

const mockRedisModule = {
  default: mockRedisClient,
  redis: mockRedisClient,
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve()),
  delCache: vi.fn(() => Promise.resolve()),
  delPattern: vi.fn(() => Promise.resolve()),
  publish: vi.fn(() => Promise.resolve()),
  subscribe: vi.fn(() => Promise.resolve()),
  redisAvailable: false,
};

vi.mock("../config/redisClient.js", () => mockRedisModule);
vi.mock("../src/infrastructure/cache/redis.client.js", () => mockRedisModule);

// ─── Mock Prisma (Legacy & Monolith Paths) ────────────────────────────────────
import { testUsers } from "./fixtures/users.js";

const mockPrismaClient = {
  user: {
    findUnique: vi.fn().mockImplementation(({ where }) => {
      // Find user by email or ID from the fixture
      const user = Object.values(testUsers).find(u => 
        u.email === where.email || u.id === where.id
      );
      
      if (user) {
        return Promise.resolve({
          ...user,
          is_banned: user.is_banned || false,
          ban_reason: user.ban_reason || null,
        });
      }
      return Promise.resolve(null);
    }),
    update: vi.fn().mockResolvedValue({}),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  userProfile: {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  },
  userStats: {
    create: vi.fn().mockResolvedValue({}),
  },
  userRoleMapping: {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  roleCategory: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  roleSubCategory: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  subscription: {
    findFirst: vi.fn().mockResolvedValue(null),
  },
  youtubeProfile: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  order: { findUnique: vi.fn().mockResolvedValue(null) },
  siteSettings: {
    findUnique: vi.fn().mockResolvedValue({
      id: "settings-id",
      maintenance_mode: false,
    }),
  },
  proposal: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
};

vi.mock("../config/prisma.js", () => ({
  default: mockPrismaClient,
}));

vi.mock("../src/infrastructure/database/postgres.js", () => ({
  default: mockPrismaClient,
  connectPostgres: vi.fn().mockResolvedValue(true),
}));

// ─── Mock Cache Utilities (Legacy & Monolith Paths) ───────────────────────────
const mockCacheModule = {
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve()),
  deleteCache: vi.fn(() => Promise.resolve()),
  CacheKey: {
    userProfile: (id) => `user:${id}`,
    gig: (id) => `gig:${id}`,
  },
  TTL: { USER_PROFILE: 300 },
};

vi.mock("../utils/cache.js", () => mockCacheModule);
vi.mock("../src/shared/utils/cache.js", () => mockCacheModule);

// ─── Mock Java Payment Microservice Gateway ──────────────────────────────────
export const mockPaymentServiceResponses = {
  plans: { plans: [{ id: "starter-plan", name: "Starter", priceMonthly: 0, currency: "INR" }], currency: "INR" },
  dashboard: { plans: [], activeSubscription: null, role: "creator", currency: "INR" },
  createOrder: { success: true, orderId: "order_mock_123", amount: 50000, currency: "INR" },
  verify: { success: true, status: "active" },
};

vi.mock("../src/infrastructure/gateway/javaPayment.client.js", () => ({
  paymentServiceClient: {
    get: vi.fn().mockResolvedValue({ data: Buffer.from("%PDF-1.4"), headers: { "content-type": "application/pdf" } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  callPaymentService: vi.fn(async ({ path }) => {
    if (path.includes("/dashboard")) return mockPaymentServiceResponses.dashboard;
    if (path.includes("/plans")) return mockPaymentServiceResponses.plans;
    if (path.includes("/create-order") || path.includes("/create")) return mockPaymentServiceResponses.createOrder;
    if (path.includes("/verify")) return mockPaymentServiceResponses.verify;
    return { success: true };
  }),
  proxyToPaymentService: vi.fn(async (req, res, method, path) => {
    if (path.includes("/dashboard")) return res.status(200).json(mockPaymentServiceResponses.dashboard);
    if (path.includes("/plans")) return res.status(200).json(mockPaymentServiceResponses.plans);
    if (path.includes("/create-order") || path.includes("/create")) return res.status(200).json(mockPaymentServiceResponses.createOrder);
    if (path.includes("/verify")) return res.status(200).json(mockPaymentServiceResponses.verify);
    return res.status(200).json({ success: true, method, path });
  }),
}));

// ─── Mock Firebase Admin ──────────────────────────────────────────────────────
vi.mock("../utils/firebaseAdmin.js", () => ({
  initFirebaseAdmin: vi.fn(),
  getFirebaseAdmin: vi.fn(() => ({
    messaging: () => ({
      send: vi.fn().mockResolvedValue("projects/suvix/messages/mock"),
    }),
    auth: () => ({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "firebase_test_uid" }),
    }),
  })),
}));

// ─── Mock Cloudinary ──────────────────────────────────────────────────────────
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: "https://res.cloudinary.com/test/image/upload/test.jpg",
        public_id: "test_public_id",
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));


let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
