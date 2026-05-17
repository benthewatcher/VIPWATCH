// Visitor records — one row per (browser tap, invite) pair. Created on the
// first /i/<token> or /wishlist/<token> tap. The name is captured later on
// the /welcome page. The session cookie carries the visitor_id so we can
// look it up on subsequent requests.

import { createClient as createSb, type SupabaseClient } from '@supabase/supabase-js';
import { hashIp } from './invite-session';

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Visitor = {
  id: string;
  invite_id: string | null;
  referred_by_name: string | null;
  shared_wishlist_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export async function createVisitor(opts: {
  inviteId: string;
  referredByName?: string | null;
  sharedWishlistId?: string | null;
  ip?: string;
  userAgent?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<Visitor | null> {
  const sb = serviceClient() as any;
  const { data, error } = await sb
    .from('visitors')
    .insert({
      invite_id: opts.inviteId,
      referred_by_name: opts.referredByName ?? null,
      shared_wishlist_id: opts.sharedWishlistId ?? null,
      ip_hash: opts.ip ? await hashIp(opts.ip) : null,
      user_agent: (opts.userAgent ?? '').slice(0, 500),
      name: opts.name ?? null,
      email: opts.email ?? null,
      phone: opts.phone ?? null,
    })
    .select('id, invite_id, referred_by_name, shared_wishlist_id, name, email, phone')
    .single();
  if (error || !data) {
    console.warn('[visitor] insert failed:', error?.message);
    return null;
  }
  return data as Visitor;
}

export async function getVisitor(id: string): Promise<Visitor | null> {
  if (!id) return null;
  const sb = serviceClient() as any;
  const { data } = await sb
    .from('visitors')
    .select('id, invite_id, referred_by_name, shared_wishlist_id, name, email, phone')
    .eq('id', id)
    .maybeSingle();
  return (data as Visitor | null) ?? null;
}

export async function updateVisitorName(
  id: string,
  fields: { name?: string | null; email?: string | null; phone?: string | null },
): Promise<void> {
  const sb = serviceClient() as any;
  const patch: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
  };
  if (fields.name !== undefined) patch.name = fields.name ?? null;
  if (fields.email !== undefined) patch.email = fields.email ?? null;
  if (fields.phone !== undefined) patch.phone = fields.phone ?? null;
  await sb.from('visitors').update(patch).eq('id', id);
}

export async function touchVisitor(id: string): Promise<void> {
  if (!id) return;
  const sb = serviceClient() as any;
  await sb.from('visitors').update({ last_seen_at: new Date().toISOString() }).eq('id', id);
}
