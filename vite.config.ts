import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { getHttpsServerOptions } from "office-addin-dev-certs/lib/main.js";

// Vite 8 dropped its built-in HTTPS cert generator, so we load certs from
// `office-addin-dev-certs` (a transitive dep of `office-addin-debugging`).
// Run `npx office-addin-dev-certs install` once on first clone — the CA gets
// added to the macOS/Windows keychain so both browsers and Word trust it.
export default defineConfig(async () => ({
  plugins: [react()],
  server: {
    port: 3000,
    https: await getHttpsServerOptions(),
  },
  build: {
    rollupOptions: {
      input: {
        taskpane: resolve(__dirname, "src/taskpane/index.html"),
        commands: resolve(__dirname, "src/commands/commands.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Exclude Playwright E2E specs; they run via `pnpm playwright test`.
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
  },
}));
