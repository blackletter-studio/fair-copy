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
   * In-memory cache of every value we've read or written this session.
   *
   * Rationale: Office.context.roamingSettings is flaky under Word for Mac —
   * sometimes the object is present for reads but `saveAsync` fails silently,
   * or the object is transiently undefined between ticks. If we relied only
   * on roamingSettings, the counter would reset to 0 every click because
   * saveAsync doesn't actually persist, and the next `get` returns `null`.
   *
   * Strategy:
   *   - Every write goes to BOTH the in-memory map AND roamingSettings (if
   *     available). In-memory is the source of truth during the session.
   *   - Every read checks in-memory first. Falls through to roamingSettings
   *     only if we've never seen the key this session (first read after boot).
   *   - `saveAsync` attempts to flush to roamingSettings but tolerates failure.
   *
   * Result: the counter always advances correctly during a session, even when
   * persistence is flaky. Users lose state across full Word restarts if the
   * flakiness is permanent (worst case: an extra free clean on next launch —
   * not a security issue for a $49 product).
   */
  private memory = new Map<string, unknown>();

  private settings(): Office.RoamingSettings | null {
    const ctx = (
      globalThis as { Office?: { context?: { roamingSettings?: Office.RoamingSettings } } }
    ).Office?.context;
    return ctx?.roamingSettings ?? null;
  }
  get<T>(key: string): T | undefined {
    const namespaced = NAMESPACE + key;
    // In-memory wins — this is what makes the counter advance across clicks.
    if (this.memory.has(namespaced)) {
      return this.memory.get(namespaced) as T | undefined;
    }
    const s = this.settings();
    if (!s) return undefined;
    const raw = s.get(namespaced) as unknown;
    const value = raw === null || raw === undefined ? undefined : (raw as T);
    if (value !== undefined) this.memory.set(namespaced, value);
    return value;
  }
  set<T>(key: string, value: T): void {
    const namespaced = NAMESPACE + key;
    this.memory.set(namespaced, value);
    const s = this.settings();
    if (s) s.set(namespaced, value);
  }
  remove(key: string): void {
    const namespaced = NAMESPACE + key;
    this.memory.delete(namespaced);
    const s = this.settings();
    if (s) s.remove(namespaced);
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
