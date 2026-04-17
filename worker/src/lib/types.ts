// Duplicate of ../../../src/licensing/types.ts (minus the UI-only types).
// The worker is its own deployable with its own tsconfig (Workers globals,
// no browser DOM); copying four types is cheaper than introducing
// monorepo-level tooling. Keep them in sync when either file changes.

export type LicenseRole = "paying" | "friends-family" | "preview" | "partner";

export type LicenseFeature = "fair-copy";
