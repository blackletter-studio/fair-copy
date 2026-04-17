import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, https: true },
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
});
