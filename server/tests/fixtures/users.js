/**
 * Standard test users for the test suite.
 * User schema in Prisma uses 'id' (UUID-like strings here for compatibility).
 * Data matches the mocked Prisma returns in setup.js.
 */
export const testUsers = {
  editor: {
    id: "69d24596-9e9f-212d-d7ff-8af0",
    email: "editor@test.com",
    password: "password123",
    password_hash: "$2b$12$LQv3c1yqBWVHxkd0LpX9OuK1u3aHq.Hpx.3uTfHwVpGgG.L3G6H5W",
    name: "Test Editor",
    role: "editor",
    is_verified: true,
    is_onboarded: true,
    country: "IN",
    profile: {
      name: "Test Editor",
      category: { roleGroup: "PROVIDER" }
    }
  },
  client: {
    id: "69d2459b-9e9f-212d-d7ff-8bc3",
    email: "client@test.com",
    password: "password123",
    password_hash: "$2b$12$LQv3c1yqBWVHxkd0LpX9OuK1u3aHq.Hpx.3uTfHwVpGgG.L3G6H5W",
    name: "Test Client",
    role: "client",
    is_verified: true,
    is_onboarded: true,
    country: "IN",
    profile: {
      name: "Test Client",
      category: { roleGroup: "CLIENT" }
    }
  },
  banned: {
    id: "69d24594-9e9f-212d-d7ff-8acf",
    email: "banned@test.com",
    password: "password123",
    password_hash: "$2b$12$LQv3c1yqBWVHxkd0LpX9OuK1u3aHq.Hpx.3uTfHwVpGgG.L3G6H5W",
    name: "Banned User",
    role: "client",
    is_verified: true,
    is_onboarded: true,
    is_banned: true,
    ban_reason: "Violation of terms",
    country: "IN",
    profile: {
      name: "Banned User",
      category: { roleGroup: "CLIENT" }
    }
  },
};

/**
 * Compatibility helper for existing tests.
 * Since Prisma is mocked, we don't need to "seed" a real DB,
 * just return the standard user objects.
 */
export const seedUsers = async () => {
  return testUsers;
};
