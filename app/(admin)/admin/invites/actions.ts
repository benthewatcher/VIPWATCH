'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateInviteToken } from '@/lib/auth/invite-session';

export type CreateInviteInput = {
  label: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  max_uses?: number | null;        // null / undefined = unlimited
  expires_in_days?: number | null; // default 30
};

export async function createInvite(input: CreateInviteInput) {
  const supabase = (await createClient()) as any;
  const expiresInDays = input.expires_in_days ?? 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  // 6 retries to dodge the astronomically unlikely token collision.
  for (let i = 0; i < 6; i++) {
    const token = generateInviteToken();
    const { data, error } = await supabase
      .from('invites')
      .insert({
        token,
        label: input.label.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
        max_uses: input.max_uses ?? null,
        expires_at: expiresAt,
      })
      .select('id, token')
      .single();
    if (!error && data) {
      revalidatePath('/admin/invites');
      return { ok: true as const, id: data.id as string, token: data.token as string };
    }
    if (error && !/duplicate key/i.test(error.message)) {
      return { ok: false as const, error: error.message };
    }
  }
  return { ok: false as const, error: 'Could not generate a unique token. Try again.' };
}

export async function revokeInvite(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('invites').update({ is_revoked: true }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/invites');
  revalidatePath(`/admin/invites/${id}`);
}

export async function unrevokeInvite(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('invites').update({ is_revoked: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/invites');
  revalidatePath(`/admin/invites/${id}`);
}

export async function deleteInvite(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('invites').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/invites');
}
