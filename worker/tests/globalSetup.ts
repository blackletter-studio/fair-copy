import { build } from "vite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One-shot bundle of the Worker source from TypeScript to an ESM module
// that Miniflare can load via `scriptPath`. Miniflare itself does not
// transform TypeScript, so we bundle once before the test suite runs.
//
// The Miniflare 4.x runtime (workerd) accepts an ES module entry. We inline
// `jose` into the bundle so that the produced `.mjs` has no external
// imports — Miniflare executes it inside a Workers-compatible isolate that
// has no access to the host's node_modules.

const here = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.resolve(here, "..");

export async function setup(): Promise<void> {
  const outDir = path.join(workerRoot, "dist-test");
  await mkdir(outDir, { recursive: true });

  await build({
    root: workerRoot,
    logLevel: "error",
    configFile: false,
    build: {
      lib: {
        entry: path.join(workerRoot, "src/index.ts"),
        formats: ["es"],
        fileName: () => "worker.mjs",
      },
      outDir,
      emptyOutDir: true,
      target: "es2022",
      minify: false,
      rollupOptions: {
        // Bundle all deps (including `jose`) into the output so Miniflare
        // can load the entry as a self-contained Worker module.
        external: [],
      },
    },
  });
}

export async function teardown(): Promise<void> {
  // Leave the built artefact in place so subsequent local test runs can
  // re-use it if nothing changed; vite's `emptyOutDir: true` rebuild on
  // the next setup will overwrite it cleanly.
}
