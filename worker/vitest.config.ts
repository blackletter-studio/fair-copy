import { defineConfig } from "vitest/config";

// Isolated Vitest config for the Worker package. Without this, Vitest walks
// up the tree and picks up fair-copy/vite.config.ts, which registers a jsdom
// setup file that doesn't exist here.
//
// `globalSetup` bundles `src/index.ts` to `dist-test/worker.mjs` once per
// run so Miniflare (which does not compile TypeScript) can load the Worker
// entry via `scriptPath`.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    // Miniflare spins up a workerd subprocess per Miniflare instance; give
    // tests headroom for the bundle-and-boot cycle.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
