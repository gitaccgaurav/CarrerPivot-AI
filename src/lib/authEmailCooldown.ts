const EMAIL_REQUEST_COOLDOWN_MS = 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 10 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cooldownKey(email: string) {
  return `careerPivot.authEmailCooldown.${normalizeEmail(email)}`;
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function isAuthEmailRateLimit(message: string) {
  return /rate limit|too many|429/i.test(message);
}

export function startAuthEmailCooldown(email: string, durationMs = EMAIL_REQUEST_COOLDOWN_MS) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(cooldownKey(email), String(Date.now() + durationMs));
}

export function startAuthEmailRateLimitCooldown(email: string) {
  startAuthEmailCooldown(email, RATE_LIMIT_COOLDOWN_MS);
}

export function getAuthEmailCooldownSeconds(email: string) {
  const storage = getStorage();
  if (!storage || !email.trim()) return 0;

  const cooldownUntil = Number(storage.getItem(cooldownKey(email)));
  if (!Number.isFinite(cooldownUntil)) return 0;

  const remainingMs = cooldownUntil - Date.now();
  if (remainingMs <= 0) {
    storage.removeItem(cooldownKey(email));
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

export function formatCooldown(seconds: number) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

export function getNormalizedAuthEmail(email: string) {
  return normalizeEmail(email);
}
