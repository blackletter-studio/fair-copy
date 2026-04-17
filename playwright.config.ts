import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  reporter: "list",
  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  // Workers run sequentially — Word sideload is stateful per machine
  workers: 1,
});
