import "@testing-library/jest-dom";

// Minimal Office.js stub so components under test don't crash on Office.onReady
// or on OfficeRoamingSettingsStore access in App bootstrap.
interface RoamingSettingsStub {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  remove: (key: string) => void;
  saveAsync: (cb: (result: { status: unknown; error?: { message: string } }) => void) => void;
}

interface OfficeStub {
  onReady: (cb?: () => void) => Promise<void>;
  context: { roamingSettings: RoamingSettingsStub };
  AsyncResultStatus: { Succeeded: string; Failed: string };
}

const roamingData = new Map<string, unknown>();

(globalThis as unknown as { Office: OfficeStub }).Office = {
  onReady: (cb?: () => void) => {
    // Support both overloads: Office.onReady() returning a Promise, and
    // Office.onReady(cb) which fires the callback synchronously.
    if (cb) cb();
    return Promise.resolve();
  },
  context: {
    roamingSettings: {
      get: (key: string) => roamingData.get(key) ?? null,
      set: (key: string, value: unknown) => {
        roamingData.set(key, value);
      },
      remove: (key: string) => {
        roamingData.delete(key);
      },
      saveAsync: (cb) => {
        cb({ status: "Succeeded" });
      },
    },
  },
  AsyncResultStatus: { Succeeded: "Succeeded", Failed: "Failed" },
};
