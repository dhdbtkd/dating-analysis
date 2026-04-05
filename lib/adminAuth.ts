export const ADMIN_COOKIE = 'admin_token';

/** Derives a session token from the admin password. Stateless — no DB needed. */
export async function deriveSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':admin_session_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const expected = await deriveSessionToken(password);
  return token === expected;
}
