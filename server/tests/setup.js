import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

// ─── Mock Redis ──────────────────────────────────────────────────────────────
vi.mock("../config/redisClient.js", () => ({
  default: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve("OK")),
    del: vi.fn(() => Promise.resolve(1)),
    incr: vi.fn(() => Promise.resolve(1)),
    expire: vi.fn(() => Promise.resolve(1)),
    ping: vi.fn().mockResolvedValue("PONG"),
    call: vi.fn(() => Promise.resolve(null)),
  },
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve()),
  delCache: vi.fn(() => Promise.resolve()),
  delPattern: vi.fn(() => Promise.resolve()),
  publish: vi.fn(() => Promise.resolve()),
  subscribe: vi.fn(() => Promise.resolve()),
  redis: {
    ping: vi.fn().mockResolvedValue("PONG"),
    call: vi.fn(() => Promise.resolve(null)),
  },
  redisAvailable: false,
}));

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock("../config/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        // Resolve different test user roles based on the email or ID passed in tests
        // This satisfies both valid UUIDs and MongoDB-style ObjectIDs during tests
        if (where.email === "banned@test.com" || where.id === "69d245949e9f212dd7ff8acf") {
          return Promise.resolve({
            id: where.id || "69d245949e9f212dd7ff8acf",
            email: "banned@test.com",
            role: "client",
            is_banned: true,
            ban_reason: "Violation of terms",
          });
        }
        if (where.email === "editor@test.com" || where.id?.includes("f0")) {
          return Promise.resolve({
            id: where.id || "69d245969e9f212dd7ff8af0",
            email: "editor@test.com",
            role: "editor",
            is_banned: false,
          });
        }
        return Promise.resolve({
          id: where.id || "69d2459b9e9f212dd7ff8bc3",
          email: "client@test.com",
          role: "client",
          is_banned: false,
        });
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    order: { findUnique: vi.fn().mockResolvedValue(null) },
    siteSettings: {
      findUnique: vi.fn().mockResolvedValue({
        id: "settings-id",
        maintenance_mode: false,
      }),
    },
    proposal: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  },
}));

// ─── Mock Cache Utilities ─────────────────────────────────────────────────────
vi.mock("../utils/cache.js", () => ({
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve()),
  deleteCache: vi.fn(() => Promise.resolve()),
  CacheKey: {
    userProfile: (id) => `user:${id}`,
    gig: (id) => `gig:${id}`,
  },
  TTL: { USER_PROFILE: 300 },
}));

// ─── Mock Razorpay ────────────────────────────────────────────────────────────
vi.mock("../config/razorpay.js", () => ({
  default: null,
  isRazorpayConfigured: vi.fn(() => true), // Pretend it's configured
  getRazorpayKeyId: vi.fn(() => "rzp_test_mock_key"),
  verifyWebhookSignature: vi.fn((body, sig) => !!sig), // Only valid if signature exists
  verifyPaymentSignature: vi.fn(() => true),
}));

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
