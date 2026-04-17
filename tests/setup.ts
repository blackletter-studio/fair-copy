import "@testing-library/jest-dom";

// Minimal Office.js stub so components under test don't crash on Office.onReady
interface OfficeStub {
  onReady: (cb: () => void) => Promise<void>;
}

(globalThis as unknown as { Office: OfficeStub }).Office = {
  onReady: (cb: () => void) => {
    cb();
    return Promise.resolve();
  },
};
