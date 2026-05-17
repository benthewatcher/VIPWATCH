// Signed-cookie session for invite-only public access.
//
// Uses Web Crypto (works in both Edge and Node runtimes) so this module can
// be imported by middleware AND server actions without bundler errors.

export const COOKIE_NAME = 'vipw_session';
const DAYS = 60;
const SECRET_ENV = 'INVITE_SESSION_SECRET';

export type SessionPayload = {
  iid: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const s = process.env[SECRET_ENV];
  if (!s || s.length < 16) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'dev-fallback-secret-not-for-prod';
  }
  return s;
}

const enc = new TextEncoder();

function b64urlFromBytes(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(enc.encode(str));
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) {
    s += u8[i].toString(16).padStart(2, '0');
  }
  return s;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bytesToHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function createSessionCookie(inviteId: string, ttlDays: number = DAYS) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iid: inviteId,
    iat: now,
    exp: now + ttlDays * 24 * 60 * 60,
  };
  const body = b64urlFromString(JSON.stringify(payload));
  const sig = await sign(body);
  return {
    name: COOKIE_NAME,
    value: `${body}.${sig}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ttlDays * 24 * 60 * 60,
  };
}

export async function verifySessionCookie(
  value: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!value) return null;
  const idx = value.lastIndexOf('.');
  if (idx <= 0) return null;
  const body = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = await sign(body);
  if (!timingSafeEqualHex(sig, expected)) return null;
  try {
    const json = new TextDecoder().decode(b64urlDecode(body));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.iid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export async function hashIp(ip: string): Promise<string> {
  const data = enc.encode(ip + '|' + getSecret());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(digest).slice(0, 32);
}

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteToken(): string {
  const out: string[] = [];
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 12; i++) {
    out.push(TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length]);
    if (i === 3 || i === 7) out.push('-');
  }
  return out.join('');
}
