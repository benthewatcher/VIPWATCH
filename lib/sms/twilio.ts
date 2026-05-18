// Lightweight Twilio sender. Uses fetch + Basic auth — no SDK to install.
// Returns { ok: true } on success, { ok: false, error } otherwise.
// Designed to fail gracefully when env vars are missing so dev keeps working.

export type SendSmsResult =
  | { ok: true; messageSid: string | null }
  | { ok: false; error: string };

export async function sendSms(toPhone: string, body: string): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { ok: false, error: 'Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing).' };
  }

  const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!messagingService && !fromNumber) {
    return {
      ok: false,
      error: 'Twilio sender not configured (set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER).',
    };
  }

  const params = new URLSearchParams();
  params.set('To', toPhone);
  params.set('Body', body);
  if (messagingService) params.set('MessagingServiceSid', messagingService);
  else if (fromNumber) params.set('From', fromNumber);

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Twilio ${res.status}: ${text.slice(0, 240)}` };
  }
  const json = (await res.json().catch(() => ({}))) as { sid?: string };
  return { ok: true, messageSid: json.sid ?? null };
}

/**
 * Minimal phone normaliser: strip everything except digits and a leading '+'.
 * Doesn't validate country / length — just makes the format consistent before
 * we compare against the phone column on invites.
 */
export function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return (hasPlus ? '+' : '') + digits;
}
