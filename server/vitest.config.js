import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    testTimeout: 30000,
    env: {
      JWT_SECRET: "suvix_dev_secret",
      NODE_ENV: "test",
    },
  },
});
