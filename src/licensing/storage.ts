const KEY = "fair-copy.license-token";

function officeSettings(): Office.Settings | null {
  // In jsdom tests Office is undefined; in dev outside Word, also undefined.
  if (typeof Office === "undefined" || !Office.context) return null;
  try {
    return Office.context.document?.settings ?? null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const settings = officeSettings();
  if (settings) {
    const value = settings.get(KEY);
    if (typeof value === "string") return value;
    return null;
  }
  const value = localStorage.getItem(KEY);
  return value ?? null;
}

export function setStoredToken(token: string): void {
  const settings = officeSettings();
  if (settings) {
    settings.set(KEY, token);
    settings.saveAsync();
    return;
  }
  localStorage.setItem(KEY, token);
}

export function clearStoredToken(): void {
  const settings = officeSettings();
  if (settings) {
    settings.remove(KEY);
    settings.saveAsync();
    return;
  }
  localStorage.removeItem(KEY);
}
