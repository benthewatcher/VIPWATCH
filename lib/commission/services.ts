// Canonical list of bespoke services the atelier performs.
// Used by the admin commission form (as checkboxes) and the public spec
// section (rendered as cards). Adding to this list is the only step needed
// to surface a new service across both sides.

export const CANONICAL_SERVICES = [
  'Dial',
  'Hands',
  'Bezel',
  'Gem Setting',
  'Case',
  'Crown',
  'Bracelet',
  'Strap',
  'Box',
  'Packaging',
  'Movement Decoration',
  'PVD / DLC Finish',
] as const;

export type CanonicalService = (typeof CANONICAL_SERVICES)[number];

/** Parse a stored services_performed text blob into normalised lines. */
export function parseServices(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Serialise selected canonical items + freeform extras back to a single string. */
export function serialiseServices(selected: string[], extras: string[]): string {
  return [...selected, ...extras].filter(Boolean).join('\n');
}

/** Strip a leading "Bespoke " (any case) from a line. Lets us migrate
 * old stored values like "Bespoke Dial" without rewriting the DB. */
export function stripBespoke(line: string): string {
  return line.replace(/^\s*bespoke\s+/i, '').trim();
}

/** Case-insensitive match against the canonical list. Tolerates an optional
 * leading "Bespoke " prefix on the input so legacy rows still pre-tick. */
export function canonicalMatch(line: string): CanonicalService | null {
  const norm = stripBespoke(line).toLowerCase();
  const hit = CANONICAL_SERVICES.find((s) => s.toLowerCase() === norm);
  return hit ?? null;
}
