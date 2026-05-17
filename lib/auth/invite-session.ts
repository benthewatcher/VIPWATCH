// Signed-cookie session for invite-only public access.
//
// We don't use Supabase Auth on the public side (admin keeps using it). When
// a visitor taps a valid /i/<token> link we set a single signed cookie that
// the middleware checks for every request to /[locale]/*.
//
// Cookie format: `<base64url(payload)>.<hex(hmac_sha256(payload))>`
// Payload is JSON `{ iid: <invite id>, exp: <unix seconds>, iat: ... }`.
// Signed with INVITE_SESSION_SECRET — must be set in env. 32+ random chars.

import crypto from 'node:crypto';

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
    // Fall back to anon key so dev still works if env not set — DO NOT rely
    // on this in production, set INVITE_SESSION_SECRET explicitly.
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'dev-fallback-secret-not-for-prod';
  }
  return s;
}

function b64urlEncode(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createSessionCookie(inviteId: string, ttlDays: number = DAYS) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iid: inviteId,
    iat: now,
    exp: now + ttlDays * 24 * 60 * 60,
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = sign(body);
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

export function verifySessionCookie(value: string | undefined | null): SessionPayload | null {
  if (!value) return null;
  const idx = value.lastIndexOf('.');
  if (idx <= 0) return null;
  const body = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = sign(body);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
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

/** Hash an IP (best-effort dedupe / abuse signal) without storing the raw IP. */
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + '|' + getSecret()).digest('hex').slice(0, 32);
}

/** Generate a human-friendly URL-safe token in the format ABCD-EFGH-IJKL. */
export function generateInviteToken(): string {
  // Crockford-style base32, no easily-confused characters
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const chunks = [0, 0, 0].map(() => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += alphabet[crypto.randomInt(alphabet.length)];
    }
    return s;
  });
  return chunks.join('-');
}
