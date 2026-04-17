#!/usr/bin/env tsx
import { readFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    role: { type: "string" },
    count: { type: "string", default: "1" },
    expiry: { type: "string" }, // ISO date, e.g. 2027-12-31
    note: { type: "string" },
    "recipient-email": { type: "string" },
    "worker-url": { type: "string" },
  },
});

if (!values.role) {
  console.error(
    "Usage: pnpm mint-code --role=<role> [--count=N] [--expiry=YYYY-MM-DD] [--note=...] [--recipient-email=...]",
  );
  process.exit(1);
}

const envFile = ".env";
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key]) {
      process.env[key] = rest
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}
const apiKey = process.env.MINT_API_KEY;
const workerUrl =
  values["worker-url"] ?? process.env.WORKER_URL ?? "https://fair-copy.blackletter.studio";
if (!apiKey) {
  console.error("MINT_API_KEY missing — add it to .env (gitignored).");
  process.exit(1);
}

const count = Number.parseInt(values.count ?? "1", 10);
const expiryOverride = values.expiry ? Math.floor(new Date(values.expiry).getTime() / 1000) : null;

const res = await fetch(`${workerUrl}/api/mint`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    role: values.role,
    count,
    expiryOverride,
    note: values.note ?? null,
    recipientEmail: values["recipient-email"] ?? null,
  }),
});
if (!res.ok) {
  console.error(`Mint failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const body = (await res.json()) as { codes: string[] };

const logPath = join(homedir(), ".fair-copy", "mint-log.csv");
mkdirSync(dirname(logPath), { recursive: true });
if (!existsSync(logPath)) {
  appendFileSync(logPath, "timestamp,role,code,note,recipientEmail\n");
}
const timestamp = new Date().toISOString();
for (const code of body.codes) {
  appendFileSync(
    logPath,
    `${timestamp},${values.role},${code},"${values.note ?? ""}","${values["recipient-email"] ?? ""}"\n`,
  );
  console.log(code);
}
console.error(`\nLogged ${body.codes.length} code(s) to ${logPath}`);
