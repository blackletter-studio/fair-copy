/**
 * Thin typed wrapper around Office.context.roamingSettings.
 *
 * Keys are namespaced under "bl-" to avoid collision with other add-ins.
 */
export interface SettingsStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  saveAsync(): Promise<void>;
}

const NAMESPACE = "bl-";

export class OfficeRoamingSettingsStore implements SettingsStore {
  /**
   * Safely resolve Office.context.roamingSettings. It can transiently become
   * undefined under Word for Mac after a Word.run batch returns (and in other
   * edge cases), so every access guards against that rather than throwing
   * TypeError mid-flow. Callers then treat missing-store as "no persisted
   * value" which is the correct graceful degradation for trial counters,
   * theme preference, first-run flag, etc.
   */
  private settings(): Office.RoamingSettings | null {
    const ctx = (
      globalThis as { Office?: { context?: { roamingSettings?: Office.RoamingSettings } } }
    ).Office?.context;
    return ctx?.roamingSettings ?? null;
  }
  get<T>(key: string): T | undefined {
    const s = this.settings();
    if (!s) return undefined;
    const raw = s.get(NAMESPACE + key) as unknown;
    return raw === null || raw === undefined ? undefined : (raw as T);
  }
  set<T>(key: string, value: T): void {
    const s = this.settings();
    if (!s) return;
    s.set(NAMESPACE + key, value);
  }
  remove(key: string): void {
    const s = this.settings();
    if (!s) return;
    s.remove(NAMESPACE + key);
  }
  saveAsync(): Promise<void> {
    // Office.context.roamingSettings.saveAsync has a known flaky behavior where
    // the callback sometimes never fires (add-in idle, memory pressure, etc.).
    // Without a timeout, any awaiter hangs forever — which locks up the Clean
    // button state machine. We fall back to a 3-second timeout: if the callback
    // hasn't fired by then, we resolve best-effort because the in-memory write
    // via Office.context.roamingSettings.set() already happened and the value
    // will persist on the next successful save. Logging lets us spot chronic
    // saveAsync failures in DevTools.
    const s = this.settings();
    if (!s) {
      // No roamingSettings available — silently resolve so the caller's flow
      // continues. In-memory state is already lost in this case; persistence
      // will resume on the next call that finds roamingSettings populated.
      return Promise.resolve();
    }
    const TIMEOUT_MS = 3000;
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        // eslint-disable-next-line no-console
        console.warn(
          `roamingSettings.saveAsync timed out after ${TIMEOUT_MS}ms — resolving best-effort. In-memory set() already happened; value will persist on next save.`,
        );
        resolve();
      }, TIMEOUT_MS);
      s.saveAsync((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (result.status === Office.AsyncResultStatus.Succeeded) resolve();
        else reject(new Error(result.error?.message ?? "saveAsync failed"));
      });
    });
  }
}

/** In-memory store for unit tests. */
export class InMemorySettingsStore implements SettingsStore {
  private data = new Map<string, unknown>();
  get<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }
  remove(key: string): void {
    this.data.delete(key);
  }
  async saveAsync(): Promise<void> {
    /* no-op for tests */
  }
  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }
}
