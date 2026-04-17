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
  get<T>(key: string): T | undefined {
    const raw = Office.context.roamingSettings.get(NAMESPACE + key) as unknown;
    return raw === null || raw === undefined ? undefined : (raw as T);
  }
  set<T>(key: string, value: T): void {
    Office.context.roamingSettings.set(NAMESPACE + key, value);
  }
  remove(key: string): void {
    Office.context.roamingSettings.remove(NAMESPACE + key);
  }
  saveAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      Office.context.roamingSettings.saveAsync((result) => {
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
