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
