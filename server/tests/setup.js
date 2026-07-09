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

// ─── Mock Razorpay (Legacy & Monolith Paths) ──────────────────────────────────
const mockRazorpayModule = {
  default: null,
  isRazorpayConfigured: vi.fn(() => true), // Pretend it's configured
  getRazorpayKeyId: vi.fn(() => "rzp_test_mock_key"),
  verifyWebhookSignature: vi.fn((body, sig) => !!sig), // Only valid if signature exists
  verifyPaymentSignature: vi.fn(() => true),
};

vi.mock("../src/domains/payment/services/razorpay.config.js", () => mockRazorpayModule);

vi.mock("../services/RazorpayProvider.js", () => ({
  RazorpayProvider: vi.fn().mockImplementation(() => ({
    createOrder: vi.fn().mockResolvedValue({
      orderId: "order_mock_123",
      amount: 50000,
      currency: "INR",
    }),
    verifyPayment: vi.fn().mockResolvedValue({ success: true }),
    processRefund: vi.fn().mockResolvedValue({ refundId: "refund_mock_456" }),
    createPayout: vi.fn().mockResolvedValue({ payoutId: "payout_mock_789" }),
  })),
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
