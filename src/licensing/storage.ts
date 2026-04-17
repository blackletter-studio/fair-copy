const KEY = "fair-copy.license-token";

/**
 * License tokens live in `Office.context.roamingSettings` (per-user, per-add-in,
 * follows the user across documents + machines) rather than
 * `Office.context.document.settings` (per-document — would lose the license
 * every time the user opens a new doc). Falls back to `localStorage` when
 * Office isn't present (dev / jsdom tests).
 */
function officeRoamingSettings(): Office.RoamingSettings | null {
  if (typeof Office === "undefined" || !Office.context) return null;
  try {
    return Office.context.roamingSettings ?? null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const settings = officeRoamingSettings();
  if (settings) {
    const value = settings.get(KEY) as unknown;
    if (typeof value === "string") return value;
    return null;
  }
  const value = localStorage.getItem(KEY);
  return value ?? null;
}

export function setStoredToken(token: string): void {
  const settings = officeRoamingSettings();
  if (settings) {
    settings.set(KEY, token);
    // saveAsync is fire-and-forget; the Office stub in tests accepts the
    // callback and calls back synchronously with Succeeded.
    settings.saveAsync(() => {
      /* ignore — no recovery path if Office says Failed */
    });
    return;
  }
  localStorage.setItem(KEY, token);
}

export function clearStoredToken(): void {
  const settings = officeRoamingSettings();
  if (settings) {
    settings.remove(KEY);
    settings.saveAsync(() => {
      /* ignore */
    });
    return;
  }
  localStorage.removeItem(KEY);
}
