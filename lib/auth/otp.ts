// OTP code generation + HMAC hashing for SMS re-auth.
// Codes are 6-digit numeric, hashed with the same secret that signs the
// invite cookie so the secret is consistent across the auth surface.

const enc = new TextEncoder();

function getSecret(): string {
  const s = process.env.INVITE_SESSION_SECRET;
  if (!s || s.length < 16) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'dev-fallback-secret-not-for-prod';
  }
  return s;
}

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0');
  return s;
}

export function generateOtpCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  // 4 bytes → 0..4_294_967_295 → mod 1_000_000 → 6-digit code
  const n = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, '0');
}

export async function hashOtp(phone: string, code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${phone}:${code}`));
  return bytesToHex(sig);
}
